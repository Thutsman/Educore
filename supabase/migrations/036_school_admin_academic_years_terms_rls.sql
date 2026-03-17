-- ============================================================
-- MIGRATION 036 — Allow School Admin to manage academic years/terms
--
-- School setup expects the School Admin to configure the academic year.
-- Existing RLS in migration 020 allowed writes only for headmaster/deputy.
-- This migration expands write access to include school_admin and scopes
-- term access to the user's schools via the linked academic_year.
-- ============================================================

-- ── academic_years ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "academic_years_all" ON academic_years;

CREATE POLICY "academic_years_all" ON academic_years
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','school_admin']) AND
    school_id = ANY(get_user_school_ids())
  )
  WITH CHECK (
    has_any_role(ARRAY['headmaster','deputy_headmaster','school_admin']) AND
    school_id = ANY(get_user_school_ids())
  );

-- ── terms ────────────────────────────────────────────────────────────────────
-- terms do not have school_id; scope via academic_years.school_id

DROP POLICY IF EXISTS "terms_all" ON terms;

CREATE POLICY "terms_all" ON terms
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','school_admin']) AND
    EXISTS (
      SELECT 1
      FROM academic_years ay
      WHERE ay.id = terms.academic_year_id
        AND ay.school_id = ANY(get_user_school_ids())
    )
  )
  WITH CHECK (
    has_any_role(ARRAY['headmaster','deputy_headmaster','school_admin']) AND
    EXISTS (
      SELECT 1
      FROM academic_years ay
      WHERE ay.id = terms.academic_year_id
        AND ay.school_id = ANY(get_user_school_ids())
    )
  );

