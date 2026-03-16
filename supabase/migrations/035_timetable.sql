-- ============================================================
-- MIGRATION 035 — Timetable (periods, timetable_entries)
-- School-wide timetable: admin/HOD manage, teachers read own
-- ============================================================

-- ─── periods ─────────────────────────────────────────────────
-- Global time slots for the school (e.g. Period 1: 08:00–08:45)
CREATE TABLE periods (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id  UUID        NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  label      TEXT        NOT NULL,
  start_time TIME        NOT NULL,
  end_time   TIME        NOT NULL,
  sort_order INT         NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT periods_end_after_start CHECK (end_time > start_time)
);

CREATE INDEX idx_periods_school ON periods(school_id);

CREATE TRIGGER periods_updated_at
  BEFORE UPDATE ON periods
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

ALTER TABLE periods ENABLE ROW LEVEL SECURITY;

-- ─── timetable_entries ───────────────────────────────────────
-- Links class + subject + teacher + room to a period and day
-- day_of_week: 1=Monday .. 5=Friday
CREATE TABLE timetable_entries (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID        NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id          UUID        NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id        UUID        NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id        UUID        NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  period_id         UUID        NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
  day_of_week       INT         NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 5),
  room              TEXT,
  academic_year_id  UUID        NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT timetable_entries_class_slot_unique UNIQUE (class_id, period_id, day_of_week, academic_year_id),
  CONSTRAINT timetable_entries_teacher_slot_unique UNIQUE (teacher_id, period_id, day_of_week, academic_year_id)
);

CREATE INDEX idx_timetable_entries_school ON timetable_entries(school_id);
CREATE INDEX idx_timetable_entries_class ON timetable_entries(class_id);
CREATE INDEX idx_timetable_entries_teacher ON timetable_entries(teacher_id);
CREATE INDEX idx_timetable_entries_academic_year ON timetable_entries(academic_year_id);

CREATE TRIGGER timetable_entries_updated_at
  BEFORE UPDATE ON timetable_entries
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;

-- ─── RLS: periods ─────────────────────────────────────────────
CREATE POLICY "periods_select" ON periods
  FOR SELECT USING (
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "periods_admin_all" ON periods
  FOR ALL USING (
    has_any_role(ARRAY['school_admin','headmaster','deputy_headmaster','hod']) AND
    school_id = ANY(get_user_school_ids())
  );

-- ─── RLS: timetable_entries ───────────────────────────────────
CREATE POLICY "timetable_entries_select" ON timetable_entries
  FOR SELECT USING (
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "timetable_entries_teacher_select" ON timetable_entries
  FOR SELECT USING (
    has_any_role(ARRAY['teacher','class_teacher']) AND
    teacher_id = get_teacher_id()
  );

CREATE POLICY "timetable_entries_admin_all" ON timetable_entries
  FOR ALL USING (
    has_any_role(ARRAY['school_admin','headmaster','deputy_headmaster','hod']) AND
    school_id = ANY(get_user_school_ids())
  );
