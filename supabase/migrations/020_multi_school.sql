-- ─────────────────────────────────────────────────────────────────────────────
-- 020_multi_school.sql  –  Multi-tenant / multi-school transformation
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. schools table ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS schools (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT UNIQUE,
  logo_url   TEXT,
  address    TEXT,
  phone      TEXT,
  email      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS schools_updated_at ON schools;
CREATE TRIGGER schools_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- ── 2. super_admin role ───────────────────────────────────────────────────────

INSERT INTO roles (name) VALUES ('super_admin') ON CONFLICT (name) DO NOTHING;

-- ── 3 & 4 & 5 & 6. Add school_id columns (nullable first) ────────────────────

-- user_roles
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS school_id UUID;

-- academic tables
ALTER TABLE academic_years   ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE departments      ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE classes          ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE subjects         ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE students         ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE teachers         ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE staff            ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE guardians        ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS school_id UUID;

-- finance tables
ALTER TABLE invoices         ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE payments         ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE expenses         ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE fee_structures   ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE payroll          ADD COLUMN IF NOT EXISTS school_id UUID;

-- communication & misc tables
ALTER TABLE announcements    ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE messages         ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE notifications    ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE exams            ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE grades           ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE report_cards     ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE enrollments      ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE assets           ADD COLUMN IF NOT EXISTS school_id UUID;
ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS school_id UUID;

-- ── 7 & 8 & 9. Create default school and backfill ────────────────────────────

DO $$
DECLARE
  default_school_id UUID;
BEGIN
  INSERT INTO schools (name, slug)
  VALUES ('Default School', 'default-school')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO default_school_id;

  -- backfill user_roles
  UPDATE user_roles SET school_id = default_school_id WHERE school_id IS NULL;

  -- backfill all tables
  UPDATE academic_years     SET school_id = default_school_id WHERE school_id IS NULL;
  UPDATE departments        SET school_id = default_school_id WHERE school_id IS NULL;
  UPDATE classes            SET school_id = default_school_id WHERE school_id IS NULL;
  UPDATE subjects           SET school_id = default_school_id WHERE school_id IS NULL;
  UPDATE students           SET school_id = default_school_id WHERE school_id IS NULL;
  UPDATE teachers           SET school_id = default_school_id WHERE school_id IS NULL;
  UPDATE staff              SET school_id = default_school_id WHERE school_id IS NULL;
  UPDATE guardians          SET school_id = default_school_id WHERE school_id IS NULL;
  UPDATE attendance_records SET school_id = default_school_id WHERE school_id IS NULL;
  UPDATE invoices           SET school_id = default_school_id WHERE school_id IS NULL;
  UPDATE payments           SET school_id = default_school_id WHERE school_id IS NULL;
  UPDATE expenses           SET school_id = default_school_id WHERE school_id IS NULL;
  UPDATE fee_structures     SET school_id = default_school_id WHERE school_id IS NULL;
  UPDATE payroll            SET school_id = default_school_id WHERE school_id IS NULL;
  UPDATE announcements      SET school_id = default_school_id WHERE school_id IS NULL;
  UPDATE messages           SET school_id = default_school_id WHERE school_id IS NULL;
  UPDATE notifications      SET school_id = default_school_id WHERE school_id IS NULL;
  UPDATE exams              SET school_id = default_school_id WHERE school_id IS NULL;
  UPDATE grades             SET school_id = default_school_id WHERE school_id IS NULL;
  UPDATE report_cards       SET school_id = default_school_id WHERE school_id IS NULL;
  UPDATE enrollments        SET school_id = default_school_id WHERE school_id IS NULL;
  UPDATE assets             SET school_id = default_school_id WHERE school_id IS NULL;
  UPDATE maintenance_logs   SET school_id = default_school_id WHERE school_id IS NULL;
END $$;

-- ── 10. NOT NULL + FK constraints after backfill ──────────────────────────────

-- user_roles
ALTER TABLE user_roles ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_school_id_fkey;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- academic_years
ALTER TABLE academic_years ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE academic_years DROP CONSTRAINT IF EXISTS academic_years_school_id_fkey;
ALTER TABLE academic_years ADD CONSTRAINT academic_years_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- departments
ALTER TABLE departments ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_school_id_fkey;
ALTER TABLE departments ADD CONSTRAINT departments_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- classes
ALTER TABLE classes ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_school_id_fkey;
ALTER TABLE classes ADD CONSTRAINT classes_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- subjects
ALTER TABLE subjects ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_school_id_fkey;
ALTER TABLE subjects ADD CONSTRAINT subjects_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- students
ALTER TABLE students ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_school_id_fkey;
ALTER TABLE students ADD CONSTRAINT students_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- teachers
ALTER TABLE teachers ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE teachers DROP CONSTRAINT IF EXISTS teachers_school_id_fkey;
ALTER TABLE teachers ADD CONSTRAINT teachers_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- staff
ALTER TABLE staff ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_school_id_fkey;
ALTER TABLE staff ADD CONSTRAINT staff_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- guardians
ALTER TABLE guardians ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE guardians DROP CONSTRAINT IF EXISTS guardians_school_id_fkey;
ALTER TABLE guardians ADD CONSTRAINT guardians_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- attendance_records
ALTER TABLE attendance_records ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_school_id_fkey;
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- invoices
ALTER TABLE invoices ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_school_id_fkey;
ALTER TABLE invoices ADD CONSTRAINT invoices_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- payments
ALTER TABLE payments ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_school_id_fkey;
ALTER TABLE payments ADD CONSTRAINT payments_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- expenses
ALTER TABLE expenses ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_school_id_fkey;
ALTER TABLE expenses ADD CONSTRAINT expenses_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- fee_structures
ALTER TABLE fee_structures ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE fee_structures DROP CONSTRAINT IF EXISTS fee_structures_school_id_fkey;
ALTER TABLE fee_structures ADD CONSTRAINT fee_structures_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- payroll
ALTER TABLE payroll ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE payroll DROP CONSTRAINT IF EXISTS payroll_school_id_fkey;
ALTER TABLE payroll ADD CONSTRAINT payroll_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- announcements
ALTER TABLE announcements ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_school_id_fkey;
ALTER TABLE announcements ADD CONSTRAINT announcements_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- messages
ALTER TABLE messages ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_school_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- notifications
ALTER TABLE notifications ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_school_id_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- exams
ALTER TABLE exams ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE exams DROP CONSTRAINT IF EXISTS exams_school_id_fkey;
ALTER TABLE exams ADD CONSTRAINT exams_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- grades
ALTER TABLE grades ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_school_id_fkey;
ALTER TABLE grades ADD CONSTRAINT grades_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- report_cards
ALTER TABLE report_cards ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE report_cards DROP CONSTRAINT IF EXISTS report_cards_school_id_fkey;
ALTER TABLE report_cards ADD CONSTRAINT report_cards_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- enrollments
ALTER TABLE enrollments ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_school_id_fkey;
ALTER TABLE enrollments ADD CONSTRAINT enrollments_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- assets
ALTER TABLE assets ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_school_id_fkey;
ALTER TABLE assets ADD CONSTRAINT assets_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- maintenance_logs
ALTER TABLE maintenance_logs ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE maintenance_logs DROP CONSTRAINT IF EXISTS maintenance_logs_school_id_fkey;
ALTER TABLE maintenance_logs ADD CONSTRAINT maintenance_logs_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

-- ── 11. Drop old unique constraints and add per-school ones ───────────────────

-- students
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_admission_no_key;
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_school_admission_no_key;
ALTER TABLE students ADD CONSTRAINT students_school_admission_no_key UNIQUE (school_id, admission_no);

-- subjects
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_code_key;
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_school_code_key;
ALTER TABLE subjects ADD CONSTRAINT subjects_school_code_key UNIQUE (school_id, code);

-- departments
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_code_key;
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_school_code_key;
ALTER TABLE departments ADD CONSTRAINT departments_school_code_key UNIQUE (school_id, code);

-- teachers
ALTER TABLE teachers DROP CONSTRAINT IF EXISTS teachers_employee_no_key;
ALTER TABLE teachers DROP CONSTRAINT IF EXISTS teachers_school_employee_no_key;
ALTER TABLE teachers ADD CONSTRAINT teachers_school_employee_no_key UNIQUE (school_id, employee_no);

-- staff
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_employee_no_key;
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_school_employee_no_key;
ALTER TABLE staff ADD CONSTRAINT staff_school_employee_no_key UNIQUE (school_id, employee_no);

-- user_roles
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_unique;
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_school_unique;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_school_unique UNIQUE (user_id, role_id, school_id);

-- ── 12. Per-school academic_years partial unique index ────────────────────────

DROP INDEX IF EXISTS academic_years_one_current_idx;
CREATE UNIQUE INDEX IF NOT EXISTS academic_years_one_current_per_school_idx
  ON academic_years (school_id, is_current) WHERE is_current = true;

-- ── 15. Helper function: get_user_school_ids() ────────────────────────────────

CREATE OR REPLACE FUNCTION get_user_school_ids()
RETURNS UUID[]
LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public
AS $$ SELECT ARRAY_AGG(DISTINCT school_id) FROM user_roles WHERE user_id = auth.uid(); $$;

-- ── 14. RLS policies for schools table ───────────────────────────────────────

DROP POLICY IF EXISTS "schools_select" ON schools;
CREATE POLICY "schools_select" ON schools
  FOR SELECT USING (id = ANY(get_user_school_ids()));

DROP POLICY IF EXISTS "schools_insert" ON schools;
CREATE POLICY "schools_insert" ON schools
  FOR INSERT WITH CHECK (has_any_role(ARRAY['super_admin']));

DROP POLICY IF EXISTS "schools_all" ON schools;
CREATE POLICY "schools_all" ON schools
  FOR ALL USING (has_role('super_admin'));

-- ── 16. Update RLS policies for all school-scoped tables ─────────────────────

-- ── departments ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "departments_admin_all"     ON departments;
DROP POLICY IF EXISTS "departments_select"        ON departments;
DROP POLICY IF EXISTS "departments_staff_select"  ON departments;
DROP POLICY IF EXISTS "departments_school_admin_all" ON departments;

CREATE POLICY "departments_select" ON departments
  FOR SELECT USING (
    deleted_at IS NULL AND school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "departments_admin_all" ON departments
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );

-- ── classes ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "classes_admin_all"    ON classes;
DROP POLICY IF EXISTS "classes_select"       ON classes;
DROP POLICY IF EXISTS "classes_staff_select" ON classes;
DROP POLICY IF EXISTS "classes_school_admin_all" ON classes;

CREATE POLICY "classes_select" ON classes
  FOR SELECT USING (
    deleted_at IS NULL AND school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "classes_admin_all" ON classes
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );

-- ── subjects ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "subjects_admin_all"    ON subjects;
DROP POLICY IF EXISTS "subjects_select"       ON subjects;
DROP POLICY IF EXISTS "subjects_staff_select" ON subjects;
DROP POLICY IF EXISTS "subjects_school_admin_all" ON subjects;

CREATE POLICY "subjects_select" ON subjects
  FOR SELECT USING (
    deleted_at IS NULL AND school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "subjects_admin_all" ON subjects
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','hod']) AND
    school_id = ANY(get_user_school_ids())
  );

-- ── students ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "students_admin_select"      ON students;
DROP POLICY IF EXISTS "students_teacher_select"    ON students;
DROP POLICY IF EXISTS "students_parent_select"     ON students;
DROP POLICY IF EXISTS "students_self_select"       ON students;
DROP POLICY IF EXISTS "students_admin_insert"      ON students;
DROP POLICY IF EXISTS "students_admin_update"      ON students;
DROP POLICY IF EXISTS "students_admin_delete"      ON students;

CREATE POLICY "students_admin_select" ON students
  FOR SELECT USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','bursar']) AND
    deleted_at IS NULL AND
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "students_teacher_select" ON students
  FOR SELECT USING (
    has_any_role(ARRAY['hod','class_teacher','teacher']) AND
    deleted_at IS NULL AND
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "students_admin_insert" ON students
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['headmaster','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "students_admin_update" ON students
  FOR UPDATE USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "students_admin_delete" ON students
  FOR DELETE USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );

-- ── teachers ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "teachers_admin_select"   ON teachers;
DROP POLICY IF EXISTS "teachers_select"         ON teachers;
DROP POLICY IF EXISTS "teachers_admin_all"      ON teachers;
DROP POLICY IF EXISTS "teachers_staff_select"   ON teachers;

CREATE POLICY "teachers_select" ON teachers
  FOR SELECT USING (
    deleted_at IS NULL AND school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "teachers_admin_all" ON teachers
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );

-- ── staff ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "staff_admin_select"  ON staff;
DROP POLICY IF EXISTS "staff_select"        ON staff;
DROP POLICY IF EXISTS "staff_admin_all"     ON staff;

CREATE POLICY "staff_select" ON staff
  FOR SELECT USING (
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "staff_admin_all" ON staff
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );

-- ── guardians ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "guardians_select"    ON guardians;
DROP POLICY IF EXISTS "guardians_admin_all" ON guardians;

CREATE POLICY "guardians_select" ON guardians
  FOR SELECT USING (
    deleted_at IS NULL AND school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "guardians_admin_all" ON guardians
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );

-- ── attendance_records ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "attendance_admin_select"   ON attendance_records;
DROP POLICY IF EXISTS "attendance_teacher_select" ON attendance_records;
DROP POLICY IF EXISTS "attendance_teacher_upsert" ON attendance_records;
DROP POLICY IF EXISTS "attendance_select"         ON attendance_records;
DROP POLICY IF EXISTS "attendance_upsert"         ON attendance_records;
DROP POLICY IF EXISTS "attendance_update"         ON attendance_records;

CREATE POLICY "attendance_select" ON attendance_records
  FOR SELECT USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','hod','class_teacher','teacher']) AND
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "attendance_upsert" ON attendance_records
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['headmaster','deputy_headmaster','hod','class_teacher','teacher']) AND
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "attendance_update" ON attendance_records
  FOR UPDATE USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','hod','class_teacher','teacher']) AND
    school_id = ANY(get_user_school_ids())
  );

