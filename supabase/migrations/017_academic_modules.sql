-- ============================================================
-- MIGRATION 017 — Academic Modules
-- scheme_books, lesson_plans, assignments, assignment_submissions,
-- learning_resources, assessments, assessment_marks,
-- parent_messages, term_reports
-- ============================================================

-- ─── Scheme Books ─────────────────────────────────────────────
CREATE TABLE scheme_books (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id       UUID        NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id         UUID        NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
  subject_id       UUID        NOT NULL REFERENCES subjects(id)  ON DELETE CASCADE,
  term_id          UUID        NOT NULL REFERENCES terms(id)    ON DELETE CASCADE,
  week             INT         NOT NULL CHECK (week >= 1 AND week <= 52),
  topic            TEXT        NOT NULL,
  objectives       TEXT,
  teaching_methods TEXT,
  teaching_aids    TEXT,
  "references"      TEXT,
  evaluation        TEXT,
  status           TEXT        NOT NULL DEFAULT 'planned'
                 CHECK (status IN ('planned', 'completed')),
  approved_by      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scheme_books_teacher_term ON scheme_books(teacher_id, term_id);
CREATE INDEX idx_scheme_books_class_subject_term ON scheme_books(class_id, subject_id, term_id);

CREATE TRIGGER scheme_books_updated_at
  BEFORE UPDATE ON scheme_books
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

ALTER TABLE scheme_books ENABLE ROW LEVEL SECURITY;


-- ─── Lesson Plans ─────────────────────────────────────────────
CREATE TABLE lesson_plans (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id          UUID        NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id           UUID        NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
  subject_id         UUID        NOT NULL REFERENCES subjects(id)  ON DELETE CASCADE,
  date               DATE        NOT NULL,
  scheme_book_id     UUID        REFERENCES scheme_books(id) ON DELETE SET NULL,
  lesson_objectives  TEXT,
  introduction       TEXT,
  lesson_development TEXT,
  conclusion         TEXT,
  homework           TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lesson_plans_teacher_date ON lesson_plans(teacher_id, date);
CREATE INDEX idx_lesson_plans_class_date ON lesson_plans(class_id, date);

CREATE TRIGGER lesson_plans_updated_at
  BEFORE UPDATE ON lesson_plans
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;


-- ─── Assignments ─────────────────────────────────────────────
CREATE TABLE assignments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id    UUID        NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id     UUID        NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
  subject_id    UUID        NOT NULL REFERENCES subjects(id)  ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  description   TEXT,
  attachment_url TEXT,
  due_date      DATE        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX idx_assignments_class ON assignments(class_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);

CREATE TRIGGER assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Assignment submissions
CREATE TABLE assignment_submissions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   UUID        NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id      UUID        NOT NULL REFERENCES students(id)   ON DELETE CASCADE,
  submission_url  TEXT,
  submitted_at     TIMESTAMPTZ,
  grade           NUMERIC(6,2),
  teacher_comment  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT assignment_submissions_unique UNIQUE (assignment_id, student_id)
);

CREATE INDEX idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_student ON assignment_submissions(student_id);

CREATE TRIGGER assignment_submissions_updated_at
  BEFORE UPDATE ON assignment_submissions
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;


-- ─── Learning Resources ──────────────────────────────────────
CREATE TABLE learning_resources (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID        NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id  UUID        NOT NULL REFERENCES subjects(id)  ON DELETE CASCADE,
  class_id    UUID        REFERENCES classes(id) ON DELETE SET NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  file_url    TEXT        NOT NULL,
  file_type   TEXT        NOT NULL CHECK (file_type IN ('pdf', 'video', 'ppt', 'doc')),
  topic       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_learning_resources_teacher ON learning_resources(teacher_id);
CREATE INDEX idx_learning_resources_subject ON learning_resources(subject_id);
CREATE INDEX idx_learning_resources_class ON learning_resources(class_id);

ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;


-- ─── Continuous Assessments ─────────────────────────────────
CREATE TABLE assessments (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id       UUID        NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id        UUID        NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
  subject_id       UUID        NOT NULL REFERENCES subjects(id)  ON DELETE CASCADE,
  title            TEXT        NOT NULL,
  assessment_type  TEXT        NOT NULL CHECK (assessment_type IN ('test', 'assignment', 'project')),
  date             DATE        NOT NULL,
  total_marks      INT         NOT NULL CHECK (total_marks > 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessments_teacher ON assessments(teacher_id);
CREATE INDEX idx_assessments_class ON assessments(class_id);
CREATE INDEX idx_assessments_date ON assessments(date);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

CREATE TABLE assessment_marks (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id     UUID        NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id       UUID        NOT NULL REFERENCES students(id)   ON DELETE CASCADE,
  marks_obtained   NUMERIC(6,2) CHECK (marks_obtained IS NULL OR marks_obtained >= 0),
  teacher_comment  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT assessment_marks_unique UNIQUE (assessment_id, student_id)
);

CREATE INDEX idx_assessment_marks_assessment ON assessment_marks(assessment_id);
CREATE INDEX idx_assessment_marks_student ON assessment_marks(student_id);

CREATE TRIGGER assessment_marks_updated_at
  BEFORE UPDATE ON assessment_marks
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

ALTER TABLE assessment_marks ENABLE ROW LEVEL SECURITY;


-- ─── Parent Messages ──────────────────────────────────────────
CREATE TABLE parent_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID        NOT NULL REFERENCES teachers(id)   ON DELETE CASCADE,
  parent_id   UUID        NOT NULL REFERENCES guardians(id)   ON DELETE CASCADE,
  student_id  UUID        NOT NULL REFERENCES students(id)    ON DELETE CASCADE,
  subject     TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_status BOOLEAN     NOT NULL DEFAULT false
);

CREATE INDEX idx_parent_messages_teacher ON parent_messages(teacher_id);
CREATE INDEX idx_parent_messages_parent ON parent_messages(parent_id);
CREATE INDEX idx_parent_messages_student ON parent_messages(student_id);

ALTER TABLE parent_messages ENABLE ROW LEVEL SECURITY;


-- ─── Term Reports ────────────────────────────────────────────
CREATE TABLE term_reports (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id              UUID        NOT NULL REFERENCES students(id)       ON DELETE CASCADE,
  class_id                UUID        NOT NULL REFERENCES classes(id)        ON DELETE CASCADE,
  term_id                 UUID        NOT NULL REFERENCES terms(id)           ON DELETE CASCADE,
  academic_year_id        UUID        NOT NULL REFERENCES academic_years(id)  ON DELETE CASCADE,
  average_mark             NUMERIC(6,2),
  attendance_percentage    NUMERIC(5,2),
  homework_completion_rate NUMERIC(5,2),
  teacher_comment          TEXT,
  rank                     INT,
  generated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT term_reports_unique UNIQUE (student_id, term_id)
);

CREATE INDEX idx_term_reports_class_term ON term_reports(class_id, term_id);
CREATE INDEX idx_term_reports_term ON term_reports(term_id);

ALTER TABLE term_reports ENABLE ROW LEVEL SECURITY;


-- ════════════════════════════════════════════════════════════
-- RLS POLICIES — Academic Modules
-- ════════════════════════════════════════════════════════════

-- ─── scheme_books ─────────────────────────────────────────────
CREATE POLICY "scheme_books_teacher_all" ON scheme_books
  FOR ALL USING (teacher_id = get_teacher_id());

CREATE POLICY "scheme_books_hod_select" ON scheme_books
  FOR SELECT USING (
    has_role('hod') AND class_id = ANY(get_hod_class_ids())
  );

CREATE POLICY "scheme_books_hod_update_approve" ON scheme_books
  FOR UPDATE USING (
    has_role('hod') AND class_id = ANY(get_hod_class_ids())
  );

CREATE POLICY "scheme_books_admin_all" ON scheme_books
  FOR ALL USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));


-- ─── lesson_plans ────────────────────────────────────────────
CREATE POLICY "lesson_plans_teacher_all" ON lesson_plans
  FOR ALL USING (teacher_id = get_teacher_id());

CREATE POLICY "lesson_plans_hod_select" ON lesson_plans
  FOR SELECT USING (
    has_role('hod') AND class_id = ANY(get_hod_class_ids())
  );

CREATE POLICY "lesson_plans_admin_all" ON lesson_plans
  FOR ALL USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));


