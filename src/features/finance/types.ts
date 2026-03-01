export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'overdue' | 'void'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'mobile_money' | 'cheque' | 'other'
export type ExpenseCategory = 'salaries' | 'utilities' | 'maintenance' | 'supplies' | 'transport' | 'other'

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
