-- ============================================================
-- MIGRATION 002 — Core Tables
-- academic_years, terms, roles, profiles, user_roles
-- ============================================================

-- ─── Academic Years ──────────────────────────────────────────
CREATE TABLE academic_years (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  label        TEXT        NOT NULL,                    -- e.g. "2025/2026"
  start_date   DATE        NOT NULL,
  end_date     DATE        NOT NULL,
  is_current   BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT academic_years_dates_check CHECK (end_date > start_date)
);

-- Only one academic year can be current at a time
CREATE UNIQUE INDEX academic_years_one_current_idx
  ON academic_years (is_current)
  WHERE is_current = true;

-- ─── Terms ───────────────────────────────────────────────────
CREATE TABLE terms (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID        NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,                -- "Term 1" | "Term 2" | "Term 3"
  start_date       DATE        NOT NULL,
  end_date         DATE        NOT NULL,
  is_current       BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT terms_dates_check CHECK (end_date > start_date),
  CONSTRAINT terms_name_year_unique UNIQUE (academic_year_id, name)
);

-- ─── Roles ───────────────────────────────────────────────────
CREATE TABLE roles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Profiles (extends auth.users) ───────────────────────────
-- One row per Supabase auth user. Created automatically via trigger.
CREATE TABLE profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT        NOT NULL,
  avatar_url TEXT,
  phone      TEXT,
  status     TEXT        NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── User Roles ──────────────────────────────────────────────
CREATE TABLE user_roles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id     UUID        NOT NULL REFERENCES roles(id)    ON DELETE CASCADE,
  assigned_by UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT user_roles_unique UNIQUE (user_id, role_id)
);

-- ─── Triggers: updated_at ────────────────────────────────────
CREATE TRIGGER academic_years_updated_at
  BEFORE UPDATE ON academic_years
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER terms_updated_at
  BEFORE UPDATE ON terms
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- ─── Trigger: auto-create profile on auth.users insert ───────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ─── Enable RLS ──────────────────────────────────────────────
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms          ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles     ENABLE ROW LEVEL SECURITY;
