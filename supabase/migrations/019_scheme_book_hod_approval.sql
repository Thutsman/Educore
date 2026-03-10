-- ============================================================
-- MIGRATION 019 — Scheme book two-stage approval
-- HOD approves first; then headmaster or deputy_headmaster approves.
-- ============================================================

ALTER TABLE scheme_books
  ADD COLUMN IF NOT EXISTS hod_approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hod_approved_at TIMESTAMPTZ;

COMMENT ON COLUMN scheme_books.hod_approved_by IS 'HOD who approved (first stage)';
COMMENT ON COLUMN scheme_books.hod_approved_at IS 'When HOD approved';
COMMENT ON COLUMN scheme_books.approved_by IS 'Headmaster/Deputy who gave final approval';
COMMENT ON COLUMN scheme_books.approved_at IS 'When final approval was given';

-- Backfill: rows that were approved in one step get HOD stage set so they show as fully approved
UPDATE scheme_books
SET hod_approved_by = approved_by, hod_approved_at = approved_at
WHERE approved_at IS NOT NULL AND hod_approved_at IS NULL;
