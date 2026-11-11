import { Prisma, type PrismaClient } from '@prisma/client';

function scope(db: Prisma.TransactionClient, tenantId: string) {
  return {
    catalog() {
      return db.equipment.findMany({
        where: { tenantId, status: { not: 'OUT_OF_SERVICE' } },
        orderBy: { patrimony: 'asc' },
        select: {
          patrimony: true, name: true, category: true, status: true, photoPath: true,
          loans: { where: { tenantId, returnedAt: null }, take: 1, select: { id: true } },
        },
      });
    },
    findEquipment(patrimony: string) {
      return db.equipment.findUnique({
        where: { tenantId_patrimony: { tenantId, patrimony } },
        select: { id: true, status: true },
      });
    },
    findOpenLoan(equipmentId: string) {
      return db.loan.findFirst({
        where: { tenantId, equipmentId, returnedAt: null },
        select: { id: true },
      });
    },
    listOpenDeadlines(userId: string, limit: number) {
      return db.loan.findMany({
        where: { tenantId, userId, returnedAt: null },
        orderBy: { dueDate: 'asc' },
        take: limit,
        select: { dueDate: true },
      });
    },
    listOpenLoans(userId: string) {
      return db.loan.findMany({
        where: { tenantId, userId, returnedAt: null, equipment: { tenantId } },
        orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
        select: { id: true, borrowedAt: true, dueDate: true, equipment: { select: { patrimony: true, name: true, category: true } } },
      });
    },
    createLoan(data: { userId: string; equipmentId: string; borrowedAt: Date; dueDate: Date }) {
      return db.loan.create({ data: { ...data, tenantId }, select: { id: true, borrowedAt: true, dueDate: true } });
    },
    recordLoanRequest(actorUserId: string, loanId: string) {
      return db.auditLog.create({
        data: { tenantId, actorUserId, action: 'loan.request', resourceType: 'loan', resourceId: loanId },
      });
    },
  };
}

export function tenantDatabase(db: PrismaClient, tenantId: string) {
  return {
    ...scope(db, tenantId),
    serializable<T>(run: (tx: ReturnType<typeof scope>) => Promise<T>) {
      return db.$transaction((tx) => run(scope(tx, tenantId)), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    },
  };
}

export type TenantDatabase = ReturnType<typeof tenantDatabase>;
