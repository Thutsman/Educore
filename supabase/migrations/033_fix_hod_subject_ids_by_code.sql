-- ============================================================
-- MIGRATION 033 — Fix get_hod_subject_ids() to match by department CODE
-- Root cause: schools have school-scoped departments (from the staff
-- department dropdown) AND globally-seeded departments (from migration 015).
-- Subjects are linked to the global departments; HOD teachers are linked
-- to school-scoped departments. Both share the same department CODE (e.g.
-- 'MATH'), so matching by code instead of ID resolves the mismatch for
-- every school without requiring data patching.
-- ============================================================

CREATE OR REPLACE FUNCTION get_hod_subject_ids()
RETURNS UUID[]
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT ARRAY_AGG(DISTINCT s.id)
  FROM subjects s
  JOIN departments sd ON sd.id = s.department_id
  JOIN teachers    t  ON t.profile_id = auth.uid() AND t.deleted_at IS NULL
  JOIN departments td ON td.id = t.department_id
  WHERE sd.code = td.code;
$$;