-- ── invoices ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "invoices_bursar_select" ON invoices;
DROP POLICY IF EXISTS "invoices_select"        ON invoices;
DROP POLICY IF EXISTS "invoices_bursar_all"    ON invoices;
DROP POLICY IF EXISTS "invoices_admin_all"     ON invoices;

CREATE POLICY "invoices_select" ON invoices
  FOR SELECT USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','bursar']) AND
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "invoices_admin_all" ON invoices
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','bursar']) AND
    school_id = ANY(get_user_school_ids())
  );

-- ── payments ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "payments_bursar_select" ON payments;
DROP POLICY IF EXISTS "payments_select"        ON payments;
DROP POLICY IF EXISTS "payments_bursar_all"    ON payments;
DROP POLICY IF EXISTS "payments_admin_all"     ON payments;

CREATE POLICY "payments_select" ON payments
  FOR SELECT USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','bursar']) AND
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "payments_admin_all" ON payments
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','bursar']) AND
    school_id = ANY(get_user_school_ids())
  );

-- ── expenses ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "expenses_bursar_select" ON expenses;
DROP POLICY IF EXISTS "expenses_select"        ON expenses;
DROP POLICY IF EXISTS "expenses_bursar_all"    ON expenses;
DROP POLICY IF EXISTS "expenses_admin_all"     ON expenses;

