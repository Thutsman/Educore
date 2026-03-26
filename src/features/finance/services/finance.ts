import { format, parseISO } from 'date-fns'
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
  FinanceReportFilters,
  ExpenseLineItem,
  FeeCollectionLineItem,
  RevenueLineItem,
  IncomeStatementLineItems,
  BudgetVsActualLine,
} from '../types'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const n = (v: unknown) => Number(v) || 0

function endOfDayIso(dateTo: string): string {
  return `${dateTo}T23:59:59.999Z`
}

function mapExpenseFormData(d: Partial<ExpenseFormData>) {
  const payload: Record<string, unknown> = {}
  if ('description' in d) payload.description = d.description
  if ('amount' in d) payload.amount = d.amount
  if ('category' in d) payload.category = d.category
  if ('expense_date' in d) payload.expense_date = d.expense_date
  if ('paid_to' in d) payload.vendor = d.paid_to || null
  if ('reference_number' in d) payload.receipt_no = d.reference_number || null
  if ('notes' in d) payload.notes = d.notes || null
  return payload
}

function applyInvoiceReportFilters<T extends { eq: (...a: unknown[]) => T; gte: (...a: unknown[]) => T; lte: (...a: unknown[]) => T }>(
  q: T,
  filters?: FinanceReportFilters,
): T {
  let x = q
  if (filters?.academic_year_id) x = x.eq('academic_year_id', filters.academic_year_id) as T
  if (filters?.term_id) x = x.eq('term_id', filters.term_id) as T
  if (filters?.date_from) x = x.gte('created_at', filters.date_from) as T
  if (filters?.date_to) x = x.lte('created_at', endOfDayIso(filters.date_to)) as T
  return x
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export async function getInvoices(
  schoolId: string,
  filters?: { status?: string; search?: string; academic_year_id?: string; term_id?: string },
): Promise<Invoice[]> {
  let q = supabase
    .from('invoices')
    .select('id, invoice_no, student_id, amount, amount_paid, balance, status, due_date, description, created_at, student:students(full_name, class:classes(name))')
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    if (filters.status === 'outstanding') {
      q = q.in('status', ['unpaid', 'partial', 'overdue'])
    } else {
      q = q.eq('status', filters.status)
    }
  }
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
    .is('deleted_at', null)
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
    .select('id, invoice_id, payment_no, amount, payment_date, payment_method, reference_no, notes, created_at')
    .eq('invoice_id', invoiceId)
    .order('payment_date', { ascending: false })
  if (error || !data) return []
  type Raw = { id: string; invoice_id: string; payment_no: string | null; amount: unknown; payment_date: string; payment_method: string; reference_no: string | null; notes: string | null; created_at: string }
  return (data as unknown as Raw[]).map(r => ({
    id: r.id, invoice_id: r.invoice_id, payment_no: r.payment_no ?? null,
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
    .select('id, description, amount, category, expense_date, vendor, receipt_no, notes, created_at, status, payment_method, approved_at, approved_by, rejected_at, rejected_by, rejection_reason')
    .eq('school_id', schoolId)
    .order('expense_date', { ascending: false })
  if (filters?.category && filters.category !== 'all') q = q.eq('category', filters.category)
  if (filters?.search) q = q.ilike('description', `%${filters.search}%`)
  if (filters?.date_from) q = q.gte('expense_date', filters.date_from)
  if (filters?.date_to) q = q.lte('expense_date', filters.date_to)
  const { data, error } = await q
  if (error || !data) return []
  type Raw = {
    id: string
    description: string
    amount: unknown
    category: string
    expense_date: string
    vendor: string | null
    receipt_no: string | null
    notes: string | null
    created_at: string
    status: string
    payment_method: string | null
    approved_at: string | null
    approved_by: string | null
    rejected_at: string | null
    rejected_by: string | null
    rejection_reason: string | null
  }
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
    status: r.status as Expense['status'],
    payment_method: r.payment_method,
    approved_at: r.approved_at,
    approved_by: r.approved_by,
    rejected_at: r.rejected_at,
    rejected_by: r.rejected_by,
    rejection_reason: r.rejection_reason,
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
    status: 'pending',
  })
  return !error
}

export async function updateExpense(id: string, d: Partial<ExpenseFormData>): Promise<boolean> {
  const payload = mapExpenseFormData(d)
  const { data, error } = await db
    .from('expenses')
    .update(payload)
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()
  return !error && !!data
}

export async function deleteExpense(id: string): Promise<boolean> {
  const { data, error } = await db
    .from('expenses')
    .delete()
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()
  return !error && !!data
}

export async function approveExpense(expenseId: string, userId: string): Promise<boolean> {
  const { data, error } = await db
    .from('expenses')
    .update({
      status: 'approved',
      approved_by: userId,
      approved_at: new Date().toISOString(),
      rejected_by: null,
      rejected_at: null,
      rejection_reason: null,
    })
    .eq('id', expenseId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()
  return !error && !!data
}

export async function rejectExpense(expenseId: string, userId: string, reason: string): Promise<boolean> {
  const trimmedReason = reason.trim()
  if (!trimmedReason) return false

  const { data, error } = await db
    .from('expenses')
    .update({
      status: 'rejected',
      rejected_by: userId,
      rejected_at: new Date().toISOString(),
      rejection_reason: trimmedReason,
      approved_by: null,
      approved_at: null,
    })
    .eq('id', expenseId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()
  return !error && !!data
}

export async function markExpenseAsPaid(expenseId: string): Promise<boolean> {
  const { data, error } = await db
    .from('expenses')
    .update({ status: 'paid' })
    .eq('id', expenseId)
    .eq('status', 'approved')
    .select('id')
    .maybeSingle()
  return !error && !!data
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

// ─── Bursar / report queries ─────────────────────────────────────────────────

export async function getBursarExpenseLineItems(
  schoolId: string,
  filters?: FinanceReportFilters,
): Promise<ExpenseLineItem[]> {
  let q = supabase
    .from('expenses')
    .select('expense_date, description, category, amount, vendor, receipt_no, payment_method, status, notes')
    .eq('school_id', schoolId)
    .eq('status', 'paid')
    .order('expense_date', { ascending: false })
  if (filters?.date_from) q = q.gte('expense_date', filters.date_from)
  if (filters?.date_to) q = q.lte('expense_date', filters.date_to)
  const { data, error } = await q
  if (error || !data) return []
  type Raw = { expense_date: string; description: string; category: string; amount: unknown; vendor: string | null; receipt_no: string | null; payment_method: string | null; status: string; notes: string | null }
  return (data as Raw[]).map((r) => ({
    expense_date: r.expense_date,
    description: r.description,
    category: r.category,
    amount: n(r.amount),
    vendor: r.vendor,
    receipt_no: r.receipt_no,
    payment_method: r.payment_method,
    status: r.status,
    notes: r.notes,
  }))
}

type RawPaymentEmbed = { payment_date: string; payment_method: string; amount: unknown; payment_no: string | null }
type RawInvoiceRow = {
  invoice_no: string
  description: string | null
  amount: unknown
  amount_paid: unknown
  balance: unknown
  due_date: string | null
  created_at: string
  status: string
  student: { full_name: string; class: { name: string } | null } | null
  payments: RawPaymentEmbed[] | null
}

function lastPaymentFromList(payments: RawPaymentEmbed[]): { date: string; method: string } | null {
  if (!payments?.length) return null
  const sorted = [...payments].sort((a, b) => (a.payment_date < b.payment_date ? 1 : a.payment_date > b.payment_date ? -1 : 0))
  const p = sorted[0]
  return { date: p.payment_date, method: p.payment_method }
}

export async function getBursarFeeCollectionLineItems(
  schoolId: string,
  filters?: FinanceReportFilters,
): Promise<FeeCollectionLineItem[]> {
  let q = supabase
    .from('invoices')
    .select(`
      invoice_no, description, amount, amount_paid, balance,
      due_date, created_at, status,
      student:students(full_name, class:classes(name)),
      payments(payment_date, payment_method, amount, payment_no)
    `)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('due_date', { ascending: true })
  q = applyInvoiceReportFilters(q as never, filters) as never
  const { data, error } = await q
  if (error || !data) return []
  return (data as unknown as RawInvoiceRow[]).map((r) => {
    const pays = (r.payments ?? []) as RawPaymentEmbed[]
    const last = lastPaymentFromList(pays)
    return {
      invoice_no: r.invoice_no,
      student_name: r.student?.full_name ?? '—',
      class_name: r.student?.class?.name ?? null,
      invoice_date: r.created_at,
      due_date: r.due_date,
      description: r.description,
      invoiced_amount: n(r.amount),
      paid_amount: n(r.amount_paid),
      outstanding_amount: n(r.balance),
      status: r.status,
      last_payment_date: last?.date ?? null,
      last_payment_method: last?.method ?? null,
      payments: pays.map((p) => ({
        payment_date: p.payment_date,
        payment_method: p.payment_method,
        amount: n(p.amount),
        payment_no: p.payment_no,
      })),
    }
  })
}

export async function getBursarIncomeStatementLineItems(
  schoolId: string,
  filters?: FinanceReportFilters,
): Promise<IncomeStatementLineItems> {
  let payQ = supabase
    .from('payments')
    .select(`
      payment_no, payment_date, payment_method, amount, notes,
      student:students(full_name),
      invoice:invoices(description, academic_year_id, term_id)
    `)
    .eq('school_id', schoolId)
    .order('payment_date', { ascending: false })
  if (filters?.date_from) payQ = payQ.gte('payment_date', filters.date_from)
  if (filters?.date_to) payQ = payQ.lte('payment_date', filters.date_to)
  const payRes = await payQ

  type RawPay = {
    payment_no: string | null
    payment_date: string
    payment_method: string
    amount: unknown
    notes: string | null
    student: { full_name: string } | null
    invoice: { description: string | null; academic_year_id: string; term_id: string | null } | { description: string | null; academic_year_id: string; term_id: string | null }[] | null
  }
  const payRows = (payRes.data ?? []) as RawPay[]
  const revenues: RevenueLineItem[] = payRows
    .filter((r) => {
      const inv = Array.isArray(r.invoice) ? r.invoice[0] : r.invoice
      if (filters?.academic_year_id && (!inv || inv.academic_year_id !== filters.academic_year_id)) return false
      if (filters?.term_id && (!inv || inv.term_id !== filters.term_id)) return false
      return true
    })
    .map((r) => {
      const inv = Array.isArray(r.invoice) ? r.invoice[0] : r.invoice
      return {
        payment_no: r.payment_no,
        payment_date: r.payment_date,
        payment_method: r.payment_method,
        amount: n(r.amount),
        notes: r.notes,
        student_name: r.student?.full_name ?? '—',
        invoice_description: inv?.description ?? null,
      }
    })

  let expQ = supabase
    .from('expenses')
    .select('expense_date, receipt_no, description, category, vendor, payment_method, amount')
    .eq('school_id', schoolId)
    .eq('status', 'paid')
    .order('expense_date', { ascending: false })
  if (filters?.date_from) expQ = expQ.gte('expense_date', filters.date_from)
  if (filters?.date_to) expQ = expQ.lte('expense_date', filters.date_to)
  const expRes = await expQ
  type RawExp = { expense_date: string; receipt_no: string | null; description: string; category: string; vendor: string | null; payment_method: string | null; amount: unknown }
  const expenses = ((expRes.data ?? []) as RawExp[]).map((r) => ({
    expense_date: r.expense_date,
    receipt_no: r.receipt_no,
    description: r.description,
    category: r.category,
    vendor: r.vendor,
    payment_method: r.payment_method,
    amount: n(r.amount),
  }))

  return { revenues, expenses }
}

export async function getBursarExpenseByStatus(
  schoolId: string,
  filters?: FinanceReportFilters,
): Promise<{ paid: number; approved: number; pending: number; total: number }> {
  let q = supabase
    .from('expenses')
    .select('status, amount')
    .eq('school_id', schoolId)
    .neq('status', 'rejected')
  if (filters?.date_from) q = q.gte('expense_date', filters.date_from)
  if (filters?.date_to) q = q.lte('expense_date', filters.date_to)
  const { data, error } = await q
  if (error || !data) return { paid: 0, approved: 0, pending: 0, total: 0 }
  let paid = 0
  let approved = 0
  let pending = 0
  for (const row of data as { status: string; amount: unknown }[]) {
    const amt = n(row.amount)
    if (row.status === 'paid') paid += amt
    else if (row.status === 'approved') approved += amt
    else if (row.status === 'pending') pending += amt
  }
  const total = paid + approved + pending
  return {
    paid: Math.round(paid * 100) / 100,
    approved: Math.round(approved * 100) / 100,
    pending: Math.round(pending * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}

export async function getBursarExpensesByCategory(
  schoolId: string,
  filters?: FinanceReportFilters,
): Promise<{ category: string; total: number; percentage: number }[]> {
  let q = supabase
    .from('expenses')
    .select('category, amount')
    .eq('school_id', schoolId)
    .eq('status', 'paid')
  if (filters?.date_from) q = q.gte('expense_date', filters.date_from)
  if (filters?.date_to) q = q.lte('expense_date', filters.date_to)
  const { data, error } = await q
  if (error || !data) return []
  const map = new Map<string, number>()
  for (const row of data as { category: string; amount: unknown }[]) {
    const c = row.category
    map.set(c, (map.get(c) ?? 0) + n(row.amount))
  }
  const grand = [...map.values()].reduce((a, b) => a + b, 0)
  return [...map.entries()]
    .map(([category, total]) => ({
      category,
      total: Math.round(total * 100) / 100,
      percentage: grand > 0 ? Math.round((total / grand) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.total - a.total)
}

export async function getBursarMonthlyCollection(
  schoolId: string,
  filters?: FinanceReportFilters,
): Promise<{ month: string; invoiced: number; collected: number; monthKey: string }[]> {
  let invQ = supabase
    .from('invoices')
    .select('created_at, amount')
    .eq('school_id', schoolId)
    .is('deleted_at', null)
  invQ = applyInvoiceReportFilters(invQ as never, filters) as never

  let payQ = supabase
    .from('payments')
    .select('payment_date, amount, invoice:invoices(academic_year_id, term_id)')
    .eq('school_id', schoolId)
  if (filters?.date_from) payQ = payQ.gte('payment_date', filters.date_from)
  if (filters?.date_to) payQ = payQ.lte('payment_date', filters.date_to)
  const payRes = await payQ

  type PayRow = { payment_date: string; amount: unknown; invoice: { academic_year_id: string; term_id: string | null } | { academic_year_id: string; term_id: string | null }[] | null }
  let payRows = (payRes.data ?? []) as PayRow[]
  payRows = payRows.filter((p) => {
    const inv = Array.isArray(p.invoice) ? p.invoice[0] : p.invoice
    if (filters?.academic_year_id && inv && inv.academic_year_id !== filters.academic_year_id) return false
    if (filters?.term_id && inv && inv.term_id !== filters.term_id) return false
    return true
  })

  const { data: invData, error: invErr } = await invQ
  if (invErr) return []

  const invoicedByMonth: Record<string, number> = {}
  for (const row of (invData ?? []) as { created_at: string; amount: unknown }[]) {
    const k = row.created_at.slice(0, 7)
    invoicedByMonth[k] = (invoicedByMonth[k] ?? 0) + n(row.amount)
  }
  const collectedByMonth: Record<string, number> = {}
  for (const p of payRows) {
    const k = p.payment_date.slice(0, 7)
    collectedByMonth[k] = (collectedByMonth[k] ?? 0) + n(p.amount)
  }
  const keys = new Set([...Object.keys(invoicedByMonth), ...Object.keys(collectedByMonth)])
  const sorted = [...keys].sort()
  return sorted.map((monthKey) => ({
    monthKey,
    month: format(parseISO(`${monthKey}-01`), 'MMM yy'),
    invoiced: Math.round((invoicedByMonth[monthKey] ?? 0) * 100) / 100,
    collected: Math.round((collectedByMonth[monthKey] ?? 0) * 100) / 100,
  }))
}

const ALL_BUDGET_CATEGORIES = [
  'salaries', 'utilities', 'maintenance', 'supplies', 'equipment', 'transport', 'events', 'other',
] as const

export async function getBursarBudgetVsActual(
  schoolId: string,
  filters?: FinanceReportFilters,
): Promise<{ lines: BudgetVsActualLine[]; hasAnyBudget: boolean }> {
  const budgetFilters: { academic_year_id?: string; term_id?: string } = {}
  if (filters?.academic_year_id) budgetFilters.academic_year_id = filters.academic_year_id
  if (filters?.term_id) budgetFilters.term_id = filters.term_id

  const budgets = await getBudgets(schoolId, budgetFilters)
  const hasAnyBudget = budgets.length > 0

  let expQ = supabase
    .from('expenses')
    .select('category, amount')
    .eq('school_id', schoolId)
    .eq('status', 'paid')
  if (filters?.date_from) expQ = expQ.gte('expense_date', filters.date_from)
  if (filters?.date_to) expQ = expQ.lte('expense_date', filters.date_to)
  const { data: expData } = await expQ
  const spentByCat = new Map<string, number>()
  for (const row of (expData ?? []) as { category: string; amount: unknown }[]) {
    spentByCat.set(row.category, (spentByCat.get(row.category) ?? 0) + n(row.amount))
  }

  const budgetByCat = new Map<string, number>()
  for (const b of budgets) {
    budgetByCat.set(b.category, (budgetByCat.get(b.category) ?? 0) + b.allocated_amount)
  }

  const categories = new Set<string>([...ALL_BUDGET_CATEGORIES])
  spentByCat.forEach((_, c) => categories.add(c))
  budgetByCat.forEach((_, c) => categories.add(c))

  const lines: BudgetVsActualLine[] = [...categories].sort().map((category) => {
    const budgeted = budgetByCat.get(category) ?? 0
    const spent = spentByCat.get(category) ?? 0
    const hasBudget = budgeted > 0
    const remaining = budgeted - spent
    const percentUsed = budgeted > 0 ? (spent / budgeted) * 100 : 0
    return {
      category,
      budgeted: Math.round(budgeted * 100) / 100,
      spent: Math.round(spent * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
      percentUsed: Math.round(percentUsed * 100) / 100,
      hasBudget,
    }
  }).filter((l) => l.hasBudget || l.spent > 0)

  return { lines, hasAnyBudget }
}
