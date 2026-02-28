-- ============================================================
-- MIGRATION 008 — Helper Functions & Triggers
-- Used by RLS policies in migration 009.
-- All functions are SECURITY DEFINER + STABLE for performance.
-- ============================================================

-- ─── get_user_role() ─────────────────────────────────────────
-- Returns the current user's primary role name.
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT r.name
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = auth.uid()
  LIMIT 1;
$$;

-- ─── has_role(role_name) ─────────────────────────────────────
-- Returns TRUE if the current user has the exact role.
CREATE OR REPLACE FUNCTION has_role(role_name TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.name = role_name
  );
$$;

-- ─── has_any_role(role_names[]) ──────────────────────────────
-- Returns TRUE if the current user has ANY of the given roles.
CREATE OR REPLACE FUNCTION has_any_role(role_names TEXT[])
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.name = ANY(role_names)
  );
$$;

-- ─── is_admin() ──────────────────────────────────────────────
-- Headmaster or Deputy Headmaster.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT has_any_role(ARRAY['headmaster','deputy_headmaster']);
$$;

-- ─── get_teacher_id() ────────────────────────────────────────
-- Returns the teachers.id for the current user.
CREATE OR REPLACE FUNCTION get_teacher_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM teachers WHERE profile_id = auth.uid() LIMIT 1;
$$;

-- ─── get_teacher_class_ids() ─────────────────────────────────
-- Returns all class_ids the current teacher is assigned to.
CREATE OR REPLACE FUNCTION get_teacher_class_ids()
RETURNS UUID[]
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT ARRAY_AGG(DISTINCT ts.class_id)
  FROM teacher_subjects ts
  WHERE ts.teacher_id = get_teacher_id();
$$;

-- ─── get_hod_department_id() ─────────────────────────────────
-- Returns the department_id where the current user is HOD.
CREATE OR REPLACE FUNCTION get_hod_department_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT d.id
  FROM departments d
  JOIN teachers t ON t.id = d.hod_id
  WHERE t.profile_id = auth.uid()
  LIMIT 1;
$$;

-- ─── get_hod_class_ids() ─────────────────────────────────────
-- Returns class_ids in the HOD's department.
CREATE OR REPLACE FUNCTION get_hod_class_ids()
RETURNS UUID[]
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT ARRAY_AGG(DISTINCT c.id)
  FROM classes c
  WHERE c.department_id = get_hod_department_id();
$$;

-- ─── get_guardian_student_ids() ──────────────────────────────
-- Returns student_ids for the current user's guardian record.
CREATE OR REPLACE FUNCTION get_guardian_student_ids()
RETURNS UUID[]
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT ARRAY_AGG(DISTINCT s.id)
  FROM students s
  JOIN guardians g ON g.id = s.guardian_id OR g.id = s.guardian2_id
  WHERE g.profile_id = auth.uid();
$$;

-- ─── get_student_id() ────────────────────────────────────────
-- Returns the students.id for the current user.
CREATE OR REPLACE FUNCTION get_student_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM students WHERE profile_id = auth.uid() LIMIT 1;
$$;

-- ─── Audit Log Function ──────────────────────────────────────
-- Attach to tables that need audit trails via triggers.
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- ─── Audit triggers on sensitive tables ──────────────────────
CREATE TRIGGER audit_students
  AFTER INSERT OR UPDATE OR DELETE ON students
  FOR EACH ROW EXECUTE PROCEDURE log_audit_event();

CREATE TRIGGER audit_grades
  AFTER INSERT OR UPDATE OR DELETE ON grades
  FOR EACH ROW EXECUTE PROCEDURE log_audit_event();

CREATE TRIGGER audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE PROCEDURE log_audit_event();

CREATE TRIGGER audit_payroll
  AFTER INSERT OR UPDATE OR DELETE ON payroll
  FOR EACH ROW EXECUTE PROCEDURE log_audit_event();

CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW EXECUTE PROCEDURE log_audit_event();
