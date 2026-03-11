-- ============================================================
-- MIGRATION 022 — Seed Super Admin User
-- Creates a super_admin auth user for platform administration.
-- Email:    superadmin@educore.test
-- Password: Educore123!
-- ============================================================
-- Run AFTER 020_multi_school.sql and 021_super_admin_rls.sql
-- so the super_admin role and schools table already exist.
-- ============================================================

DO $$
DECLARE
  v_user_id    UUID := gen_random_uuid();
  v_email      TEXT := 'superadmin@educore.test';
  v_password   TEXT := 'Educore123!';
  v_full_name  TEXT := 'Super Admin';
  v_role_id    UUID;
  v_school_id  UUID;
BEGIN
  -- Skip if already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    RAISE NOTICE 'Super admin user already exists, skipping.';
    RETURN;
  END IF;

  -- 1. Create auth user (email pre-confirmed)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  )
  VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', v_full_name),
    NOW(), NOW(),
    '', '', '', ''
  );

  -- 2. Link identity so login works
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  )
  VALUES (
    v_user_id, v_user_id,
    format('{"sub": "%s", "email": "%s"}', v_user_id, v_email)::jsonb,
    'email', v_user_id::text,
    NOW(), NOW(), NOW()
  );

  -- 3. Assign super_admin role, scoped to the default school
  SELECT id INTO v_role_id   FROM roles   WHERE name = 'super_admin'    LIMIT 1;
  SELECT id INTO v_school_id FROM schools WHERE slug = 'default-school' LIMIT 1;

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'super_admin role not found — run 011_seed.sql and 020_multi_school.sql first';
  END IF;

  IF v_school_id IS NULL THEN
    RAISE EXCEPTION 'Default School not found — run 020_multi_school.sql first';
  END IF;

  INSERT INTO user_roles (user_id, role_id, school_id)
  VALUES (v_user_id, v_role_id, v_school_id)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Super admin created: % / %', v_email, v_password;
END $$;
