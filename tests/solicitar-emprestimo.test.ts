import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { findMembership, type Context } from '../src/server/api/context';
import { appRouter } from '../src/server/api/root';

const database = 'empresti_loans_test_' + randomUUID().replaceAll('-', '');
const docker = ['compose', 'exec', '-T', 'postgres'];
const photoBase = new URL('https://example.invalid/storage/v1/object/public/equipment-photos/');
let created = false;
let db: PrismaClient;
let tenantId: string;
let otherTenantId: string;

function run(args: string[], input?: string) {
  const result = spawnSync('docker', args, { input, encoding: 'utf8', timeout: 15000 });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function sql(input: string, destination = database) {
  return run([...docker, 'psql', '-XqAt', '-U', 'postgres', '-d', destination, '-v', 'ON_ERROR_STOP=1'], input);
}

function caller(identity: Context['identity']) {
  // The test exercises tRPC and Prisma. Supabase authentication is verified in the delivery environment.
  return appRouter.createCaller({ db, identity, photoBase, supabase: null as unknown as Context['supabase'] });
}

async function member(tenant = tenantId) {
  const authUserId = randomUUID();
  const profile = await db.user.create({
    data: {
      authUserId, name: 'Pessoa de teste', email: `${authUserId}@example.invalid`,
      memberships: { create: { tenantId: tenant, role: 'MEMBER' } },
    },
  });
  const identity = { id: profile.id, email: profile.email, name: profile.name, tenantId: tenant, role: 'MEMBER' as const };
  return { identity, authUserId, api: caller(identity) };
}

function errorCode(code: TRPCError['code'], message?: RegExp) {
  return (error: unknown) => error instanceof TRPCError && error.code === code && (!message || message.test(error.message));
}

before(async () => {
  const port = run(['compose', 'port', 'postgres', '5432']);
  assert.match(port, /:5433$/);
  sql(`CREATE DATABASE "${database}";`, 'postgres');
  created = true;
  for (const migration of ['0001_init', '0002_equipment_photos_and_cables']) {
    sql(readFileSync(path.join('prisma', 'migrations', migration, 'migration.sql'), 'utf8'));
  }
  sql(readFileSync(path.join('prisma', 'seed-equipments.sql'), 'utf8'));
  const url = new URL(`postgresql://postgres@127.0.0.1:5433/${database}`);
  url.password = run([...docker, 'printenv', 'POSTGRES_PASSWORD']);
  db = new PrismaClient({ datasourceUrl: url.href });
  tenantId = (await db.tenant.findUniqueOrThrow({ where: { slug: 'suporte_ti' } })).id;
  otherTenantId = (await db.tenant.create({ data: { slug: 'outro', name: 'Outro tenant' } })).id;
  await db.equipment.createMany({ data: [
    { tenantId: otherTenantId, patrimony: 'OUTRO-1', category: 'NOTEBOOK', name: 'Equipamento de outro tenant' },
    { tenantId, patrimony: 'FORA-1', category: 'CABLE', name: 'Item fora de uso', status: 'OUT_OF_SERVICE' },
  ] });
});

after(async () => {
  await db?.$disconnect();
  if (created) sql(`DROP DATABASE "${database}";`, 'postgres');
});

test('CA-01 — catálogo lista o tenant, imagens e situações e a tela contém o crédito', async () => {
  const { api } = await member();
  const catalog = await api.catalog.list();
  assert.equal(catalog.length, 12);
  assert.ok(catalog.every((item) => item.photoUrl === new URL(`suporte_ti/${item.patrimony}.jpg`, photoBase).href));
  assert.deepEqual(catalog.filter((item) => item.status === 'MAINTENANCE').map((item) => item.patrimony),
    ['TI-0004', 'TI-0007', 'TI-0010']);
  assert.ok(!catalog.some((item) => ['OUTRO-1', 'FORA-1'].includes(item.patrimony)));
  assert.match(readFileSync('index.html', 'utf8'), /href="https:\/\/pixabay\.com\/"[^>]*>Fotos: Pixabay<\/a>/);
});

test('CA-02 — cria imediatamente, grava 14 dias corridos e altera a disponibilidade', async () => {
  const { api, identity } = await member();
  const loan = await api.loans.request({ patrimony: 'TI-0001' });
  assert.equal(Date.parse(loan.dueDate) - Date.parse(loan.borrowedAt), 14 * 86400000);
  const saved = await db.loan.findUniqueOrThrow({ where: { id: loan.id } });
  assert.equal(saved.userId, identity.id);
  assert.equal(saved.tenantId, tenantId);
  assert.equal(saved.dueDate.toISOString(), loan.dueDate);
  assert.equal((await caller(identity).catalog.list()).find((item) => item.patrimony === 'TI-0001')?.status, 'BORROWED');
  assert.equal(await db.auditLog.count({ where: { resourceId: loan.id, action: 'loan.request' } }), 1);
});

test('CA-03 — permite o terceiro e recusa o quarto com motivo', async () => {
  const { api } = await member();
  for (const patrimony of ['TI-0002', 'TI-0003', 'TI-0005']) await api.loans.request({ patrimony });
  await assert.rejects(api.loans.request({ patrimony: 'TI-0006' }), errorCode('PRECONDITION_FAILED', /limite de 3/));
  assert.equal((await api.loans.mine()).length, 3);
});

test('CA-04 — bloqueia atraso aberto e libera após registro de devolução', async () => {
  const { api, identity } = await member();
  const gear = await db.equipment.findUniqueOrThrow({ where: { tenantId_patrimony: { tenantId, patrimony: 'TI-0008' } } });
  const overdue = await db.loan.create({
    data: { tenantId, userId: identity.id, equipmentId: gear.id, borrowedAt: new Date(Date.now() - 15 * 86400000), dueDate: new Date(Date.now() - 86400000) },
  });
  await assert.rejects(api.loans.request({ patrimony: 'TI-0006' }), errorCode('PRECONDITION_FAILED', /em atraso/));
  assert.equal((await api.loans.mine()).length, 1);
  await db.loan.update({ where: { id: overdue.id }, data: { returnedAt: new Date() } });
  await api.loans.request({ patrimony: 'TI-0006' });
  assert.deepEqual((await api.loans.mine()).map((loan) => loan.patrimony), ['TI-0006']);
});

test('CA-05 — manutenção, fora de uso e empréstimo aberto são recusados', async () => {
  const { api } = await member();
  for (const patrimony of ['TI-0004', 'FORA-1', 'TI-0001']) {
    await assert.rejects(api.loans.request({ patrimony }), errorCode('CONFLICT', /não está disponível/));
  }
  assert.deepEqual(await api.loans.mine(), []);
});

test('CA-05 — pedidos simultâneos do mesmo item gravam só um empréstimo', async () => {
  const [first, second] = await Promise.all([member(), member()]);
  const results = await Promise.allSettled([first.api.loans.request({ patrimony: 'TI-0009' }), second.api.loans.request({ patrimony: 'TI-0009' })]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  const denied = results.find((result) => result.status === 'rejected');
  assert.ok(denied && errorCode('CONFLICT')(denied.reason));
  assert.equal(await db.loan.count({ where: { tenantId, equipment: { patrimony: 'TI-0009' }, returnedAt: null } }), 1);
});

test('CA-05 — pedidos de itens diferentes em paralelo respeitam o limite', async () => {
  const { api } = await member();
  const patrimonies = ['PAR-1', 'PAR-2', 'PAR-3', 'PAR-4'];
  await db.equipment.createMany({ data: patrimonies.map((patrimony) => ({ tenantId, patrimony, name: patrimony, category: 'CABLE' })) });
  for (const patrimony of patrimonies.slice(0, 2)) await api.loans.request({ patrimony });
  const results = await Promise.allSettled(patrimonies.slice(2).map((patrimony) => api.loans.request({ patrimony })));
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  const denied = results.find((result) => result.status === 'rejected');
  assert.ok(denied && errorCode('PRECONDITION_FAILED', /limite de 3/)(denied.reason));
  assert.equal((await api.loans.mine()).length, 3);
});

test('CA-06 — Meus empréstimos mostra somente os próprios abertos e a data prevista', async () => {
  const { api, identity } = await member();
  assert.deepEqual(await api.loans.mine(), []);
  const loan = await api.loans.request({ patrimony: 'TI-0011' });
  assert.deepEqual(await api.loans.mine(), [{
    ...loan, patrimony: 'TI-0011', name: 'Webcam Full HD', category: 'CAMERA',
  }]);
  const other = await member(otherTenantId);
  assert.deepEqual(await other.api.loans.mine(), []);
  await db.loan.update({ where: { id: loan.id }, data: { returnedAt: new Date() } });
  assert.deepEqual(await caller(identity).loans.mine(), []);
});

test('CA-07 — exige vínculo autenticado e isola consultas e solicitações por tenant', async () => {
  const guest = caller(null);
  await assert.rejects(guest.catalog.list(), errorCode('UNAUTHORIZED'));
  await assert.rejects(guest.loans.mine(), errorCode('UNAUTHORIZED'));
  await assert.rejects(guest.loans.request({ patrimony: 'TI-0012' }), errorCode('UNAUTHORIZED'));
  const { api, authUserId, identity } = await member();
  assert.deepEqual(await findMembership(db, authUserId), identity);
  const outsider = await member(otherTenantId);
  assert.equal(await findMembership(db, outsider.authUserId), null);
  await assert.rejects(api.loans.request({ patrimony: 'OUTRO-1' }), errorCode('NOT_FOUND'));
  await assert.rejects(outsider.api.loans.request({ patrimony: 'TI-0012' }), errorCode('NOT_FOUND'));
  assert.deepEqual((await outsider.api.catalog.list()).map((item) => item.patrimony), ['OUTRO-1']);
});
