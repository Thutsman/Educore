import { supabase } from '@/lib/supabase'
import type {
  Invoice,
  Payment,
  Expense,
  InvoiceFormData,
  PaymentFormData,
  ExpenseFormData,
  Budget,
  BudgetFormData,
} from '../types'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const n = (v: unknown) => Number(v) || 0

// ─── Invoices ────────────────────────────────────────────────────────────────

export async function getInvoices(
  schoolId: string,
  filters?: { status?: string; search?: string; academic_year_id?: string; term_id?: string },
): Promise<Invoice[]> {
  let q = supabase
    .from('invoices')
    .select('id, invoice_no, student_id, amount, amount_paid, balance, status, due_date, description, created_at, student:students(full_name, class:classes(name))')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') q = q.eq('status', filters.status)
  if (filters?.search) q = q.ilike('invoice_no', `%${filters.search}%`)
  if (filters?.academic_year_id) q = q.eq('academic_year_id', filters.academic_year_id)
  if (filters?.term_id) q = q.eq('term_id', filters.term_id)

  const { data, error } = await q
  if (error || !data) return []

  type Raw = { id: string; invoice_no: string; student_id: string; amount: unknown; amount_paid: unknown; balance: unknown; status: string; due_date: string | null; description: string | null; created_at: string; student: { full_name: string; class: { name: string } | null } | null }
  return (data as unknown as Raw[]).map(r => ({
    id: r.id,
    invoice_number: r.invoice_no,
    student_id: r.student_id,
    student_name: r.student?.full_name ?? '—',
    class_name: r.student?.class?.name ?? null,
    amount: n(r.amount),
    amount_paid: n(r.amount_paid),
    balance: n(r.balance),
    status: r.status as Invoice['status'],
    due_date: r.due_date,
    description: r.description,
    created_at: r.created_at,
  }))
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('id, invoice_no, student_id, amount, amount_paid, balance, status, due_date, description, created_at, student:students(full_name, class:classes(name))')
    .eq('id', id)
    .single()
  if (error || !data) return null
  type Raw = { id: string; invoice_no: string; student_id: string; amount: unknown; amount_paid: unknown; balance: unknown; status: string; due_date: string | null; description: string | null; created_at: string; student: { full_name: string; class: { name: string } | null } | null }
  const r = data as unknown as Raw
  return {
    id: r.id, invoice_number: r.invoice_no, student_id: r.student_id,
    student_name: r.student?.full_name ?? '—',
    class_name: r.student?.class?.name ?? null,
    amount: n(r.amount), amount_paid: n(r.amount_paid), balance: n(r.balance),
    status: r.status as Invoice['status'], due_date: r.due_date,
    description: r.description, created_at: r.created_at,
  }
}

export async function createInvoice(schoolId: string, d: InvoiceFormData): Promise<boolean> {
  const { error } = await db.from('invoices').insert({
    student_id: d.student_id,
    amount: d.amount,
    academic_year_id: d.academic_year_id,
    term_id: d.term_id || null,
    due_date: d.due_date || null,
    description: d.description || null,
    school_id: schoolId,
  })
  return !error
}

export async function voidInvoice(id: string): Promise<boolean> {
  const { error } = await db.from('invoices').update({ status: 'void' }).eq('id', id)
  return !error
}

// ─── Payments ────────────────────────────────────────────────────────────────

export async function getPaymentsForInvoice(invoiceId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('id, invoice_id, amount, payment_date, payment_method, reference_no, notes, created_at')
    .eq('invoice_id', invoiceId)
    .order('payment_date', { ascending: false })
  if (error || !data) return []
  type Raw = { id: string; invoice_id: string; amount: unknown; payment_date: string; payment_method: string; reference_no: string | null; notes: string | null; created_at: string }
  return (data as unknown as Raw[]).map(r => ({
    id: r.id, invoice_id: r.invoice_id,
    amount: n(r.amount), payment_date: r.payment_date,
    payment_method: r.payment_method as Payment['payment_method'],
    reference_number: r.reference_no, notes: r.notes, created_at: r.created_at,
  }))
}

