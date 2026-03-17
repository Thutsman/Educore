-- ============================================================
-- 038_budgets_table.sql — Finance Budgets per School / Term
-- ============================================================

CREATE TABLE IF NOT EXISTS budgets (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID          NOT NULL REFERENCES schools(id),
  category         TEXT          NOT NULL,
  allocated_amount NUMERIC(12,2) NOT NULL,
  academic_year_id UUID          NOT NULL REFERENCES academic_years(id),
  term_id          UUID          REFERENCES terms(id) ON DELETE SET NULL,
  notes            TEXT,
  created_by       UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ,

  CONSTRAINT budgets_amount_positive CHECK (allocated_amount > 0),
  CONSTRAINT budgets_category_valid CHECK (
    category IN (
      'salaries',
      'utilities',
      'maintenance',
      'supplies',
      'equipment',
      'transport',
      'events',
      'other'
    )
  )
);

CREATE TRIGGER budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budgets_select" ON budgets;
CREATE POLICY "budgets_select" ON budgets
  FOR SELECT USING (
    deleted_at IS NULL
    AND school_id = ANY(get_user_school_ids())
  );

DROP POLICY IF EXISTS "budgets_admin_all" ON budgets;
CREATE POLICY "budgets_admin_all" ON budgets
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','bursar'])
    AND school_id = ANY(get_user_school_ids())
  )
  WITH CHECK (
    has_any_role(ARRAY['headmaster','deputy_headmaster','bursar'])
    AND school_id = ANY(get_user_school_ids())
  );

