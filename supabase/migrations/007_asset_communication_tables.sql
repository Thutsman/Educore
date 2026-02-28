-- ============================================================
-- MIGRATION 007 — Assets, Communication & Audit Tables
-- assets, maintenance_logs, announcements,
-- messages, notifications, audit_logs
-- ============================================================

-- ─── Assets ──────────────────────────────────────────────────
CREATE TABLE assets (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT          NOT NULL,
  asset_code       TEXT          UNIQUE,
  category         TEXT          NOT NULL
                     CHECK (category IN ('furniture','electronics','vehicles','sports','laboratory','library','building','other')),
  brand            TEXT,
  model            TEXT,
  serial_no        TEXT,
  location         TEXT,                                   -- "Room 12", "Lab 1", "Office"
  department_id    UUID          REFERENCES departments(id) ON DELETE SET NULL,
  purchase_date    DATE,
  purchase_price   NUMERIC(12,2),
  current_value    NUMERIC(12,2),
  condition        TEXT          NOT NULL DEFAULT 'good'
                     CHECK (condition IN ('excellent','good','fair','poor','condemned')),
  status           TEXT          NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','under_maintenance','disposed','lost')),
  supplier         TEXT,
  warranty_expires DATE,
  photo_url        TEXT,
  notes            TEXT,
  created_by       UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);

-- ─── Maintenance Logs ────────────────────────────────────────
CREATE TABLE maintenance_logs (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id         UUID          NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  maintenance_type TEXT          NOT NULL
                     CHECK (maintenance_type IN ('repair','service','inspection','replacement')),
  description      TEXT          NOT NULL,
  cost             NUMERIC(12,2) NOT NULL DEFAULT 0,
  performed_by     TEXT,                                   -- contractor name or staff name
  assigned_to      UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  maintenance_date DATE          NOT NULL DEFAULT CURRENT_DATE,
  completed_date   DATE,
  status           TEXT          NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','in_progress','completed','cancelled')),
  notes            TEXT,
  created_by       UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT maintenance_logs_cost_valid CHECK (cost >= 0)
);

-- ─── Announcements ───────────────────────────────────────────
CREATE TABLE announcements (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  body          TEXT        NOT NULL,
  target_roles  TEXT[]      NOT NULL DEFAULT ARRAY['all'],   -- role names or 'all'
  class_ids     UUID[],                                      -- specific classes, NULL = all
  is_pinned     BOOLEAN     NOT NULL DEFAULT false,
  is_published  BOOLEAN     NOT NULL DEFAULT false,
  published_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  created_by    UUID        NOT NULL REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

-- ─── Messages (internal) ─────────────────────────────────────
CREATE TABLE messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject      TEXT,
  body         TEXT        NOT NULL,
  is_read      BOOLEAN     NOT NULL DEFAULT false,
  read_at      TIMESTAMPTZ,
  parent_id    UUID        REFERENCES messages(id) ON DELETE SET NULL, -- reply thread
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

-- ─── Notifications ───────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL
               CHECK (type IN ('announcement','grade','attendance','payment','message','system')),
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  link       TEXT,
  is_read    BOOLEAN     NOT NULL DEFAULT false,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Audit Logs ──────────────────────────────────────────────
-- Append-only. No UPDATE or DELETE policies on this table.
CREATE TABLE audit_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  action       TEXT        NOT NULL
                 CHECK (action IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT','VIEW')),
  table_name   TEXT,
  record_id    UUID,
  old_data     JSONB,
  new_data     JSONB,
  ip_address   INET,
  user_agent   TEXT,
  session_id   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Triggers: updated_at ────────────────────────────────────
CREATE TRIGGER assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER maintenance_logs_updated_at
  BEFORE UPDATE ON maintenance_logs
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- ─── Enable RLS ──────────────────────────────────────────────
ALTER TABLE assets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements     ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs        ENABLE ROW LEVEL SECURITY;
