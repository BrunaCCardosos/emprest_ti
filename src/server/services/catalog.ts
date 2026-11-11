import type { TenantDatabase } from '../tenant-db';

export async function listEquipment(db: TenantDatabase, photoBase: URL) {
  const rows = await db.catalog();
  return rows.map(({ patrimony, name, category, status, photoPath, loans }) => ({
    patrimony, name, category,
    status: status === 'AVAILABLE' && loans.length ? 'BORROWED' as const : status,
    photoUrl: photoPath && photoPath.split('/').every((part) => /^[\w.-]+$/.test(part) && part !== '.' && part !== '..')
      ? new URL(photoPath, photoBase).href : null,
  }));
}
