-- ============================================================
-- MIGRATION 003 — People Tables
-- departments, classes, subjects, guardians,
-- students, teachers, staff
-- Note: departments.hod_id and classes.class_teacher_id are
-- added as FK constraints AFTER teachers is created.
-- ============================================================

-- ─── Departments ─────────────────────────────────────────────
CREATE TABLE departments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  code        TEXT        UNIQUE,                         -- e.g. "SCI", "MATH", "LANG"
  description TEXT,
  hod_id      UUID,                                       -- FK added after teachers table
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

-- ─── Classes ─────────────────────────────────────────────────
CREATE TABLE classes (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL,                  -- e.g. "Form 3A", "Grade 5B"
  grade_level      INT         NOT NULL,                  -- numeric level: 1, 2, ... 6
  stream           TEXT,                                  -- "Science", "Arts", "A", "B"
  academic_year_id UUID        NOT NULL REFERENCES academic_years(id),
  department_id    UUID        REFERENCES departments(id) ON DELETE SET NULL,
  class_teacher_id UUID,                                  -- FK added after teachers table
  capacity         INT         NOT NULL DEFAULT 40,
  room             TEXT,                                  -- e.g. "Room 12"
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ,

  CONSTRAINT classes_grade_positive CHECK (grade_level > 0),
  CONSTRAINT classes_capacity_positive CHECK (capacity > 0)
);

-- ─── Subjects ────────────────────────────────────────────────
CREATE TABLE subjects (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  code          TEXT        NOT NULL UNIQUE,              -- e.g. "MATH101", "ENG201"
  department_id UUID        REFERENCES departments(id) ON DELETE SET NULL,
  description   TEXT,
  is_elective   BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

-- ─── Guardians ───────────────────────────────────────────────
CREATE TABLE guardians (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL,  -- if guardian has login
  full_name     TEXT        NOT NULL,
  relationship  TEXT        NOT NULL,                     -- 'father','mother','guardian','other'
  phone         TEXT,
  alt_phone     TEXT,
  email         TEXT,
  address       TEXT,
  national_id   TEXT,
  occupation    TEXT,
  employer      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

-- ─── Students ────────────────────────────────────────────────
CREATE TABLE students (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_no   TEXT        NOT NULL UNIQUE,
  profile_id     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  full_name      TEXT        NOT NULL,
  date_of_birth  DATE,
  gender         TEXT        CHECK (gender IN ('male', 'female', 'other')),
  nationality    TEXT        DEFAULT 'Zimbabwean',
  national_id    TEXT,
  address        TEXT,
  class_id       UUID        REFERENCES classes(id) ON DELETE SET NULL,
  guardian_id    UUID        REFERENCES guardians(id) ON DELETE SET NULL,
  guardian2_id   UUID        REFERENCES guardians(id) ON DELETE SET NULL,
  photo_url      TEXT,
  blood_group    TEXT,
  medical_notes  TEXT,
  admission_date DATE        NOT NULL DEFAULT CURRENT_DATE,
  status         TEXT        NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','inactive','graduated','transferred','expelled')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ
);

-- ─── Teachers ────────────────────────────────────────────────
CREATE TABLE teachers (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       UUID        NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  employee_no      TEXT        NOT NULL UNIQUE,
  department_id    UUID        REFERENCES departments(id) ON DELETE SET NULL,
  qualification    TEXT,
  specialization   TEXT,
  employment_type  TEXT        NOT NULL DEFAULT 'permanent'
                     CHECK (employment_type IN ('permanent','contract','part_time')),
  join_date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  status           TEXT        NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','inactive','on_leave')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);

-- ─── Non-Teaching Staff ──────────────────────────────────────
CREATE TABLE staff (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID        NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  employee_no     TEXT        NOT NULL UNIQUE,
  department_id   UUID        REFERENCES departments(id) ON DELETE SET NULL,
  role_title      TEXT        NOT NULL,                   -- "Secretary","Librarian","Security"
  employment_type TEXT        NOT NULL DEFAULT 'permanent'
                    CHECK (employment_type IN ('permanent','contract','part_time')),
  join_date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  status          TEXT        NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','inactive','on_leave')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

-- ─── Back-fill FK constraints ────────────────────────────────
-- Now that teachers exists, we can add the FK refs

ALTER TABLE departments
  ADD CONSTRAINT fk_departments_hod
  FOREIGN KEY (hod_id) REFERENCES teachers(id) ON DELETE SET NULL;

ALTER TABLE classes
  ADD CONSTRAINT fk_classes_class_teacher
  FOREIGN KEY (class_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;

-- ─── Triggers: updated_at ────────────────────────────────────
CREATE TRIGGER departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER subjects_updated_at
  BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER guardians_updated_at
  BEFORE UPDATE ON guardians
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER teachers_updated_at
  BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- ─── Enable RLS ──────────────────────────────────────────────
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects    ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians   ENABLE ROW LEVEL SECURITY;
ALTER TABLE students    ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff       ENABLE ROW LEVEL SECURITY;
