import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import type { TenantDatabase } from '../tenant-db';

const MAX_OPEN_LOANS = 3;
const LOAN_DURATION_MS = 13 * 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export async function requestLoan(db: TenantDatabase, userId: string, patrimony: string) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await db.serializable(async (tx) => {
        const item = await tx.findEquipment(patrimony);
        if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'Equipamento não encontrado.' });
        if (item.status !== 'AVAILABLE' || await tx.findOpenLoan(item.id)) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Este equipamento não está disponível para empréstimo.' });
        }

        const borrowedAt = new Date();
        const open = await tx.listOpenDeadlines(userId, MAX_OPEN_LOANS);
        if (open[0] && open[0].dueDate < borrowedAt) {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Você tem um empréstimo em atraso. Regularize-o antes de pedir outro.' });
        }
        if (open.length >= MAX_OPEN_LOANS) {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Você atingiu o limite de 3 empréstimos em aberto.' });
        }

        const loan = await tx.createLoan({
          userId, equipmentId: item.id, borrowedAt, dueDate: new Date(borrowedAt.getTime() + LOAN_DURATION_MS),
        });
        await tx.recordLoanRequest(userId, loan.id);
        return { id: loan.id, borrowedAt: loan.borrowedAt.toISOString(), dueDate: loan.dueDate.toISOString() };
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2034') throw error;
    }
  }
  throw new TRPCError({ code: 'CONFLICT', message: 'O equipamento mudou durante a solicitação. Atualize o catálogo e tente novamente.' });
}

export async function listOpenLoans(db: TenantDatabase, userId: string) {
  const loans = await db.listOpenLoans(userId);
  return loans.map(({ id, borrowedAt, dueDate, equipment }) => ({
    id, borrowedAt: borrowedAt.toISOString(), dueDate: dueDate.toISOString(), ...equipment,
  }));
}