-- ─── assignments ──────────────────────────────────────────────
CREATE POLICY "assignments_teacher_all" ON assignments
  FOR ALL USING (teacher_id = get_teacher_id());

CREATE POLICY "assignments_hod_select" ON assignments
  FOR SELECT USING (
    has_role('hod') AND class_id = ANY(get_hod_class_ids())
  );

CREATE POLICY "assignments_admin_all" ON assignments
  FOR ALL USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));

-- assignment_submissions: teacher manages; student can insert/update own
CREATE POLICY "assignment_submissions_teacher_all" ON assignment_submissions
  FOR ALL USING (
    assignment_id IN (
      SELECT id FROM assignments WHERE teacher_id = get_teacher_id()
    )
  );

CREATE POLICY "assignment_submissions_student_insert" ON assignment_submissions
  FOR INSERT WITH CHECK (
    has_role('student') AND student_id = get_student_id()
  );

CREATE POLICY "assignment_submissions_student_update_own" ON assignment_submissions
  FOR UPDATE USING (
    has_role('student') AND student_id = get_student_id()
  );

CREATE POLICY "assignment_submissions_student_select_own" ON assignment_submissions
  FOR SELECT USING (
    has_role('student') AND student_id = get_student_id()
  );

CREATE POLICY "assignment_submissions_admin_all" ON assignment_submissions
  FOR ALL USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));


