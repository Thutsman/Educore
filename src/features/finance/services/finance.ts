import { supabase } from '@/lib/supabase'
import type { Invoice, Payment, Expense, InvoiceFormData, PaymentFormData, ExpenseFormData } from '../types'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const n = (v: unknown) => Number(v) || 0

// ─── Invoices ────────────────────────────────────────────────────────────────

export async function getInvoices(filters?: { status?: string; search?: string }): Promise<Invoice[]> {
  let q = supabase
    .from('invoices')
    .select('id, invoice_no, student_id, amount, amount_paid, balance, status, due_date, description, created_at, student:students(full_name, class:classes(name))')
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') q = q.eq('status', filters.status)
  if (filters?.search) q = q.ilike('invoice_no', `%${filters.search}%`)

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

export async function createInvoice(d: InvoiceFormData): Promise<boolean> {
  const { error } = await db.from('invoices').insert({
    student_id: d.student_id, amount: d.amount,
    due_date: d.due_date || null, description: d.description || null,
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

export async function recordPayment(d: PaymentFormData): Promise<boolean> {
  const { error } = await db.from('payments').insert({
    invoice_id: d.invoice_id, amount: d.amount,
    payment_date: d.payment_date, payment_method: d.payment_method,
    reference_no: d.reference_number || null, notes: d.notes || null,
  })
  return !error
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export async function getExpenses(filters?: { category?: string; search?: string }): Promise<Expense[]> {
  let q = supabase
    .from('expenses')
    .select('id, description, amount, category, expense_date, paid_to, reference_number, notes, created_at')
    .order('expense_date', { ascending: false })
  if (filters?.category && filters.category !== 'all') q = q.eq('category', filters.category)
  if (filters?.search) q = q.ilike('description', `%${filters.search}%`)
  const { data, error } = await q
  if (error || !data) return []
  type Raw = { id: string; description: string; amount: unknown; category: string; expense_date: string; paid_to: string | null; reference_number: string | null; notes: string | null; created_at: string }
  return (data as unknown as Raw[]).map(r => ({
    id: r.id, description: r.description, amount: n(r.amount),
    category: r.category as Expense['category'], expense_date: r.expense_date,
    paid_to: r.paid_to, reference_number: r.reference_number, notes: r.notes, created_at: r.created_at,
  }))
}

export async function createExpense(d: ExpenseFormData): Promise<boolean> {
  const { error } = await db.from('expenses').insert({
    description: d.description, amount: d.amount, category: d.category,
    expense_date: d.expense_date, paid_to: d.paid_to || null,
    reference_number: d.reference_number || null, notes: d.notes || null,
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
export async function getStudentsForInvoice(): Promise<{ id: string; full_name: string; admission_number: string }[]> {
  const { data, error } = await supabase
    .from('students')
    .select('id, full_name, admission_no')
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('full_name')
  if (error || !data) return []
  type Raw = { id: string; full_name: string; admission_no: string }
  return (data as unknown as Raw[]).map(r => ({ id: r.id, full_name: r.full_name, admission_number: r.admission_no }))
}
