import { listEquipment } from '../../services/catalog';
import { router, tenantProcedure } from '../trpc';

export const catalogRouter = router({
  list: tenantProcedure.query(({ ctx }) => listEquipment(ctx.tenantDb, ctx.photoBase)),
});
