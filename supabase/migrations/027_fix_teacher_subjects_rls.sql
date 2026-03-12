-- ============================================================
-- MIGRATION 027 — Fix teacher_subjects RLS for school_admin
-- school_admin needs SELECT and ALL on teacher_subjects to
-- manage allocations from the Staff module.
-- ============================================================

DROP POLICY IF EXISTS "teacher_subjects_admin_select" ON teacher_subjects;
DROP POLICY IF EXISTS "teacher_subjects_admin_write"  ON teacher_subjects;

CREATE POLICY "teacher_subjects_admin_select" ON teacher_subjects
  FOR SELECT USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','hod','school_admin'])
  );

CREATE POLICY "teacher_subjects_admin_write" ON teacher_subjects
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','hod','school_admin'])
  );
