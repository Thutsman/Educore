# Procurement (requisition) — manual QA checklist

Use two schools (different `school_id`) and distinct users where possible so RLS and initiator rules are exercised.

## School setting: procurement initiator

| Setting | Expected |
|--------|----------|
| `bursar` | Only users with **bursar** in the school can create draft requisitions. Deputy cannot insert drafts. |
| `deputy_headmaster` | Only **deputy_headmaster** can create drafts. Bursar cannot insert drafts. |
| `either` | **Bursar** or **deputy_headmaster** can create drafts. |

**School Admin:** dashboard block “Procurement initiator” updates `schools.procurement_initiator` and persists after reload.

## Requisition lifecycle (single school)

1. Create draft → add ≥1 quote → select exactly one quote.
2. Submit → status `pending_headmaster`.
3. **Headmaster:** Approve → `approved`; or Reject with reason → `rejected`.
4. **Headmaster-only:** Deputy must not succeed on approve/reject for `pending_headmaster` (blocked by RLS).
5. **Bursar:** From `approved`, mark order issued → `ordered` (supplier ref / notes as implemented).
6. **Record expense:** From Procurement or **`/finance?tab=expenses&prefillReq=<id>`** — expense created with `requisition_id`, then requisition **`linked_expense_id`** populated; procurement queries refresh.

## Cross-school isolation

| Check | Expected |
|------|----------|
| User A (`school_id` X) selects requisitions | Only rows where `purchase_requisitions.school_id = X`. |
| User B (`school_id` Y) | No visibility of School X requisitions (unless overlapping roles contradict this). |

## Finance alignment

| Check | Expected |
|------|----------|
| Expense insert with `requisition_id` | Allowed only when requisition is `approved` or `ordered`, `linked_expense_id` is null, school matches (per migration policies). |
| Linked expense | `linkRequisitionExpense` updates `purchase_requisitions.linked_expense_id` after successful expense create when the prefill flow is used. |

## Headmaster dashboard

- Stat / card shows pending **HM** procurement count when relevant.
- Link opens **`/finance?tab=procurement&filter=pending_hm`** (or equivalent implemented filter).

## Regression smoke

- **Expenses** tab: create/edit pending, approve/reject (HM/deputy), mark paid unchanged.
- **Invoices** tab unchanged.

After schema changes: run latest migrations (including `053_procurement_requisitions.sql`) on the environment under test before executing this matrix.
