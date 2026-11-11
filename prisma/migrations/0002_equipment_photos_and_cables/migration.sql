BEGIN;

ALTER TYPE "public"."equipment_category" ADD VALUE 'CABLE';

ALTER TABLE "public"."equipments"
  ADD COLUMN "photo_path" TEXT;

COMMIT;
