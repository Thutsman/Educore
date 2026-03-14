-- ============================================================
-- MIGRATION 029 — Scheme book attachments
-- Teachers can attach PDF or image files to scheme book entries.
-- Files are stored in the existing academic-files storage bucket
-- under the scheme-books/ prefix.
-- ============================================================

CREATE TABLE scheme_book_attachments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_book_id UUID NOT NULL REFERENCES scheme_books(id) ON DELETE CASCADE,
  school_id      UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id     UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  file_path      TEXT NOT NULL,
  file_name      TEXT NOT NULL,
  file_type      TEXT NOT NULL,
  file_size      INTEGER,
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sba_scheme_book ON scheme_book_attachments(scheme_book_id);
CREATE INDEX idx_sba_school      ON scheme_book_attachments(school_id);

ALTER TABLE scheme_book_attachments ENABLE ROW LEVEL SECURITY;

-- Teachers: full access to their own attachments
CREATE POLICY "sba_teacher_all" ON scheme_book_attachments
  FOR ALL TO authenticated
  USING (
    teacher_id IN (SELECT id FROM teachers WHERE profile_id = auth.uid())
  )
  WITH CHECK (
    teacher_id IN (SELECT id FROM teachers WHERE profile_id = auth.uid())
  );

-- HOD / admin roles: read access within their school
CREATE POLICY "sba_admin_select" ON scheme_book_attachments
  FOR SELECT TO authenticated
  USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','hod','school_admin'])
    AND school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );
