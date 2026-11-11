const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { after, before, test } = require('node:test');

const project = path.resolve(__dirname, '..');
const database = 'empresti_seed_test_' + randomUUID().replaceAll('-', '');
const migrations = ['0001_init', '0002_equipment_photos_and_cables'];
const seed = readFileSync(path.join(project, 'prisma', 'seed-equipments.sql'), 'utf8');
let created = false;

function query(sql, destination = database) {
  const result = spawnSync('docker', [
    'compose', 'exec', '-T', 'postgres', 'psql',
    '-XqAt', '-U', 'postgres', '-d', destination, '-v', 'ON_ERROR_STOP=1',
  ], { cwd: project, input: sql, encoding: 'utf8', timeout: 15000 });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function initialEquipment() {
  return JSON.parse(query(`
    SELECT json_agg(to_jsonb(e) ORDER BY e.patrimony)
    FROM public.equipments AS e
    JOIN public.tenants AS t ON t.id = e.tenant_id
    WHERE t.slug = 'suporte_ti' AND e.patrimony BETWEEN 'TI-0001' AND 'TI-0012';
  `));
}

before(() => {
  query(`CREATE DATABASE "${database}";`, 'postgres');
  created = true;
  for (const migration of migrations) {
    query(readFileSync(path.join(project, 'prisma', 'migrations', migration, 'migration.sql'), 'utf8'));
  }
  const result = query(seed).split(/\r?\n/);
  assert.equal(result.length, 12);
  assert.ok(result.every((line) => line.endsWith('|criado')));
});

after(() => {
  if (created) query(`DROP DATABASE "${database}";`, 'postgres');
});

test('CA-01 — cadastra os 12 patrimônios da lista com os nomes e categorias da prática', () => {
  const rows = initialEquipment();
  assert.deepEqual(rows.map(({ patrimony }) => patrimony),
    Array.from({ length: 12 }, (_, index) => 'TI-' + String(index + 1).padStart(4, '0')));
  assert.deepEqual(rows.map(({ name, category }) => [name, category]), [
    ['Notebook 14 polegadas', 'NOTEBOOK'], ['Notebook 15 polegadas', 'NOTEBOOK'],
    ['Notebook 13 polegadas', 'NOTEBOOK'], ['Notebook 15 polegadas', 'NOTEBOOK'],
    ['Monitor 24 polegadas', 'MONITOR'], ['Monitor 27 polegadas', 'MONITOR'],
    ['Monitor 22 polegadas', 'MONITOR'], ['Cabo HDMI 2 m', 'CABLE'],
    ['Cabo USB-C 1 m', 'CABLE'], ['Cabo de rede 3 m', 'CABLE'],
    ['Webcam Full HD', 'CAMERA'], ['Câmera compacta', 'CAMERA'],
  ]);
  assert.ok(rows.every(({ patrimony, photo_path }) => photo_path === `suporte_ti/${patrimony}.jpg`));
});

test('CA-02 — começa com três em manutenção, nove disponíveis e zero empréstimos', () => {
  const rows = initialEquipment();
  assert.deepEqual(rows.filter(({ status }) => status === 'MAINTENANCE').map(({ patrimony }) => patrimony),
    ['TI-0004', 'TI-0007', 'TI-0010']);
  assert.equal(rows.filter(({ status }) => status === 'AVAILABLE').length, 9);
  assert.equal(query('SELECT count(*) FROM public.loans;'), '0');
});

test('CA-05 — repetir mantém IDs, caminhos e registros existentes e relata divergências', () => {
  const original = initialEquipment();
  const second = query(seed).split(/\r?\n/);
  assert.equal(second.length, 12);
  assert.ok(second.every((line) => line.endsWith('|já conferido')));
  assert.deepEqual(initialEquipment(), original);

  query(`
    INSERT INTO public.tenants (id, slug, name, updated_at)
    VALUES (gen_random_uuid(), 'outro_tenant', 'Outro tenant', now());

    INSERT INTO public.equipments (id, tenant_id, patrimony, name, category, updated_at)
    SELECT gen_random_uuid(), id, 'TI-0001', 'Patrimônio de outro tenant', 'ACCESSORY'::public.equipment_category, now()
    FROM public.tenants WHERE slug = 'outro_tenant'
    UNION ALL
    SELECT gen_random_uuid(), id, 'EXTRA-01', 'Equipamento preexistente', 'ACCESSORY', now()
    FROM public.tenants WHERE slug = 'suporte_ti';

    UPDATE public.equipments SET status = 'OUT_OF_SERVICE', photo_path = 'foto-existente.jpg'
    WHERE patrimony = 'TI-0002';
    UPDATE public.equipments SET photo_path = NULL WHERE patrimony = 'TI-0003';
  `);
  const preservedSql = `
    SELECT json_agg(to_jsonb(e) ORDER BY e.patrimony, e.id)
    FROM public.equipments AS e
    JOIN public.tenants AS t ON t.id = e.tenant_id
    WHERE t.slug = 'outro_tenant' OR e.patrimony IN ('TI-0002', 'EXTRA-01');
  `;
  const preserved = query(preservedSql);
  const result = query(seed);
  assert.match(result, /^TI-0002\|divergência preservada$/m);
  assert.match(result, /^TI-0003\|foto preenchida$/m);
  assert.equal(query(preservedSql), preserved);
  const rows = initialEquipment();
  assert.deepEqual(rows.map(({ id }) => id), original.map(({ id }) => id));
  assert.equal(rows.find(({ patrimony }) => patrimony === 'TI-0003').photo_path, 'suporte_ti/TI-0003.jpg');
});

test('CA-06 — vínculo local repetível usa a identidade existente, papel MEMBER e zero empréstimos', () => {
  const email = 'marcelo.grilo@institutojef.org.br';
  query(`
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY, email text UNIQUE NOT NULL);
    INSERT INTO auth.users VALUES (gen_random_uuid(), '${email}');
  `);
  const link = readFileSync(path.join(project, 'prisma', 'link-teacher.sql'), 'utf8');
  query(link);
  query(link);
  assert.equal(query(`
    SELECT count(*)
    FROM public.users AS u
    JOIN auth.users AS a ON a.id::text = u.auth_user_id AND a.email = u.email
    JOIN public.memberships AS m ON m.user_id = u.id AND m.role = 'MEMBER'
    JOIN public.tenants AS t ON t.id = m.tenant_id AND t.slug = 'suporte_ti'
    WHERE u.email = '${email}' AND NOT EXISTS (SELECT 1 FROM public.loans AS l WHERE l.user_id = u.id);
  `), '1');
});
