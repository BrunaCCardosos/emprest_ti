-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "membership_role" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "equipment_category" AS ENUM ('NOTEBOOK', 'MONITOR', 'CAMERA', 'ACCESSORY', 'PROJECTOR');

-- CreateEnum
CREATE TYPE "equipment_status" AS ENUM ('AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "auth_user_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "department" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "role" "membership_role" NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" "equipment_category" NOT NULL,
    "patrimony" TEXT NOT NULL,
    "serial_number" TEXT,
    "location" TEXT,
    "status" "equipment_status" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "borrowed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3) NOT NULL,
    "returned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_counters" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rate_limit_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_user_id_key" ON "users"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "memberships_tenant_id_role_idx" ON "memberships"("tenant_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_user_id_tenant_id_key" ON "memberships"("user_id", "tenant_id");

-- CreateIndex
CREATE INDEX "equipments_tenant_id_status_idx" ON "equipments"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "equipments_tenant_id_category_idx" ON "equipments"("tenant_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "equipments_tenant_id_patrimony_key" ON "equipments"("tenant_id", "patrimony");

-- CreateIndex
CREATE INDEX "loans_tenant_id_user_id_returned_at_idx" ON "loans"("tenant_id", "user_id", "returned_at");

-- CreateIndex
CREATE INDEX "loans_tenant_id_returned_at_due_date_idx" ON "loans"("tenant_id", "returned_at", "due_date");

-- CreateIndex
CREATE INDEX "loans_equipment_id_idx" ON "loans"("equipment_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_resource_type_resource_id_idx" ON "audit_logs"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "rate_limit_counters_window_start_idx" ON "rate_limit_counters"("window_start");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_counters_key_window_start_key" ON "rate_limit_counters"("key", "window_start");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipments" ADD CONSTRAINT "equipments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- =============================================================================
-- RLS — habilitado deny by default em TODA tabela (restrictions.md · Segurança).
-- ADR-001 §7: RLS é defesa em profundidade, não autorização primária — o app
-- conecta como owner e o filtro de tenant é feito pelo `tenantProcedure`.
-- Sem policy, qualquer outro role (anon/authenticated) não lê nem escreve nada.
-- As policies entram aqui, como SQL versionado, quando houver claim de tenant
-- no JWT. NUNCA pelo painel do Supabase (restrictions.md · Dados e Prisma).
-- =============================================================================
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "equipments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "loans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rate_limit_counters" ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Auditoria append-only (ADR-001 §10): UPDATE e DELETE bloqueados na própria
-- tabela. Por isso o FK do ator é RESTRICT — apagar um usuário que agiu nunca
-- apaga nem desfigura o registro do que ele fez.
-- =============================================================================
CREATE OR REPLACE FUNCTION audit_logs_append_only() RETURNS TRIGGER AS $fn$
BEGIN
  RAISE EXCEPTION 'audit_logs e append-only (ADR-001 Sec.10): % nao e permitido', TG_OP;
END;
$fn$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_append_only
  BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION audit_logs_append_only();

