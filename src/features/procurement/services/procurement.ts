import { supabase } from '@/lib/supabase'
import type { ExpenseCategory } from '@/features/finance/types'
import type {
  CreateRequisitionInput,
  MarkOrderedInput,
  ProcurementInitiator,
  PurchaseRequisition,
  PurchaseRequisitionWithQuotes,
  QuoteInput,
  RequisitionQuote,
  UpdateDraftRequisitionInput,
} from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const n = (v: unknown) => Number(v) || 0

function mapRow(r: Record<string, unknown>): PurchaseRequisition {
  return {
    id: r.id as string,
    school_id: r.school_id as string,
    reference_no: r.reference_no as string,
    title: r.title as string,
    justification: (r.justification ?? null) as string | null,
    category: r.category as PurchaseRequisition['category'],
    estimated_amount: r.estimated_amount != null ? n(r.estimated_amount) : null,
    currency: (r.currency as string) ?? 'USD',
    status: r.status as PurchaseRequisition['status'],
    raised_by: r.raised_by as string,
    submitted_at: (r.submitted_at ?? null) as string | null,
    approved_by: (r.approved_by ?? null) as string | null,
    approved_at: (r.approved_at ?? null) as string | null,
    rejected_by: (r.rejected_by ?? null) as string | null,
    rejected_at: (r.rejected_at ?? null) as string | null,
    rejection_reason: (r.rejection_reason ?? null) as string | null,
    ordered_at: (r.ordered_at ?? null) as string | null,
    order_notes: (r.order_notes ?? null) as string | null,
    supplier_reference: (r.supplier_reference ?? null) as string | null,
    linked_expense_id: (r.linked_expense_id ?? null) as string | null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
  }
}

function mapQuote(r: Record<string, unknown>): RequisitionQuote {
  return {
    id: r.id as string,
    requisition_id: r.requisition_id as string,
    supplier_name: r.supplier_name as string,
    quoted_amount: n(r.quoted_amount),
    currency: (r.currency as string) ?? 'USD',
    quote_date: r.quote_date as string,
    notes: (r.notes ?? null) as string | null,
    selected: Boolean(r.selected),
    attachment_url: (r.attachment_url ?? null) as string | null,
    created_at: r.created_at as string,
  }
}

export async function getSchoolProcurementInitiator(schoolId: string): Promise<ProcurementInitiator | null> {
  const { data, error } = await supabase
    .from('schools')
    .select('procurement_initiator')
    .eq('id', schoolId)
    .maybeSingle()
  if (error || !data) return null
  return (data as { procurement_initiator: ProcurementInitiator }).procurement_initiator
}

export async function updateSchoolProcurementInitiator(
  schoolId: string,
  value: ProcurementInitiator,
): Promise<boolean> {
  const { error } = await db
    .from('schools')
    .update({ procurement_initiator: value })
    .eq('id', schoolId)
  return !error
}

export async function countPendingProcurementApprovals(schoolId: string): Promise<number> {
  const { count, error } = await supabase
    .from('purchase_requisitions')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('status', 'pending_headmaster')
  if (error) return 0
  return count ?? 0
}

export async function listRequisitions(schoolId: string): Promise<PurchaseRequisition[]> {
  const { data, error } = await supabase
    .from('purchase_requisitions')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as Record<string, unknown>[]).map(mapRow)
}

export async function getRequisitionWithQuotes(
  schoolId: string,
  id: string,
): Promise<PurchaseRequisitionWithQuotes | null> {
  const { data: pr, error } = await supabase
    .from('purchase_requisitions')
    .select('*')
    .eq('school_id', schoolId)
    .eq('id', id)
    .maybeSingle()
  if (error || !pr) return null
  const row = mapRow(pr as Record<string, unknown>)
  const { data: qs } = await supabase
    .from('requisition_quotes')
    .select('*')
    .eq('requisition_id', id)
    .order('created_at', { ascending: true })
  const quotes = ((qs ?? []) as Record<string, unknown>[]).map(mapQuote)
  return { ...row, quotes }
}

export async function getRequisitionExpensePrefill(
  schoolId: string,
  requisitionId: string,
): Promise<{
  description: string
  category: ExpenseCategory
  amount: number
  paid_to: string
  expense_date: string
} | null> {
  const det = await getRequisitionWithQuotes(schoolId, requisitionId)
  if (
    !det ||
    !(det.status === 'approved' || det.status === 'ordered') ||
    det.linked_expense_id
  )
    return null
  const selected = det.quotes.find((q) => q.selected)
  const amt = selected?.quoted_amount ?? det.estimated_amount
  if (amt == null || amt <= 0) return null
  return {
    description: `${det.title}${det.justification ? ` — ${det.justification.slice(0, 200)}` : ''}`,
    category: det.category,
    amount: amt,
    paid_to: selected?.supplier_name ?? '',
    expense_date: new Date().toISOString().slice(0, 10),
  }
}

