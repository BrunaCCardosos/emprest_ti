-- Executado pelo operador depois de criar a conta no Supabase Auth.
BEGIN;

DO $$
DECLARE
    teacher_email CONSTANT text := 'marcelo.grilo@institutojef.org.br';
    auth_id text;
    profile_id uuid;
    stored_auth_id text;
    target_tenant_id uuid;
    stored_role public.membership_role;
BEGIN
    SELECT id::text INTO STRICT auth_id FROM auth.users WHERE lower(email) = teacher_email;
    SELECT id INTO STRICT target_tenant_id FROM public.tenants WHERE slug = 'suporte_ti';

    INSERT INTO public.users (id, auth_user_id, name, email, updated_at)
    VALUES (gen_random_uuid(), auth_id, 'Marcelo Grilo', teacher_email, CURRENT_TIMESTAMP)
    ON CONFLICT (email) DO NOTHING;

    SELECT id, auth_user_id INTO STRICT profile_id, stored_auth_id
    FROM public.users WHERE email = teacher_email FOR UPDATE;
    IF stored_auth_id IS NOT NULL AND stored_auth_id <> auth_id THEN
        RAISE EXCEPTION 'O perfil existente está ligado a outra identidade.';
    END IF;

    UPDATE public.users SET auth_user_id = auth_id, updated_at = CURRENT_TIMESTAMP
    WHERE id = profile_id AND auth_user_id IS NULL;

    INSERT INTO public.memberships (id, user_id, tenant_id, role)
    VALUES (gen_random_uuid(), profile_id, target_tenant_id, 'MEMBER')
    ON CONFLICT (user_id, tenant_id) DO NOTHING;

    SELECT role INTO STRICT stored_role
    FROM public.memberships WHERE user_id = profile_id AND tenant_id = target_tenant_id;
    IF stored_role <> 'MEMBER' THEN
        RAISE EXCEPTION 'A associação existente não tem o papel de colaborador.';
    END IF;
    IF EXISTS (SELECT 1 FROM public.loans WHERE user_id = profile_id) THEN
        RAISE EXCEPTION 'O perfil do professor já possui empréstimos. Confira os registros.';
    END IF;
END;
$$;

COMMIT;
