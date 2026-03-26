-- ─────────────────────────────────────────────────────────────────────────────
-- 042_expense_approval_workflow.sql
-- Expense approval lifecycle + role-aware RLS
-- ─────────────────────────────────────────────────────────────────────────────

-- Ensure the MVP lifecycle stays constrained to the approved states.
ALTER TABLE expenses
  ALTER COLUMN school_id SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'pending';

UPDATE expenses
SET status = 'pending'
WHERE status IS NULL;

ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_status_check;
ALTER TABLE expenses
  ADD CONSTRAINT expenses_status_check
  CHECK (status IN ('pending', 'approved', 'paid', 'rejected'));

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by UUID,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_approved_by_fkey;
ALTER TABLE expenses
  ADD CONSTRAINT expenses_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_rejected_by_fkey;
ALTER TABLE expenses
  ADD CONSTRAINT expenses_rejected_by_fkey
  FOREIGN KEY (rejected_by) REFERENCES profiles(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "expenses_bursar_select" ON expenses;
DROP POLICY IF EXISTS "expenses_select" ON expenses;
DROP POLICY IF EXISTS "expenses_bursar_all" ON expenses;
DROP POLICY IF EXISTS "expenses_admin_all" ON expenses;
DROP POLICY IF EXISTS "expenses_bursar_insert" ON expenses;
DROP POLICY IF EXISTS "expenses_bursar_pending_update" ON expenses;
DROP POLICY IF EXISTS "expenses_approver_update" ON expenses;
DROP POLICY IF EXISTS "expenses_bursar_payment_update" ON expenses;
DROP POLICY IF EXISTS "expenses_bursar_pending_delete" ON expenses;

CREATE POLICY "expenses_select" ON expenses
  FOR SELECT USING (
    has_any_role(ARRAY['headmaster', 'deputy_headmaster', 'bursar']) AND
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "expenses_bursar_insert" ON expenses
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['bursar']) AND
    school_id = ANY(get_user_school_ids()) AND
    status = 'pending'
  );

CREATE POLICY "expenses_bursar_pending_update" ON expenses
  FOR UPDATE USING (
    has_any_role(ARRAY['bursar']) AND
    school_id = ANY(get_user_school_ids()) AND
    status = 'pending'
  )
  WITH CHECK (
    has_any_role(ARRAY['bursar']) AND
    school_id = ANY(get_user_school_ids()) AND
    status = 'pending'
  );

CREATE POLICY "expenses_approver_update" ON expenses
  FOR UPDATE USING (
    has_any_role(ARRAY['headmaster', 'deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids()) AND
    status = 'pending'
  )
  WITH CHECK (
    has_any_role(ARRAY['headmaster', 'deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids()) AND
    status IN ('approved', 'rejected')
  );

CREATE POLICY "expenses_bursar_payment_update" ON expenses
  FOR UPDATE USING (
    has_any_role(ARRAY['bursar']) AND
    school_id = ANY(get_user_school_ids()) AND
    status = 'approved'
  )
  WITH CHECK (
    has_any_role(ARRAY['bursar']) AND
    school_id = ANY(get_user_school_ids()) AND
    status = 'paid'
  );

CREATE POLICY "expenses_bursar_pending_delete" ON expenses
  FOR DELETE USING (
    has_any_role(ARRAY['bursar']) AND
    school_id = ANY(get_user_school_ids()) AND
    status = 'pending'
  );
