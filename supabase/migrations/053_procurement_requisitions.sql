-- ─────────────────────────────────────────────────────────────────────────────
-- 053_procurement_requisitions.sql
-- Requisition workflow: quotes → Headmaster approval → order / linked expense
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS procurement_initiator TEXT NOT NULL DEFAULT 'bursar';

ALTER TABLE schools DROP CONSTRAINT IF EXISTS schools_procurement_initiator_check;
ALTER TABLE schools
  ADD CONSTRAINT schools_procurement_initiator_check
  CHECK (procurement_initiator IN ('bursar', 'deputy_headmaster', 'either'));

CREATE TABLE IF NOT EXISTS procurement_ref_counters (
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  ref_year SMALLINT NOT NULL,
  last_seq INT NOT NULL DEFAULT 0,
  PRIMARY KEY (school_id, ref_year)
);

CREATE OR REPLACE FUNCTION next_purchase_requisition_ref(p_school_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  y SMALLINT := EXTRACT(YEAR FROM CURRENT_DATE)::SMALLINT;
  n INT;
BEGIN
  INSERT INTO procurement_ref_counters (school_id, ref_year, last_seq)
  VALUES (p_school_id, y, 1)
  ON CONFLICT (school_id, ref_year)
  DO UPDATE SET last_seq = procurement_ref_counters.last_seq + 1
  RETURNING last_seq INTO n;

  RETURN 'REQ-' || y::TEXT || '-' || LPAD(n::TEXT, 5, '0');
END;
$$;

CREATE OR REPLACE FUNCTION purchase_requisitions_set_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.reference_no IS NULL OR BTRIM(NEW.reference_no) = '' THEN
    NEW.reference_no := next_purchase_requisition_ref(NEW.school_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS purchase_requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  reference_no TEXT,
  title TEXT NOT NULL,
  justification TEXT,
  category TEXT NOT NULL CHECK (
    category IN ('salaries', 'utilities', 'maintenance', 'supplies', 'equipment', 'transport', 'events', 'other')
  ),
  estimated_amount NUMERIC(12, 2),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (
      status IN ('draft', 'pending_headmaster', 'approved', 'rejected', 'ordered')
    ),
  raised_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  ordered_at TIMESTAMPTZ,
  order_notes TEXT,
  supplier_reference TEXT,
  linked_expense_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT purchase_requisitions_estimated_positive
    CHECK (estimated_amount IS NULL OR estimated_amount > 0),
  UNIQUE (school_id, reference_no)
);

DROP TRIGGER IF EXISTS purchase_requisitions_set_reference_trg ON purchase_requisitions;
CREATE TRIGGER purchase_requisitions_set_reference_trg
  BEFORE INSERT ON purchase_requisitions
  FOR EACH ROW EXECUTE FUNCTION purchase_requisitions_set_reference();

ALTER TABLE purchase_requisitions ALTER COLUMN reference_no SET NOT NULL;

DROP TRIGGER IF EXISTS purchase_requisitions_updated_at ON purchase_requisitions;
CREATE TRIGGER purchase_requisitions_updated_at
  BEFORE UPDATE ON purchase_requisitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_school_status
  ON purchase_requisitions(school_id, status);

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS requisition_id UUID REFERENCES purchase_requisitions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_requisition_id ON expenses(requisition_id)
  WHERE requisition_id IS NOT NULL;

ALTER TABLE purchase_requisitions DROP CONSTRAINT IF EXISTS purchase_requisitions_linked_expense_fkey;
ALTER TABLE purchase_requisitions
  ADD CONSTRAINT purchase_requisitions_linked_expense_fkey
  FOREIGN KEY (linked_expense_id) REFERENCES expenses(id) ON DELETE SET NULL;

DROP TABLE IF EXISTS requisition_quotes CASCADE;

CREATE TABLE requisition_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id UUID NOT NULL REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  quoted_amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  selected BOOLEAN NOT NULL DEFAULT FALSE,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT requisition_quotes_amount_positive CHECK (quoted_amount > 0)
);

