import type { Invoice, Expense, Budget, BudgetCategory } from './types'

const sum = (values: number[]) => values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0)

export const getTotalInvoicedAmount = (invoices: Invoice[]): number =>
  sum(invoices.map((invoice) => invoice.amount))

export const getTotalPaymentsReceived = (invoices: Invoice[]): number =>
  sum(invoices.map((invoice) => invoice.amount_paid))

export const getOutstandingBalance = (invoices: Invoice[]): number =>
  sum(invoices.map((invoice) => invoice.balance))

export const getTotalExpenses = (expenses: Expense[]): number =>
  sum(expenses.map((expense) => expense.amount))

export const getNetCashPosition = (invoices: Invoice[], expenses: Expense[]): number =>
  getTotalPaymentsReceived(invoices) - getTotalExpenses(expenses)

export const getExpectedPosition = (invoices: Invoice[], expenses: Expense[]): number =>
  getTotalInvoicedAmount(invoices) - getTotalExpenses(expenses)

export const getCollectionRate = (invoices: Invoice[]): number => {
  const totalInvoiced = getTotalInvoicedAmount(invoices)
  if (totalInvoiced <= 0) return 0
  return getTotalPaymentsReceived(invoices) / totalInvoiced
}

export const getOutstandingPercentage = (invoices: Invoice[]): number => {
  const totalInvoiced = getTotalInvoicedAmount(invoices)
  if (totalInvoiced <= 0) return 0
  return getOutstandingBalance(invoices) / totalInvoiced
}

export const getExpenseRatio = (invoices: Invoice[], expenses: Expense[]): number => {
  const totalPaid = getTotalPaymentsReceived(invoices)
  if (totalPaid <= 0) return 0
  return getTotalExpenses(expenses) / totalPaid
}

export const getOverdueInvoicesCount = (invoices: Invoice[], today = new Date()): number => {
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return invoices.filter((invoice) => {
    if (!invoice.due_date || invoice.balance <= 0) return false
    if (invoice.status === 'void') return false
    const due = new Date(invoice.due_date)
    const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate())
    return dueDateOnly < todayDateOnly
  }).length
}

export const groupExpensesByCategory = (
  expenses: Expense[],
): { category: Expense['category']; total: number }[] => {
  const map = new Map<Expense['category'], number>()
  for (const expense of expenses) {
    const current = map.get(expense.category) ?? 0
    map.set(expense.category, current + expense.amount)
  }
  return Array.from(map.entries()).map(([category, total]) => ({ category, total }))
}

export const getBudgetForCategory = (
  budgets: Budget[],
  category: BudgetCategory,
  academicYearId?: string,
  termId?: string | null,
): Budget | null => {
  const matches = budgets.filter((b) => {
    if (b.category !== category) return false
    if (academicYearId && b.academic_year_id !== academicYearId) return false
    if (typeof termId !== 'undefined') {
      if (termId === null) return b.term_id === null
      return b.term_id === termId
    }
    return true
  })
  return matches[0] ?? null
}

export const getBudgetVsActual = (
  budgets: Budget[],
  expenses: Expense[],
  academicYearId?: string,
  termId?: string | null,
): {
  category: BudgetCategory
  budget: number
  actual: number
  remaining: number
  ratio: number
}[] => {
  const byCategory = new Map<BudgetCategory, { budget: number; actual: number }>()

  budgets.forEach((b) => {
    if (academicYearId && b.academic_year_id !== academicYearId) return
    if (typeof termId !== 'undefined') {
      if (termId === null ? b.term_id !== null : b.term_id !== termId) return
    }
    const current = byCategory.get(b.category) ?? { budget: 0, actual: 0 }
    current.budget += b.allocated_amount
    byCategory.set(b.category, current)
  })

  expenses.forEach((e) => {
    const cat = e.category as BudgetCategory
    const current = byCategory.get(cat) ?? { budget: 0, actual: 0 }
    current.actual += e.amount
    byCategory.set(cat, current)
  })

  const rows: {
    category: BudgetCategory
    budget: number
    actual: number
    remaining: number
    ratio: number
  }[] = []

  byCategory.forEach((value, category) => {
    const budget = value.budget
    const actual = value.actual
    const remaining = budget - actual
    const ratio = budget > 0 ? actual / budget : 0
    rows.push({ category, budget, actual, remaining, ratio })
  })

  return rows
}

export type BudgetStatus = 'on_track' | 'near_limit' | 'over_budget'

export const getBudgetStatus = (budget: number, actual: number): BudgetStatus => {
  if (budget <= 0) return 'on_track'
  const ratio = actual / budget
  if (ratio < 0.8) return 'on_track'
  if (ratio <= 1) return 'near_limit'
  return 'over_budget'
}

export const getAverageMonthlyExpenses = (
  expenses: Expense[],
  monthsWindow = 3,
): number => {
  const byMonth = new Map<string, number>()
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - monthsWindow)
  const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}`

  for (const e of expenses) {
    if (!e.expense_date) continue
    const key = e.expense_date.slice(0, 7)
    if (key < cutoffKey) continue
    byMonth.set(key, (byMonth.get(key) ?? 0) + e.amount)
  }

  const totals = Array.from(byMonth.values())
  if (totals.length === 0) return 0
  return totals.reduce((a, b) => a + b, 0) / totals.length
}

export const getExpectedExpenses = (
  expenses: Expense[],
  remainingMonths: number,
  monthsWindow = 3,
): number => {
  const avg = getAverageMonthlyExpenses(expenses, monthsWindow)
  return avg * Math.max(0, remainingMonths)
}

export const getProjectedEndOfTermBalance = (params: {
  currentNetCashPosition: number
  expectedRevenueRemaining: number
  expectedExpenses: number
}): number => {
  const { currentNetCashPosition, expectedRevenueRemaining, expectedExpenses } = params
  return currentNetCashPosition + expectedRevenueRemaining - expectedExpenses
}

export type FinancialHealth = 'healthy' | 'warning' | 'critical'

export const getFinancialHealth = (params: {
  collectionRate: number
  outstandingPercentage: number
  expenseRatio: number
}): FinancialHealth => {
  const { collectionRate, outstandingPercentage, expenseRatio } = params
  const collectionPct = collectionRate * 100
  const outstandingPct = outstandingPercentage * 100

  if (collectionPct >= 85 && outstandingPct <= 15 && expenseRatio <= 0.8) return 'healthy'
  if (collectionPct < 70 || outstandingPct > 30 || expenseRatio > 1) return 'critical'
  return 'warning'
}

export const getRemainingMonthsInTerm = (termEndDate: string | null | undefined): number => {
  if (!termEndDate) return 3
  const end = new Date(termEndDate)
  const now = new Date()
  if (end <= now) return 0
  const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth())
  return Math.max(0, Math.ceil(months))
}
