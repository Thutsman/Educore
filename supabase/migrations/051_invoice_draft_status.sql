-- Draft invoices for batch class invoicing; finalized to unpaid when issued.

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE invoices
  ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft', 'unpaid', 'partial', 'paid', 'overdue', 'waived', 'void'));

CREATE OR REPLACE FUNCTION reject_payment_on_draft_invoice()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM invoices WHERE id = NEW.invoice_id AND status = 'draft') THEN
    RAISE EXCEPTION 'cannot_record_payment_on_draft_invoice';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payments_reject_draft_invoice ON payments;

CREATE TRIGGER payments_reject_draft_invoice
  BEFORE INSERT ON payments
  FOR EACH ROW EXECUTE PROCEDURE reject_payment_on_draft_invoice();
