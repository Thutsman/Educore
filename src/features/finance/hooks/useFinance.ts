import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  voidInvoice,
  getPaymentsForInvoice,
  recordPayment,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getStudentsForInvoice,
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from '../services/finance'
import type { PaymentFormData, ExpenseFormData, InvoiceFormData, BudgetFormData, Budget } from '../types'
import { useSchool } from '@/context/SchoolContext'
import {
  getTotalInvoicedAmount,
  getTotalPaymentsReceived,
  getOutstandingBalance,
  getTotalExpenses,
  getNetCashPosition,
  getExpectedPosition,
  getCollectionRate,
  getOutstandingPercentage,
  getExpenseRatio,
  getOverdueInvoicesCount,
  getFinancialHealth,
} from '../financeSelectors'

const KEY = {
  invoices: (schoolId: string, f?: object) => ['finance', 'invoices', schoolId, f] as const,
  invoice:  (id: string) => ['finance', 'invoice', id] as const,
  payments: (invoiceId: string) => ['finance', 'payments', invoiceId] as const,
  expenses: (schoolId: string, f?: object) => ['finance', 'expenses', schoolId, f] as const,
  students: (schoolId: string) => ['finance', 'students', schoolId] as const,
  budgets:  (schoolId: string, f?: object) => ['finance', 'budgets', schoolId, f] as const,
}

export function useInvoices(
  filters?: { status?: string; search?: string; academic_year_id?: string; term_id?: string },
) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.invoices(schoolId, filters),
    queryFn: () => getInvoices(schoolId, filters),
    enabled: !!schoolId,
  })
}

export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: KEY.invoice(id ?? ''),
    queryFn: () => getInvoiceById(id!),
    enabled: !!id,
  })
}

export function usePaymentsForInvoice(invoiceId: string | null) {
  return useQuery({
    queryKey: KEY.payments(invoiceId ?? ''),
    queryFn: () => getPaymentsForInvoice(invoiceId!),
    enabled: !!invoiceId,
  })
}

export function useExpenses(
  filters?: { category?: string; search?: string; date_from?: string; date_to?: string },
) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.expenses(schoolId, filters),
    queryFn: () => getExpenses(schoolId, filters),
    enabled: !!schoolId,
  })
}

export function useStudentsForInvoice() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.students(schoolId),
    queryFn: () => getStudentsForInvoice(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateInvoice() {
  const qc = useQueryClient()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useMutation({
    mutationFn: (d: InvoiceFormData) => createInvoice(schoolId, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'invoices'] }),
  })
}

export function useVoidInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: voidInvoice,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance'] }),
  })
}

export function useRecordPayment() {
  const qc = useQueryClient()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useMutation({
    mutationFn: (d: PaymentFormData) => recordPayment(schoolId, d),
    onSuccess: (_r, d) => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      qc.invalidateQueries({ queryKey: KEY.payments(d.invoice_id) })
      qc.invalidateQueries({ queryKey: KEY.invoice(d.invoice_id) })
    },
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useMutation({
    mutationFn: (d: ExpenseFormData) => createExpense(schoolId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'expenses'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExpenseFormData> }) => updateExpense(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'expenses'] }),
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'expenses'] }),
  })
}

export function useBudgets(filters?: { category?: string; academic_year_id?: string; term_id?: string }) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery<Budget[]>({
    queryKey: KEY.budgets(schoolId, filters),
    queryFn: () => getBudgets(schoolId, filters),
    enabled: !!schoolId,
  })
}

export function useCreateBudget() {
  const qc = useQueryClient()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useMutation({
    mutationFn: (d: BudgetFormData) => createBudget(schoolId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'budgets'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BudgetFormData> }) => updateBudget(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'budgets'] }),
  })
}

export function useDeleteBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'budgets'] }),
  })
}

export type FinanceSummaryFilters = {
  academic_year_id?: string
  term_id?: string
  date_from?: string
  date_to?: string
}

export function useFinanceSummary(filters?: FinanceSummaryFilters) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''

  const invoicesQuery = useInvoices({
    academic_year_id: filters?.academic_year_id,
    term_id: filters?.term_id,
  })
  const expensesQuery = useExpenses({
    date_from: filters?.date_from,
    date_to: filters?.date_to,
  })

  const invoices = invoicesQuery.data ?? []
  const expenses = expensesQuery.data ?? []

  const totalInvoiced = getTotalInvoicedAmount(invoices)
  const totalPaid = getTotalPaymentsReceived(invoices)
  const outstanding = getOutstandingBalance(invoices)
  const totalExpenses = getTotalExpenses(expenses)

  const netCashPosition = getNetCashPosition(invoices, expenses)
  const expectedPosition = getExpectedPosition(invoices, expenses)

  const collectionRate = getCollectionRate(invoices)
  const outstandingPercentage = getOutstandingPercentage(invoices)
  const expenseRatio = getExpenseRatio(invoices, expenses)
  const overdueCount = getOverdueInvoicesCount(invoices)

  return {
    schoolId,
    invoices,
    expenses,
    totalInvoiced,
    totalPaid,
    outstanding,
    totalExpenses,
    netCashPosition,
    expectedPosition,
    collectionRate,
    outstandingPercentage,
    expenseRatio,
    overdueCount,
    isLoading: invoicesQuery.isLoading || expensesQuery.isLoading,
    isError: invoicesQuery.isError || expensesQuery.isError,
  }
}

export function useFinancialHealth(filters?: FinanceSummaryFilters) {
  const summary = useFinanceSummary(filters)
  const health = getFinancialHealth({
    collectionRate: summary.collectionRate ?? 0,
    outstandingPercentage: summary.outstandingPercentage ?? 0,
    expenseRatio: summary.expenseRatio ?? 0,
  })
  return {
    ...summary,
    health,
  }
}