export async function createDraftRequisition(
  schoolId: string,
  userId: string,
  input: CreateRequisitionInput,
): Promise<string | null> {
  const payload = {
    school_id: schoolId,
    raised_by: userId,
    status: 'draft',
    title: input.title.trim(),
    justification: input.justification?.trim() || null,
    category: input.category,
    estimated_amount:
      input.estimated_amount != null && input.estimated_amount > 0 ? input.estimated_amount : null,
    currency: 'USD',
    reference_no: null,
  }
  const { data, error } = await db.from('purchase_requisitions').insert(payload).select('id').maybeSingle()
  if (error || !data?.id) return null
  return data.id as string
}

export async function updateDraftRequisition(
  schoolId: string,
  id: string,
  input: UpdateDraftRequisitionInput,
): Promise<boolean> {
  const { data, error } = await db
    .from('purchase_requisitions')
    .update({
      title: input.title.trim(),
      justification: input.justification?.trim() || null,
      category: input.category,
      estimated_amount:
        input.estimated_amount != null && input.estimated_amount > 0 ? input.estimated_amount : null,
    })
    .eq('id', id)
    .eq('school_id', schoolId)
    .eq('status', 'draft')
    .select('id')
    .maybeSingle()
  return !error && !!data
}

export async function submitRequisition(schoolId: string, id: string): Promise<boolean> {
  const det = await getRequisitionWithQuotes(schoolId, id)
  if (!det || det.status !== 'draft') return false
  if (det.quotes.length < 1) return false
  if (!det.quotes.some((q) => q.selected)) return false
  const { data, error } = await db
    .from('purchase_requisitions')
    .update({
      status: 'pending_headmaster',
      submitted_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('school_id', schoolId)
    .eq('status', 'draft')
    .select('id')
    .maybeSingle()
  return !error && !!data
}

export async function addQuote(
  requisitionId: string,
  input: QuoteInput,
): Promise<boolean> {
  const { error } = await db.from('requisition_quotes').insert({
    requisition_id: requisitionId,
    supplier_name: input.supplier_name.trim(),
    quoted_amount: input.quoted_amount,
    currency: 'USD',
    quote_date: input.quote_date ?? new Date().toISOString().slice(0, 10),
    notes: input.notes?.trim() || null,
    selected: false,
  })
  return !error
}

export async function deleteQuote(quoteId: string): Promise<boolean> {
  const { error } = await db.from('requisition_quotes').delete().eq('id', quoteId)
  return !error
}

export async function setSelectedQuote(requisitionId: string, quoteId: string): Promise<boolean> {
  const { error: e1 } = await db
    .from('requisition_quotes')
    .update({ selected: false })
    .eq('requisition_id', requisitionId)
  if (e1) return false
  const { data, error } = await db
    .from('requisition_quotes')
    .update({ selected: true })
    .eq('id', quoteId)
    .eq('requisition_id', requisitionId)
    .select('id')
    .maybeSingle()
  return !error && !!data
}

export async function approveRequisitionHM(
  requisitionId: string,
  schoolId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await db
    .from('purchase_requisitions')
    .update({
      status: 'approved',
      approved_by: userId,
      approved_at: new Date().toISOString(),
      rejection_reason: null,
      rejected_by: null,
      rejected_at: null,
    })
    .eq('id', requisitionId)
    .eq('school_id', schoolId)
    .eq('status', 'pending_headmaster')
    .select('id')
    .maybeSingle()
  return !error && !!data
}

export async function rejectRequisitionHM(
  requisitionId: string,
  schoolId: string,
  userId: string,
  reason: string,
): Promise<boolean> {
  const r = reason.trim()
  if (!r) return false
  const { data, error } = await db
    .from('purchase_requisitions')
    .update({
      status: 'rejected',
      rejected_by: userId,
      rejected_at: new Date().toISOString(),
      rejection_reason: r,
      approved_by: null,
      approved_at: null,
    })
    .eq('id', requisitionId)
    .eq('school_id', schoolId)
    .eq('status', 'pending_headmaster')
    .select('id')
    .maybeSingle()
  return !error && !!data
}

export async function markRequisitionOrdered(
  schoolId: string,
  requisitionId: string,
  input: MarkOrderedInput,
): Promise<boolean> {
  const { data, error } = await db
    .from('purchase_requisitions')
    .update({
      status: 'ordered',
      ordered_at: new Date().toISOString(),
      order_notes: input.order_notes?.trim() || null,
      supplier_reference: input.supplier_reference?.trim() || null,
    })
    .eq('id', requisitionId)
    .eq('school_id', schoolId)
    .eq('status', 'approved')
    .select('id')
    .maybeSingle()
  return !error && !!data
}

export async function linkRequisitionExpense(
  schoolId: string,
  requisitionId: string,
  expenseId: string,
): Promise<boolean> {
  const { data, error } = await db
    .from('purchase_requisitions')
    .update({ linked_expense_id: expenseId })
    .eq('id', requisitionId)
    .eq('school_id', schoolId)
    .in('status', ['approved', 'ordered'])
    .is('linked_expense_id', null)
    .select('id')
    .maybeSingle()
  return !error && !!data
}