CREATE POLICY "expenses_select" ON expenses
  FOR SELECT USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','bursar']) AND
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "expenses_admin_all" ON expenses
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','bursar']) AND
    school_id = ANY(get_user_school_ids())
  );

-- ── fee_structures ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "fee_structures_select" ON fee_structures;
DROP POLICY IF EXISTS "fee_structures_all"    ON fee_structures;

CREATE POLICY "fee_structures_select" ON fee_structures
  FOR SELECT USING (
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "fee_structures_all" ON fee_structures
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','bursar']) AND
    school_id = ANY(get_user_school_ids())
  );

-- ── payroll ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "payroll_select" ON payroll;
DROP POLICY IF EXISTS "payroll_all"    ON payroll;

CREATE POLICY "payroll_select" ON payroll
  FOR SELECT USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','bursar']) AND
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "payroll_all" ON payroll
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','bursar']) AND
    school_id = ANY(get_user_school_ids())
  );

-- ── announcements ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "announcements_select" ON announcements;
DROP POLICY IF EXISTS "announcements_all"    ON announcements;

CREATE POLICY "announcements_select" ON announcements
  FOR SELECT USING (
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "announcements_all" ON announcements
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );

-- ── exams ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "exams_select" ON exams;
DROP POLICY IF EXISTS "exams_all"    ON exams;

