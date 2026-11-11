import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { findMembership, type Context } from '../context';
import { publicProcedure, router } from '../trpc';

function sessionProfile(identity: Context['identity']) {
  if (!identity) return null;
  return { name: identity.name, email: identity.email, role: identity.role };
}

export const authRouter = router({
  session: publicProcedure.query(({ ctx }) => sessionProfile(ctx.identity)),
  signIn: publicProcedure
    .input(z.object({ email: z.email().max(254), password: z.string().min(1).max(256) }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase.auth.signInWithPassword(input);
      if (error || !data.user) {
        if (!error?.status || error.status >= 500) {
          throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'O serviço de login está indisponível. Tente novamente.' });
        }
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'E-mail ou senha inválidos.' });
      }
      const identity = await findMembership(ctx.db, data.user.id);
      if (!identity) {
        await ctx.supabase.auth.signOut({ scope: 'local' });
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Sua conta ainda não está vinculada ao EmpresTI.' });
      }
      return sessionProfile(identity);
    }),
  signOut: publicProcedure.mutation(async ({ ctx }) => {
    const { error } = await ctx.supabase.auth.signOut({ scope: 'local' });
    if (error) throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Não foi possível encerrar a sessão. Tente novamente.' });
  }),
});
