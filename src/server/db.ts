import { PrismaClient } from '@prisma/client';

const globalPrisma = globalThis as typeof globalThis & { emprestiPrisma?: PrismaClient };

export const db = globalPrisma.emprestiPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalPrisma.emprestiPrisma = db;