export async function recordPayment(schoolId: string, d: PaymentFormData): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { error } = await db.from('payments').insert({
    invoice_id: d.invoice_id,
    student_id: d.student_id,
    amount: d.amount,
    payment_date: d.payment_date,
    payment_method: d.payment_method,
    reference_no: d.reference_number || null,
    notes: d.notes || null,
    received_by: user.id,
    school_id: schoolId,
  })
  return !error
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export async function getExpenses(
  schoolId: string,
  filters?: { category?: string; search?: string; date_from?: string; date_to?: string },
): Promise<Expense[]> {
  let q = supabase
    .from('expenses')
    .select('id, description, amount, category, expense_date, vendor, receipt_no, notes, created_at')
    .eq('school_id', schoolId)
    .order('expense_date', { ascending: false })
  if (filters?.category && filters.category !== 'all') q = q.eq('category', filters.category)
  if (filters?.search) q = q.ilike('description', `%${filters.search}%`)
  if (filters?.date_from) q = q.gte('expense_date', filters.date_from)
  if (filters?.date_to) q = q.lte('expense_date', filters.date_to)
  const { data, error } = await q
  if (error || !data) return []
  type Raw = { id: string; description: string; amount: unknown; category: string; expense_date: string; vendor: string | null; receipt_no: string | null; notes: string | null; created_at: string }
  return (data as unknown as Raw[]).map(r => ({
    id: r.id,
    description: r.description,
    amount: n(r.amount),
    category: r.category as Expense['category'],
    expense_date: r.expense_date,
    paid_to: r.vendor,
    reference_number: r.receipt_no,
    notes: r.notes,
    created_at: r.created_at,
  }))
}

export async function createExpense(schoolId: string, d: ExpenseFormData): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await db.from('expenses').insert({
    description: d.description,
    amount: d.amount,
    category: d.category,
    expense_date: d.expense_date,
    vendor: d.paid_to || null,
    receipt_no: d.reference_number || null,
    notes: d.notes || null,
    school_id: schoolId,
    submitted_by: user.id,
    status: 'paid',
  })
  return !error
}

export async function updateExpense(id: string, d: Partial<ExpenseFormData>): Promise<boolean> {
  const { error } = await db.from('expenses').update(d).eq('id', id)
  return !error
}

export async function deleteExpense(id: string): Promise<boolean> {
  const { error } = await db.from('expenses').delete().eq('id', id)
  return !error
}

// ─── Students for invoice form ────────────────────────────────────────────────
export async function getStudentsForInvoice(schoolId: string): Promise<{ id: string; full_name: string; admission_number: string }[]> {
  const { data, error } = await supabase
    .from('students')
    .select('id, full_name, admission_no')
    .eq('school_id', schoolId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('full_name')
  if (error || !data) return []
  type Raw = { id: string; full_name: string; admission_no: string }
  return (data as unknown as Raw[]).map(r => ({ id: r.id, full_name: r.full_name, admission_number: r.admission_no }))
}

// ─── Budgets ───────────────────────────────────────────────────────────────────

export async function getBudgets(
  schoolId: string,
  filters?: { academic_year_id?: string; term_id?: string; category?: string },
): Promise<Budget[]> {
  let q = supabase
    .from('budgets')
    .select('id, school_id, category, allocated_amount, academic_year_id, term_id, notes, created_at, updated_at')
    .eq('school_id', schoolId)
    .is('deleted_at', null)

  if (filters?.academic_year_id) q = q.eq('academic_year_id', filters.academic_year_id)
  if (typeof filters?.term_id === 'string') {
    if (filters.term_id === '__none__') q = q.is('term_id', null)
    else q = q.eq('term_id', filters.term_id)
  }
  if (filters?.category && filters.category !== 'all') q = q.eq('category', filters.category)

  const { data, error } = await q.order('created_at', { ascending: false })
  if (error || !data) return []

  type Raw = {
    id: string
    school_id: string
    category: string
    allocated_amount: unknown
    academic_year_id: string
    term_id: string | null
    notes: string | null
    created_at: string
    updated_at: string
  }

  return (data as unknown as Raw[]).map((r) => ({
    id: r.id,
    school_id: r.school_id,
    category: r.category as Budget['category'],
    allocated_amount: n(r.allocated_amount),
    academic_year_id: r.academic_year_id,
    term_id: r.term_id,
    notes: r.notes,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }))
}

export async function createBudget(schoolId: string, d: BudgetFormData): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await db.from('budgets').insert({
    school_id: schoolId,
    category: d.category,
    allocated_amount: d.allocated_amount,
    academic_year_id: d.academic_year_id,
    term_id: d.term_id || null,
    notes: d.notes || null,
    created_by: user.id,
  })

  return !error
}

export async function updateBudget(id: string, d: Partial<BudgetFormData>): Promise<boolean> {
  const { error } = await db.from('budgets').update({
    category: d.category,
    allocated_amount: d.allocated_amount,
    academic_year_id: d.academic_year_id,
    term_id: d.term_id ?? null,
    notes: d.notes ?? null,
  }).eq('id', id)
  return !error
}

export async function deleteBudget(id: string): Promise<boolean> {
  const { error } = await db.from('budgets').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  return !error
}

