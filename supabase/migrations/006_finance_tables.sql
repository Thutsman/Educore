-- ============================================================
-- MIGRATION 006 — Finance Tables
-- fee_structures, invoices, payments, payroll, expenses
-- ============================================================

-- ─── Sequences for human-readable numbers ────────────────────
CREATE SEQUENCE invoice_seq  START 1000 INCREMENT 1;
CREATE SEQUENCE payment_seq  START 1000 INCREMENT 1;

-- ─── Fee Structures ──────────────────────────────────────────
CREATE TABLE fee_structures (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL,
  description      TEXT,
  class_id         UUID        REFERENCES classes(id) ON DELETE SET NULL,       -- NULL = applies to all
  academic_year_id UUID        NOT NULL REFERENCES academic_years(id),
  term_id          UUID        REFERENCES terms(id) ON DELETE SET NULL,         -- NULL = annual
  amount           NUMERIC(12,2) NOT NULL,
  currency         TEXT        NOT NULL DEFAULT 'USD',
  due_date         DATE,
  is_mandatory     BOOLEAN     NOT NULL DEFAULT true,
  category         TEXT        NOT NULL DEFAULT 'tuition'
                     CHECK (category IN ('tuition','boarding','transport','uniform','books','exam','other')),
  created_by       UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT fee_structures_amount_positive CHECK (amount > 0)
);

-- ─── Invoices ────────────────────────────────────────────────
CREATE TABLE invoices (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no       TEXT          NOT NULL UNIQUE DEFAULT
                     'INV-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(nextval('invoice_seq')::TEXT, 5, '0'),
  student_id       UUID          NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_structure_id UUID          REFERENCES fee_structures(id) ON DELETE SET NULL,
  academic_year_id UUID          NOT NULL REFERENCES academic_years(id),
  term_id          UUID          REFERENCES terms(id) ON DELETE SET NULL,
  description      TEXT,
  amount           NUMERIC(12,2) NOT NULL,
  amount_paid      NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance          NUMERIC(12,2) GENERATED ALWAYS AS (amount - amount_paid) STORED,
  currency         TEXT          NOT NULL DEFAULT 'USD',
  due_date         DATE,
  status           TEXT          NOT NULL DEFAULT 'unpaid'
                     CHECK (status IN ('unpaid','partial','paid','overdue','waived','void')),
  notes            TEXT,
  created_by       UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ,

  CONSTRAINT invoices_amount_positive      CHECK (amount > 0),
  CONSTRAINT invoices_amount_paid_valid    CHECK (amount_paid >= 0),
  CONSTRAINT invoices_overpay_check        CHECK (amount_paid <= amount)
);

-- ─── Payments ────────────────────────────────────────────────
CREATE TABLE payments (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_no     TEXT          NOT NULL UNIQUE DEFAULT
                   'PAY-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(nextval('payment_seq')::TEXT, 5, '0'),
  invoice_id     UUID          NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  student_id     UUID          NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  amount         NUMERIC(12,2) NOT NULL,
  currency       TEXT          NOT NULL DEFAULT 'USD',
  payment_date   DATE          NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT          NOT NULL
                   CHECK (payment_method IN ('cash','bank_transfer','mobile_money','cheque','card','other')),
  reference_no   TEXT,
  received_by    UUID          NOT NULL REFERENCES profiles(id),
  notes          TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT payments_amount_positive CHECK (amount > 0)
);

-- ─── Trigger: update invoice.amount_paid after each payment ──
CREATE OR REPLACE FUNCTION update_invoice_amount_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE invoices
  SET
    amount_paid = (
      SELECT COALESCE(SUM(amount), 0)
      FROM payments
      WHERE invoice_id = NEW.invoice_id
    ),
    status = CASE
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE invoice_id = NEW.invoice_id) = 0
        THEN 'unpaid'
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE invoice_id = NEW.invoice_id) >= amount
        THEN 'paid'
      ELSE 'partial'
    END
  WHERE id = NEW.invoice_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER payments_update_invoice
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE PROCEDURE update_invoice_amount_paid();

-- ─── Payroll ─────────────────────────────────────────────────
CREATE TABLE payroll (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID          NOT NULL REFERENCES profiles(id),
  employee_type   TEXT          NOT NULL CHECK (employee_type IN ('teacher','staff')),
  month           INT           NOT NULL CHECK (month BETWEEN 1 AND 12),
  year            INT           NOT NULL CHECK (year >= 2020),
  basic_salary    NUMERIC(12,2) NOT NULL,
  allowances      NUMERIC(12,2) NOT NULL DEFAULT 0,
  gross_salary    NUMERIC(12,2) GENERATED ALWAYS AS (basic_salary + allowances) STORED,
  deductions      NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax             NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_salary      NUMERIC(12,2) GENERATED ALWAYS AS (basic_salary + allowances - deductions - tax) STORED,
  status          TEXT          NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','paid','cancelled')),
  payment_date    DATE,
  payment_method  TEXT,
  reference_no    TEXT,
  notes           TEXT,
  prepared_by     UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by     UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT payroll_employee_month_year_unique UNIQUE (employee_id, month, year),
  CONSTRAINT payroll_salary_positive            CHECK (basic_salary > 0),
  CONSTRAINT payroll_deductions_valid           CHECK (deductions >= 0),
  CONSTRAINT payroll_tax_valid                  CHECK (tax >= 0)
);

-- ─── Expenses ────────────────────────────────────────────────
CREATE TABLE expenses (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  category       TEXT          NOT NULL
                   CHECK (category IN ('salaries','utilities','maintenance','supplies','equipment','transport','events','other')),
  description    TEXT          NOT NULL,
  amount         NUMERIC(12,2) NOT NULL,
  currency       TEXT          NOT NULL DEFAULT 'USD',
  expense_date   DATE          NOT NULL DEFAULT CURRENT_DATE,
  vendor         TEXT,
  receipt_no     TEXT,
  receipt_url    TEXT,
  payment_method TEXT,
  status         TEXT          NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','paid','rejected')),
  submitted_by   UUID          NOT NULL REFERENCES profiles(id),
  approved_by    UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at    TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT expenses_amount_positive CHECK (amount > 0)
);

-- ─── Triggers: updated_at ────────────────────────────────────
CREATE TRIGGER fee_structures_updated_at
  BEFORE UPDATE ON fee_structures
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER payroll_updated_at
  BEFORE UPDATE ON payroll
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- ─── Enable RLS ──────────────────────────────────────────────
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll        ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses       ENABLE ROW LEVEL SECURITY;