CREATE POLICY "exams_select" ON exams
  FOR SELECT USING (
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "exams_all" ON exams
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','hod','teacher','class_teacher']) AND
    school_id = ANY(get_user_school_ids())
  );

-- ── grades ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "grades_select" ON grades;
DROP POLICY IF EXISTS "grades_all"    ON grades;

CREATE POLICY "grades_select" ON grades
  FOR SELECT USING (
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "grades_all" ON grades
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','hod','teacher','class_teacher']) AND
    school_id = ANY(get_user_school_ids())
  );

-- ── report_cards ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "report_cards_select" ON report_cards;
DROP POLICY IF EXISTS "report_cards_all"    ON report_cards;

CREATE POLICY "report_cards_select" ON report_cards
  FOR SELECT USING (
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "report_cards_all" ON report_cards
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','hod','class_teacher']) AND
    school_id = ANY(get_user_school_ids())
  );

-- ── enrollments ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "enrollments_select" ON enrollments;
DROP POLICY IF EXISTS "enrollments_all"    ON enrollments;

CREATE POLICY "enrollments_select" ON enrollments
  FOR SELECT USING (
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "enrollments_all" ON enrollments
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );

-- ── assets ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "assets_select" ON assets;
DROP POLICY IF EXISTS "assets_all"    ON assets;

CREATE POLICY "assets_select" ON assets
  FOR SELECT USING (
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "assets_all" ON assets
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','non_teaching_staff']) AND
    school_id = ANY(get_user_school_ids())
  );

-- ── maintenance_logs ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "maintenance_logs_select" ON maintenance_logs;
DROP POLICY IF EXISTS "maintenance_logs_all"    ON maintenance_logs;

CREATE POLICY "maintenance_logs_select" ON maintenance_logs
  FOR SELECT USING (
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "maintenance_logs_all" ON maintenance_logs
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','non_teaching_staff']) AND
    school_id = ANY(get_user_school_ids())
  );

-- ── 17. academic_years and terms SELECT policies with school_id ───────────────

DROP POLICY IF EXISTS "academic_years_select" ON academic_years;
DROP POLICY IF EXISTS "academic_years_all"    ON academic_years;

CREATE POLICY "academic_years_select" ON academic_years
  FOR SELECT USING (
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "academic_years_all" ON academic_years
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );

DROP POLICY IF EXISTS "terms_select" ON terms;
DROP POLICY IF EXISTS "terms_all"    ON terms;

CREATE POLICY "terms_select" ON terms
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "terms_all" ON terms
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster'])
  );
