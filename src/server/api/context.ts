import { createServerClient } from '@supabase/ssr';
import type { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { db } from '../db';
import { getSupabaseEnv } from '../env';

export async function findMembership(prisma: PrismaClient, authUserId: string) {
  const record = await prisma.membership.findFirst({
    where: { user: { authUserId }, tenant: { slug: 'suporte_ti' } },
    select: {
      tenantId: true, role: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  return record ? { ...record.user, tenantId: record.tenantId, role: record.role } : null;
}

export async function createContext() {
  const env = getSupabaseEnv();
  const store = await cookies();
  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (entries) => {
        for (const { name, value, options } of entries) store.set(name, value, { ...options, httpOnly: true });
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  const identity = data.user ? await findMembership(db, data.user.id) : null;
  const storageBase = new URL('/storage/v1/object/public/', env.SUPABASE_URL);
  return { db, supabase, identity, photoBase: new URL(env.EQUIPMENT_PHOTOS_BUCKET + '/', storageBase) };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
