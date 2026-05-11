-- Invoices no longer require Academics: optional academic_year_id/term_id, billing_period_key for bursar-defined rounds.

ALTER TABLE invoices ALTER COLUMN academic_year_id DROP NOT NULL;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_period_key TEXT;

CREATE INDEX IF NOT EXISTS idx_invoices_school_billing_period
  ON invoices (school_id, billing_period_key)
  WHERE deleted_at IS NULL AND billing_period_key IS NOT NULL;
