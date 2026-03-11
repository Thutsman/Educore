-- ============================================================
-- MIGRATION 012 — Seed Login Credentials (One User Per Role)
-- Creates auth users + profiles + user_roles for each Educore role.
-- Password for all: Educore123!
-- ============================================================
-- IMPORTANT: Run migration 011_seed.sql first so roles exist.
-- ============================================================

-- Ensure pgcrypto is available (already in 001_extensions)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Shared password hash (Educore123!)
-- Change 'Educore123!' below if you want a different password.
DO $$
DECLARE
  v_password_hash TEXT := crypt('Educore123!', gen_salt('bf'));
  v_user_id UUID;
  v_role_record RECORD;
  v_role_names TEXT[] := ARRAY[
    'headmaster',
    'deputy_headmaster',
    'bursar',
    'hod',
    'class_teacher',
    'teacher',
    'non_teaching_staff',
    'parent',
    'student'
  ];
  v_role_name TEXT;
  v_full_name TEXT;
  v_email TEXT;
BEGIN
  FOREACH v_role_name IN ARRAY v_role_names
  LOOP
    -- Skip if user already exists for this role
    v_email := v_role_name || '@educore.test';
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
      RAISE NOTICE 'User % already exists, skipping', v_email;
      CONTINUE;
    END IF;

    v_user_id := gen_random_uuid();

    -- Human-readable full name from role
    v_full_name := initcap(replace(v_role_name, '_', ' ')) || ' (Demo)';

    -- 1. Insert into auth.users (handle_new_user trigger will create profile)
    -- NOTE: confirmation_token, email_change, email_change_token_new, recovery_token
    -- must be '' not NULL to avoid "Database error querying schema" 500 on login.
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      v_email,
      v_password_hash,
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_full_name),
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );

    -- 2. Link identity so the user can log in
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      v_user_id,
      v_user_id,
      format('{"sub": "%s", "email": "%s"}', v_user_id, v_email)::jsonb,
      'email',
      v_user_id::text,
      NOW(),
      NOW(),
      NOW()
    );

    -- 3. Assign role scoped to the default school (school_id is NOT NULL after migration 020)
    INSERT INTO user_roles (user_id, role_id, school_id)
    SELECT
      v_user_id,
      r.id,
      s.id
    FROM roles r, schools s
    WHERE r.name = v_role_name
      AND s.slug  = 'default-school'
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Created user: % with role %', v_email, v_role_name;
  END LOOP;
END $$;
