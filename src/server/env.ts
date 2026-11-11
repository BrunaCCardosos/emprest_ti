import { z } from 'zod';

const supabaseEnv = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  EQUIPMENT_PHOTOS_BUCKET: z.string().regex(/^[a-z0-9-]+$/).default('equipment-photos'),
});

export function getSupabaseEnv() {
  return supabaseEnv.parse(process.env);
}