CREATE UNIQUE INDEX requisition_one_selected_quote_idx
  ON requisition_quotes(requisition_id)
  WHERE selected;

DROP TRIGGER IF EXISTS requisition_quotes_updated_at ON requisition_quotes;
CREATE TRIGGER requisition_quotes_updated_at
  BEFORE UPDATE ON requisition_quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION can_raise_procurement_for_school(p_school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE (SELECT procurement_initiator FROM schools s WHERE s.id = p_school_id)
    WHEN 'bursar' THEN has_any_role(ARRAY['bursar'])
    WHEN 'deputy_headmaster' THEN has_any_role(ARRAY['deputy_headmaster'])
    WHEN 'either' THEN has_any_role(ARRAY['bursar', 'deputy_headmaster'])
    ELSE FALSE
  END;
$$;

CREATE OR REPLACE FUNCTION schools_restrict_non_super_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF has_role('super_admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.name IS DISTINCT FROM OLD.name
     OR NEW.slug IS DISTINCT FROM OLD.slug
     OR NEW.logo_url IS DISTINCT FROM OLD.logo_url
     OR NEW.address IS DISTINCT FROM OLD.address
     OR NEW.phone IS DISTINCT FROM OLD.phone
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Only procurement initiator may be updated for your role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS schools_restrict_non_super_updates_trg ON schools;
CREATE TRIGGER schools_restrict_non_super_updates_trg
  BEFORE UPDATE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION schools_restrict_non_super_updates();

DROP POLICY IF EXISTS "schools_school_staff_procurement_update" ON schools;
CREATE POLICY "schools_school_staff_procurement_update" ON schools
  FOR UPDATE
  USING (
    id = ANY(get_user_school_ids())
    AND has_any_role(ARRAY['school_admin', 'headmaster', 'deputy_headmaster'])
  )
  WITH CHECK (
    id = ANY(get_user_school_ids())
    AND has_any_role(ARRAY['school_admin', 'headmaster', 'deputy_headmaster'])
  );

ALTER TABLE purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisition_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "purchase_requisitions_select" ON purchase_requisitions;
CREATE POLICY "purchase_requisitions_select" ON purchase_requisitions
  FOR SELECT USING (
    school_id = ANY(get_user_school_ids())
    AND has_any_role(ARRAY['headmaster', 'deputy_headmaster', 'bursar', 'school_admin'])
  );

DROP POLICY IF EXISTS "purchase_requisitions_insert" ON purchase_requisitions;
CREATE POLICY "purchase_requisitions_insert" ON purchase_requisitions
  FOR INSERT WITH CHECK (
    school_id = ANY(get_user_school_ids())
    AND can_raise_procurement_for_school(school_id)
    AND status = 'draft'
    AND raised_by = auth.uid()
  );

DROP POLICY IF EXISTS "purchase_requisitions_initiator_update" ON purchase_requisitions;
CREATE POLICY "purchase_requisitions_initiator_update" ON purchase_requisitions
  FOR UPDATE
  USING (
    school_id = ANY(get_user_school_ids())
    AND can_raise_procurement_for_school(school_id)
    AND status = 'draft'
    AND raised_by = auth.uid()
  )
  WITH CHECK (
    school_id = ANY(get_user_school_ids())
    AND can_raise_procurement_for_school(school_id)
    AND raised_by = auth.uid()
    AND status IN ('draft', 'pending_headmaster')
  );

DROP POLICY IF EXISTS "purchase_requisitions_headmaster_decide" ON purchase_requisitions;
CREATE POLICY "purchase_requisitions_headmaster_decide" ON purchase_requisitions
  FOR UPDATE
  USING (
    has_role('headmaster')
    AND school_id = ANY(get_user_school_ids())
    AND status = 'pending_headmaster'
  )
  WITH CHECK (
    has_role('headmaster')
    AND school_id = ANY(get_user_school_ids())
    AND status IN ('approved', 'rejected')
  );

DROP POLICY IF EXISTS "purchase_requisitions_bursar_order" ON purchase_requisitions;
CREATE POLICY "purchase_requisitions_bursar_order" ON purchase_requisitions
  FOR UPDATE
  USING (
    has_role('bursar')
    AND school_id = ANY(get_user_school_ids())
    AND status = 'approved'
  )
  WITH CHECK (
    has_role('bursar')
    AND school_id = ANY(get_user_school_ids())
    AND status = 'ordered'
  );

DROP POLICY IF EXISTS "purchase_requisitions_bursar_link_expense" ON purchase_requisitions;
CREATE POLICY "purchase_requisitions_bursar_link_expense" ON purchase_requisitions
  FOR UPDATE
  USING (
    has_role('bursar')
    AND school_id = ANY(get_user_school_ids())
    AND status IN ('approved', 'ordered')
    AND linked_expense_id IS NULL
  )
  WITH CHECK (
    has_role('bursar')
    AND school_id = ANY(get_user_school_ids())
    AND status IN ('approved', 'ordered')
    AND linked_expense_id IS NOT NULL
  );

DROP POLICY IF EXISTS "requisition_quotes_select" ON requisition_quotes;
CREATE POLICY "requisition_quotes_select" ON requisition_quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM purchase_requisitions pr
      WHERE pr.id = requisition_quotes.requisition_id
        AND pr.school_id = ANY(get_user_school_ids())
        AND has_any_role(ARRAY['headmaster', 'deputy_headmaster', 'bursar', 'school_admin'])
    )
  );

