import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';
import { tenantDatabase } from '../tenant-db';

const trpc = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const { stack: _stack, ...data } = shape.data;
    const message = error.code === 'INTERNAL_SERVER_ERROR' ? 'O serviço está indisponível. Tente novamente.' : shape.message;
    return { ...shape, data, message };
  },
});
export const router = trpc.router;
export const publicProcedure = trpc.procedure;
export const tenantProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.identity) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Entre com uma conta vinculada ao EmpresTI.' });
  return next({ ctx: { identity: ctx.identity, tenantDb: tenantDatabase(ctx.db, ctx.identity.tenantId) } });
});