-- ─── learning_resources ───────────────────────────────────────
CREATE POLICY "learning_resources_teacher_all" ON learning_resources
  FOR ALL USING (teacher_id = get_teacher_id());

CREATE POLICY "learning_resources_hod_select" ON learning_resources
  FOR SELECT USING (
    has_role('hod') AND (class_id = ANY(get_hod_class_ids()) OR class_id IS NULL)
  );

-- Students/parents can read resources for their class
CREATE POLICY "learning_resources_student_select" ON learning_resources
  FOR SELECT USING (
    has_role('student') AND class_id = (SELECT class_id FROM students WHERE profile_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "learning_resources_parent_select" ON learning_resources
  FOR SELECT USING (
    has_role('parent') AND class_id IN (
      SELECT class_id FROM students WHERE id = ANY(get_guardian_student_ids())
    )
  );

CREATE POLICY "learning_resources_admin_all" ON learning_resources
  FOR ALL USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));


-- ─── assessments ──────────────────────────────────────────────
CREATE POLICY "assessments_teacher_all" ON assessments
  FOR ALL USING (teacher_id = get_teacher_id());

CREATE POLICY "assessments_hod_select" ON assessments
  FOR SELECT USING (
    has_role('hod') AND class_id = ANY(get_hod_class_ids())
  );

CREATE POLICY "assessments_admin_all" ON assessments
  FOR ALL USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));

-- assessment_marks
CREATE POLICY "assessment_marks_teacher_all" ON assessment_marks
  FOR ALL USING (
    assessment_id IN (
      SELECT id FROM assessments WHERE teacher_id = get_teacher_id()
    )
  );

CREATE POLICY "assessment_marks_student_select" ON assessment_marks
  FOR SELECT USING (
    has_role('student') AND student_id = get_student_id()
  );

CREATE POLICY "assessment_marks_admin_all" ON assessment_marks
  FOR ALL USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));


-- ─── parent_messages ─────────────────────────────────────────
-- Class teacher + admin: teacher_id = get_teacher_id() or admin
CREATE POLICY "parent_messages_teacher_all" ON parent_messages
  FOR ALL USING (teacher_id = get_teacher_id());

CREATE POLICY "parent_messages_admin_all" ON parent_messages
  FOR ALL USING (has_any_role(ARRAY['headmaster','deputy_headmaster','hod']));

-- Parent can see messages where they are the parent
CREATE POLICY "parent_messages_parent_select" ON parent_messages
  FOR SELECT USING (
    has_role('parent') AND parent_id IN (
      SELECT id FROM guardians WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "parent_messages_parent_update_read" ON parent_messages
  FOR UPDATE USING (
    has_role('parent') AND parent_id IN (
      SELECT id FROM guardians WHERE profile_id = auth.uid()
    )
  ) WITH CHECK (true);


-- ─── term_reports ────────────────────────────────────────────
-- Class teacher sees reports for their homeroom class(es)
CREATE POLICY "term_reports_teacher_all" ON term_reports
  FOR ALL USING (
    has_any_role(ARRAY['teacher','class_teacher']) AND
    class_id = ANY(get_teacher_class_ids())
  );

CREATE POLICY "term_reports_hod_select" ON term_reports
  FOR SELECT USING (
    has_role('hod') AND class_id = ANY(get_hod_class_ids())
  );

CREATE POLICY "term_reports_admin_all" ON term_reports
  FOR ALL USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));

CREATE POLICY "term_reports_parent_select" ON term_reports
  FOR SELECT USING (
    has_role('parent') AND student_id = ANY(get_guardian_student_ids())
  );
