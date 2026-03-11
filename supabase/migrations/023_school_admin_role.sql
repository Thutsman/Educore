-- ============================================================
-- MIGRATION 023 — school_admin role
-- Adds the school_admin role and transfers write permissions
-- from headmaster to school_admin. Headmaster becomes read-only.
-- ============================================================

-- 1. Add school_admin role
INSERT INTO roles (name, description)
VALUES ('school_admin', 'School-level administrator. Creates accounts, classes, and manages system setup.')
ON CONFLICT (name) DO NOTHING;

-- 2. departments — school_admin writes, headmaster read-only
DROP POLICY IF EXISTS "departments_admin_all" ON departments;
CREATE POLICY "departments_admin_write" ON departments
  FOR ALL USING (
    has_any_role(ARRAY['school_admin','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );

-- 3. classes — school_admin writes
DROP POLICY IF EXISTS "classes_admin_all" ON classes;
CREATE POLICY "classes_admin_write" ON classes
  FOR ALL USING (
    has_any_role(ARRAY['school_admin','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );

-- 4. subjects — school_admin writes
DROP POLICY IF EXISTS "subjects_admin_all" ON subjects;
CREATE POLICY "subjects_admin_write" ON subjects
  FOR ALL USING (
    has_any_role(ARRAY['school_admin','deputy_headmaster','hod']) AND
    school_id = ANY(get_user_school_ids())
  );

-- 5. students — school_admin writes
DROP POLICY IF EXISTS "students_admin_insert" ON students;
DROP POLICY IF EXISTS "students_admin_update" ON students;
DROP POLICY IF EXISTS "students_admin_delete" ON students;

CREATE POLICY "students_admin_insert" ON students
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['school_admin','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );
CREATE POLICY "students_admin_update" ON students
  FOR UPDATE USING (
    has_any_role(ARRAY['school_admin','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );
CREATE POLICY "students_admin_delete" ON students
  FOR DELETE USING (
    has_any_role(ARRAY['school_admin']) AND
    school_id = ANY(get_user_school_ids())
  );

-- 6. teachers — school_admin writes
DROP POLICY IF EXISTS "teachers_admin_all" ON teachers;
CREATE POLICY "teachers_admin_write" ON teachers
  FOR ALL USING (
    has_any_role(ARRAY['school_admin','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );

-- 7. staff — school_admin writes
DROP POLICY IF EXISTS "staff_admin_all" ON staff;
CREATE POLICY "staff_admin_write" ON staff
  FOR ALL USING (
    has_any_role(ARRAY['school_admin','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );

-- 8. guardians — school_admin writes
DROP POLICY IF EXISTS "guardians_admin_all" ON guardians;
CREATE POLICY "guardians_admin_write" ON guardians
  FOR ALL USING (
    has_any_role(ARRAY['school_admin','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );

-- 9. academic_years — school_admin manages
DROP POLICY IF EXISTS "academic_years_all" ON academic_years;
CREATE POLICY "academic_years_admin_write" ON academic_years
  FOR ALL USING (
    has_any_role(ARRAY['school_admin','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );

-- 10. terms — school_admin manages
DROP POLICY IF EXISTS "terms_all" ON terms;
CREATE POLICY "terms_admin_write" ON terms
  FOR ALL USING (has_any_role(ARRAY['school_admin','deputy_headmaster']));

-- 11. user_roles — transfer from headmaster to school_admin
DROP POLICY IF EXISTS "user_roles_headmaster_insert" ON user_roles;
DROP POLICY IF EXISTS "user_roles_headmaster_delete" ON user_roles;
DROP POLICY IF EXISTS "user_roles_super_admin_all"   ON user_roles;

CREATE POLICY "user_roles_admin_insert" ON user_roles
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['school_admin','super_admin'])
  );
CREATE POLICY "user_roles_admin_delete" ON user_roles
  FOR DELETE USING (
    has_any_role(ARRAY['school_admin','super_admin'])
  );
CREATE POLICY "user_roles_super_admin_select" ON user_roles
  FOR SELECT USING (
    user_id = auth.uid() OR
    has_any_role(ARRAY['headmaster','school_admin','super_admin','deputy_headmaster'])
  );

-- 12. invoices/payments/expenses/fee_structures — add school_admin
DROP POLICY IF EXISTS "invoices_admin_all"       ON invoices;
DROP POLICY IF EXISTS "payments_admin_all"       ON payments;
DROP POLICY IF EXISTS "expenses_admin_all"       ON expenses;
DROP POLICY IF EXISTS "fee_structures_all"       ON fee_structures;

CREATE POLICY "invoices_admin_all" ON invoices
  FOR ALL USING (
    has_any_role(ARRAY['school_admin','bursar','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );
CREATE POLICY "payments_admin_all" ON payments
  FOR ALL USING (
    has_any_role(ARRAY['school_admin','bursar','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );
CREATE POLICY "expenses_admin_all" ON expenses
  FOR ALL USING (
    has_any_role(ARRAY['school_admin','bursar','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );
CREATE POLICY "fee_structures_all" ON fee_structures
  FOR ALL USING (
    has_any_role(ARRAY['school_admin','bursar','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );

-- 13. announcements — school_admin can create
DROP POLICY IF EXISTS "announcements_all" ON announcements;
CREATE POLICY "announcements_all" ON announcements
  FOR ALL USING (
    has_any_role(ARRAY['school_admin','headmaster','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );

-- 14. enrollments — school_admin manages
DROP POLICY IF EXISTS "enrollments_all" ON enrollments;
CREATE POLICY "enrollments_all" ON enrollments
  FOR ALL USING (
    has_any_role(ARRAY['school_admin','deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );
