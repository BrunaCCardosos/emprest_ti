import { authRouter } from './routers/auth';
import { catalogRouter } from './routers/catalog';
import { loansRouter } from './routers/loans';
import { router } from './trpc';

export const appRouter = router({ auth: authRouter, catalog: catalogRouter, loans: loansRouter });
export type AppRouter = typeof appRouter;
