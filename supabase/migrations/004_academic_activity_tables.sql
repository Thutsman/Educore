-- ============================================================
-- MIGRATION 004 — Academic Activity Tables
-- enrollments, teacher_subjects, exams, grades, report_cards
-- ============================================================

-- ─── Enrollments ─────────────────────────────────────────────
-- Tracks which student is in which class per academic year
CREATE TABLE enrollments (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id         UUID        NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
  academic_year_id UUID        NOT NULL REFERENCES academic_years(id),
  term_id          UUID        REFERENCES terms(id) ON DELETE SET NULL,
  status           TEXT        NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','withdrawn','completed','transferred')),
  enrollment_date  DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT enrollments_unique UNIQUE (student_id, class_id, academic_year_id)
);

-- ─── Teacher Subjects ─────────────────────────────────────────
-- Maps which teacher teaches which subject in which class
CREATE TABLE teacher_subjects (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id       UUID        NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id       UUID        NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id         UUID        NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
  academic_year_id UUID        NOT NULL REFERENCES academic_years(id),
  is_primary       BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT teacher_subjects_unique UNIQUE (teacher_id, subject_id, class_id, academic_year_id)
);

-- ─── Exams ───────────────────────────────────────────────────
CREATE TABLE exams (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL,
  exam_type        TEXT        NOT NULL
                     CHECK (exam_type IN ('test','mid_term','end_of_term','mock','assignment','practical','quiz')),
  class_id         UUID        NOT NULL REFERENCES classes(id)       ON DELETE CASCADE,
  subject_id       UUID        NOT NULL REFERENCES subjects(id)      ON DELETE CASCADE,
  term_id          UUID        NOT NULL REFERENCES terms(id)         ON DELETE CASCADE,
  academic_year_id UUID        NOT NULL REFERENCES academic_years(id),
  exam_date        DATE,
  total_marks      INT         NOT NULL DEFAULT 100,
  pass_mark        INT         NOT NULL DEFAULT 50,
  weight           NUMERIC(5,2) NOT NULL DEFAULT 100.00,          -- % weight toward final grade
  created_by       UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT exams_marks_positive     CHECK (total_marks > 0),
  CONSTRAINT exams_pass_mark_valid    CHECK (pass_mark >= 0 AND pass_mark <= total_marks),
  CONSTRAINT exams_weight_valid       CHECK (weight > 0 AND weight <= 100)
);

-- ─── Grades ──────────────────────────────────────────────────
CREATE TABLE grades (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exam_id         UUID        NOT NULL REFERENCES exams(id)    ON DELETE CASCADE,
  marks_obtained  NUMERIC(6,2),
  grade_letter    TEXT,                                          -- A, B, C, D, E, F
  grade_points    NUMERIC(4,2),                                  -- 4.0, 3.5, 3.0 ...
  remarks         TEXT,
  is_absent       BOOLEAN     NOT NULL DEFAULT false,
  marked_by       UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT grades_student_exam_unique UNIQUE (student_id, exam_id),
  CONSTRAINT grades_marks_non_negative  CHECK (marks_obtained IS NULL OR marks_obtained >= 0)
);

-- ─── Report Cards ────────────────────────────────────────────
CREATE TABLE report_cards (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id              UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year_id        UUID        NOT NULL REFERENCES academic_years(id),
  term_id                 UUID        NOT NULL REFERENCES terms(id),
  class_id                UUID        REFERENCES classes(id) ON DELETE SET NULL,
  total_marks             NUMERIC(10,2),
  average_percentage      NUMERIC(5,2),
  position_in_class       INT,
  class_size              INT,
  attendance_percentage   NUMERIC(5,2),
  class_teacher_comment   TEXT,
  headmaster_comment      TEXT,
  is_published            BOOLEAN     NOT NULL DEFAULT false,
  published_at            TIMESTAMPTZ,
  generated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT report_cards_unique UNIQUE (student_id, term_id),
  CONSTRAINT report_cards_position_valid CHECK (position_in_class IS NULL OR position_in_class > 0),
  CONSTRAINT report_cards_attendance_valid CHECK (attendance_percentage IS NULL OR (attendance_percentage >= 0 AND attendance_percentage <= 100))
);

-- ─── Triggers: updated_at ────────────────────────────────────
CREATE TRIGGER enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER exams_updated_at
  BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER grades_updated_at
  BEFORE UPDATE ON grades
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- ─── Enable RLS ──────────────────────────────────────────────
ALTER TABLE enrollments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams             ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades            ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_cards      ENABLE ROW LEVEL SECURITY;
