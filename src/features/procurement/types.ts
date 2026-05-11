import type { ExpenseCategory } from '@/features/finance/types'

export type ProcurementInitiator = 'bursar' | 'deputy_headmaster' | 'either'

export type PurchaseRequisitionStatus =
  | 'draft'
  | 'pending_headmaster'
  | 'approved'
  | 'rejected'
  | 'ordered'

export interface RequisitionQuote {
  id: string
  requisition_id: string
  supplier_name: string
  quoted_amount: number
  currency: string
  quote_date: string
  notes: string | null
  selected: boolean
  attachment_url: string | null
  created_at: string
}

export interface PurchaseRequisition {
  id: string
  school_id: string
  reference_no: string
  title: string
  justification: string | null
  category: ExpenseCategory
  estimated_amount: number | null
  currency: string
  status: PurchaseRequisitionStatus
  raised_by: string
  submitted_at: string | null
  approved_by: string | null
  approved_at: string | null
  rejected_by: string | null
  rejected_at: string | null
  rejection_reason: string | null
  ordered_at: string | null
  order_notes: string | null
  supplier_reference: string | null
  linked_expense_id: string | null
  created_at: string
  updated_at: string
}

export interface PurchaseRequisitionWithQuotes extends PurchaseRequisition {
  quotes: RequisitionQuote[]
}

export interface CreateRequisitionInput {
  title: string
  justification?: string | null
  category: ExpenseCategory
  estimated_amount?: number | null
}

export interface UpdateDraftRequisitionInput {
  title: string
  justification?: string | null
  category: ExpenseCategory
  estimated_amount?: number | null
}

export interface QuoteInput {
  supplier_name: string
  quoted_amount: number
  quote_date?: string
  notes?: string | null
}

export interface MarkOrderedInput {
  order_notes?: string | null
  supplier_reference?: string | null
}
