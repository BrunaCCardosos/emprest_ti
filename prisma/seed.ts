/**
 * Seed idempotente (ADR-001 §5): cria o tenant inicial `suporte_ti`.
 *
 * Pode rodar quantas vezes for preciso — `upsert` garante que repetir não
 * duplica nem sobrescreve. Usuários NÃO entram por aqui: o cadastro é fechado
 * e feito por convite de administrador (ADR-001 §7).
 *
 * Execução (após `prisma migrate deploy`):
 *   npx prisma db seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.tenant.upsert({
    where: { slug: 'suporte_ti' },
    update: {},
    create: {
      slug: 'suporte_ti',
      name: 'Suporte de TI',
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
