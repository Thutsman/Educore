-- ============================================================
-- MIGRATION 031 — HOD scheme_book access via subject (not class)
-- The original HOD policies used class_id = ANY(get_hod_class_ids()),
-- which requires classes to have department_id set.
-- Subjects are seeded with department_id, so subject-based access
-- is more reliable and doesn't require per-class department setup.
-- ============================================================

-- ── New helper: subjects in the HOD's department ──────────────
CREATE OR REPLACE FUNCTION get_hod_subject_ids()
RETURNS UUID[]
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT ARRAY_AGG(DISTINCT s.id)
  FROM subjects s
  WHERE s.department_id = get_hod_department_id();
$$;

-- ── Re-create scheme_books HOD policies with subject_id ───────
-- (DROP covers whichever version exists — from migration 017 or 030)

DROP POLICY IF EXISTS "scheme_books_hod_select"         ON scheme_books;
DROP POLICY IF EXISTS "scheme_books_hod_update_approve" ON scheme_books;

-- HOD: read scheme books whose subject belongs to their department
CREATE POLICY "scheme_books_hod_select" ON scheme_books
  FOR SELECT TO authenticated
  USING (
    has_role('hod')
    AND subject_id = ANY(get_hod_subject_ids())
  );

-- HOD: approve (update) scheme books whose subject belongs to their department
CREATE POLICY "scheme_books_hod_update_approve" ON scheme_books
  FOR UPDATE TO authenticated
  USING (
    has_role('hod')
    AND subject_id = ANY(get_hod_subject_ids())
  );
