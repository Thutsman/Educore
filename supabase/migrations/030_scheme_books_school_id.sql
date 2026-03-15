-- ============================================================
-- MIGRATION 030 — Add school_id to scheme_books
-- Migration 017 created scheme_books without school_id.
-- Migration 020 missed this table when adding multi-school support.
-- ============================================================

ALTER TABLE scheme_books
  ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);

-- Backfill from the teacher's own school_id
UPDATE scheme_books sb
SET school_id = t.school_id
FROM teachers t
WHERE sb.teacher_id = t.id
  AND sb.school_id IS NULL;

-- ── Update RLS to be school-scoped ────────────────────────────

DROP POLICY IF EXISTS "scheme_books_teacher_all"         ON scheme_books;
DROP POLICY IF EXISTS "scheme_books_hod_select"          ON scheme_books;
DROP POLICY IF EXISTS "scheme_books_hod_update_approve"  ON scheme_books;
DROP POLICY IF EXISTS "scheme_books_admin_all"           ON scheme_books;

-- Teacher: full access to their own school's entries
CREATE POLICY "scheme_books_teacher_all" ON scheme_books
  FOR ALL TO authenticated
  USING (
    teacher_id = get_teacher_id()
    AND school_id = ANY(get_user_school_ids())
  )
  WITH CHECK (
    teacher_id = get_teacher_id()
    AND school_id = ANY(get_user_school_ids())
  );

-- HOD: read entries in their department's classes
CREATE POLICY "scheme_books_hod_select" ON scheme_books
  FOR SELECT TO authenticated
  USING (
    has_role('hod')
    AND class_id = ANY(get_hod_class_ids())
    AND school_id = ANY(get_user_school_ids())
  );

-- HOD: approve (update) entries in their department's classes
CREATE POLICY "scheme_books_hod_update_approve" ON scheme_books
  FOR UPDATE TO authenticated
  USING (
    has_role('hod')
    AND class_id = ANY(get_hod_class_ids())
    AND school_id = ANY(get_user_school_ids())
  );

-- Admin: full access within their school
CREATE POLICY "scheme_books_admin_all" ON scheme_books
  FOR ALL TO authenticated
  USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','school_admin'])
    AND school_id = ANY(get_user_school_ids())
  );
