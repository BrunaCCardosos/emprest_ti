import { z } from 'zod';
import { listOpenLoans, requestLoan } from '../../services/loans';
import { router, tenantProcedure } from '../trpc';

export const loansRouter = router({
  mine: tenantProcedure.query(({ ctx }) => listOpenLoans(ctx.tenantDb, ctx.identity.id)),
  request: tenantProcedure
    .input(z.object({ patrimony: z.string().trim().min(1).max(64) }).strict())
    .mutation(({ ctx, input }) => requestLoan(ctx.tenantDb, ctx.identity.id, input.patrimony)),
});