DROP POLICY IF EXISTS "requisition_quotes_initiator_write" ON requisition_quotes;
CREATE POLICY "requisition_quotes_initiator_write" ON requisition_quotes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchase_requisitions pr
      WHERE pr.id = requisition_quotes.requisition_id
        AND pr.school_id = ANY(get_user_school_ids())
        AND pr.status = 'draft'
        AND pr.raised_by = auth.uid()
        AND can_raise_procurement_for_school(pr.school_id)
    )
  );

DROP POLICY IF EXISTS "requisition_quotes_initiator_update" ON requisition_quotes;
CREATE POLICY "requisition_quotes_initiator_update" ON requisition_quotes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM purchase_requisitions pr
      WHERE pr.id = requisition_quotes.requisition_id
        AND pr.school_id = ANY(get_user_school_ids())
        AND pr.status = 'draft'
        AND pr.raised_by = auth.uid()
        AND can_raise_procurement_for_school(pr.school_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchase_requisitions pr
      WHERE pr.id = requisition_quotes.requisition_id
        AND pr.school_id = ANY(get_user_school_ids())
        AND pr.status = 'draft'
        AND pr.raised_by = auth.uid()
        AND can_raise_procurement_for_school(pr.school_id)
    )
  );

DROP POLICY IF EXISTS "requisition_quotes_initiator_delete" ON requisition_quotes;
CREATE POLICY "requisition_quotes_initiator_delete" ON requisition_quotes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM purchase_requisitions pr
      WHERE pr.id = requisition_quotes.requisition_id
        AND pr.school_id = ANY(get_user_school_ids())
        AND pr.status = 'draft'
        AND pr.raised_by = auth.uid()
        AND can_raise_procurement_for_school(pr.school_id)
    )
  );

DROP POLICY IF EXISTS "expenses_bursar_insert" ON expenses;
CREATE POLICY "expenses_bursar_insert" ON expenses
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['bursar'])
    AND school_id = ANY(get_user_school_ids())
    AND status = 'pending'
    AND (
      requisition_id IS NULL
      OR (
        EXISTS (
          SELECT 1 FROM purchase_requisitions pr
          WHERE pr.id = expenses.requisition_id
            AND pr.school_id = expenses.school_id
            AND pr.status IN ('approved', 'ordered')
            AND pr.linked_expense_id IS NULL
        )
      )
    )
  );
