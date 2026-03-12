-- ============================================================
-- MIGRATION 028 — Fix SELECT RLS for school_admin
-- students_admin_select and guardians_admin_select were missing
-- school_admin, causing 403 on insert...select('id') pattern.
-- ============================================================

DROP POLICY IF EXISTS "students_admin_select" ON students;
CREATE POLICY "students_admin_select" ON students
  FOR SELECT USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','school_admin']) AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "guardians_admin_select" ON guardians;
CREATE POLICY "guardians_admin_select" ON guardians
  FOR SELECT USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','bursar','school_admin']) AND deleted_at IS NULL
  );
