-- ============================================================
-- MIGRATION 005 — Attendance Tables
-- ============================================================

-- ─── Attendance Records ──────────────────────────────────────
-- One record per student per day (or per period if school uses period-based tracking)
CREATE TABLE attendance_records (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id   UUID        NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
  date       DATE        NOT NULL,
  period     TEXT        NOT NULL DEFAULT 'full_day',      -- 'full_day' | 'morning' | 'afternoon' | 'period_1' ...
  status     TEXT        NOT NULL
               CHECK (status IN ('present','absent','late','excused')),
  reason     TEXT,                                         -- for absent/late/excused
  marked_by  UUID        NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT attendance_student_date_period_unique UNIQUE (student_id, date, period)
);

-- ─── Trigger: updated_at ─────────────────────────────────────
CREATE TRIGGER attendance_records_updated_at
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- ─── Enable RLS ──────────────────────────────────────────────
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
