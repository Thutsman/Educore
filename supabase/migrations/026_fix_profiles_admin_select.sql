-- ============================================================
-- MIGRATION 026 — Fix profiles_admin_select RLS policy
-- Add school_admin so they can read all profiles (needed for
-- the User Account dropdown in Add Teacher / Add Staff modals).
-- ============================================================

DROP POLICY IF EXISTS "profiles_admin_select" ON profiles;

CREATE POLICY "profiles_admin_select" ON profiles
  FOR SELECT USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','bursar','hod','school_admin'])
  );
