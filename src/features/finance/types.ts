export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'overdue' | 'waived' | 'void'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'mobile_money' | 'cheque' | 'card' | 'other'
export type ExpenseCategory =
  | 'salaries'
  | 'utilities'
  | 'maintenance'
  | 'supplies'
  | 'equipment'
  | 'transport'
  | 'events'
  | 'other'

export type ExpenseStatus = 'pending' | 'approved' | 'paid' | 'rejected'

export type BudgetCategory = ExpenseCategory

export interface Invoice {
  id: string
  invoice_number: string
  student_id: string
  student_name: string
  class_name: string | null
  amount: number
  amount_paid: number
  balance: number
  status: InvoiceStatus
  due_date: string | null
  description: string | null
  created_at: string
}

export interface Payment {
  id: string
  invoice_id: string
  payment_no: string | null
  amount: number
  payment_date: string
  payment_method: PaymentMethod
  reference_number: string | null
  notes: string | null
  created_at: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  category: ExpenseCategory
  expense_date: string
  paid_to: string | null
  reference_number: string | null
  notes: string | null
  created_at: string
  status: ExpenseStatus
  payment_method: string | null
}

export interface Budget {
  id: string
  school_id: string
  category: BudgetCategory
  allocated_amount: number
  academic_year_id: string
  term_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceFormData {
  student_id: string
  amount: number
  academic_year_id: string
  term_id?: string
  due_date?: string
  description?: string
}

export interface PaymentFormData {
  invoice_id: string
  student_id: string
  amount: number
  payment_date: string
  payment_method: PaymentMethod
  reference_number?: string
  notes?: string
}

export interface ExpenseFormData {
  description: string
  amount: number
  category: ExpenseCategory
  expense_date: string
  paid_to?: string
  reference_number?: string
  notes?: string
}

export interface BudgetFormData {
  category: BudgetCategory
  allocated_amount: number
  academic_year_id: string
  term_id?: string
  notes?: string
}

export type FinanceReportFilters = {
  academic_year_id?: string
  term_id?: string
  date_from?: string
  date_to?: string
}

export interface ExpenseLineItem {
  expense_date: string
  description: string
  category: string
  amount: number
  vendor: string | null
  receipt_no: string | null
  payment_method: string | null
  status: string
  notes: string | null
}

export interface FeeCollectionLineItem {
  invoice_no: string
  student_name: string
  class_name: string | null
  invoice_date: string
  due_date: string | null
  description: string | null
  invoiced_amount: number
  paid_amount: number
  outstanding_amount: number
  status: string
  last_payment_date: string | null
  last_payment_method: string | null
  payments: Array<{
    payment_date: string
    payment_method: string
    amount: number
    payment_no: string | null
  }>
}

export interface RevenueLineItem {
  payment_no: string | null
  payment_date: string
  payment_method: string
  amount: number
  notes: string | null
  student_name: string
  invoice_description: string | null
}

export interface IncomeStatementLineItems {
  revenues: RevenueLineItem[]
  expenses: Array<{
    expense_date: string
    receipt_no: string | null
    description: string
    category: string
    vendor: string | null
    payment_method: string | null
    amount: number
  }>
}

export interface BudgetVsActualLine {
  category: string
  budgeted: number
  spent: number
  remaining: number
  percentUsed: number
  hasBudget: boolean
}
