-- ============================================================
-- MIGRATION 032 — Fix get_hod_department_id() to use teachers.department_id
-- The original function looked at departments.hod_id which requires
-- explicit admin setup. The teacher record's own department_id is
-- always set when a user is assigned the HOD role, so use that instead.
-- ============================================================

CREATE OR REPLACE FUNCTION get_hod_department_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT t.department_id
  FROM teachers t
  WHERE t.profile_id = auth.uid()
    AND t.deleted_at IS NULL
  LIMIT 1;
$$;
