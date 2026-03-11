-- ============================================================
-- MIGRATION 024 — Seed School Admin test user
-- Email:    schooladmin@educore.test
-- Password: Educore123!
-- ============================================================
DO $$
DECLARE
  v_user_id   UUID := gen_random_uuid();
  v_email     TEXT := 'schooladmin@educore.test';
  v_role_id   UUID;
  v_school_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    RAISE NOTICE 'School admin user already exists, skipping.';
    RETURN;
  END IF;

  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    v_email,
    crypt('Educore123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', 'School Admin (Demo)'),
    NOW(), NOW(), '', '', '', ''
  );

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (v_user_id, v_user_id, format('{"sub":"%s","email":"%s"}', v_user_id, v_email)::jsonb, 'email', v_user_id::text, NOW(), NOW(), NOW());

  SELECT id INTO v_role_id   FROM roles   WHERE name = 'school_admin'   LIMIT 1;
  SELECT id INTO v_school_id FROM schools WHERE slug = 'default-school' LIMIT 1;

  IF v_role_id IS NULL   THEN RAISE EXCEPTION 'school_admin role not found — run 023 first'; END IF;
  IF v_school_id IS NULL THEN RAISE EXCEPTION 'Default School not found — run 020 first';   END IF;

  INSERT INTO user_roles (user_id, role_id, school_id) VALUES (v_user_id, v_role_id, v_school_id) ON CONFLICT DO NOTHING;

  RAISE NOTICE 'School admin created: % / Educore123!', v_email;
END $$;
