import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getInvoices, getInvoiceById, createInvoice, voidInvoice,
  getPaymentsForInvoice, recordPayment,
  getExpenses, createExpense, updateExpense, deleteExpense,
  getStudentsForInvoice,
} from '../services/finance'
import type { PaymentFormData, ExpenseFormData, InvoiceFormData } from '../types'
import { useSchool } from '@/context/SchoolContext'

const KEY = {
  invoices: (schoolId: string, f?: object) => ['finance', 'invoices', schoolId, f] as const,
  invoice:  (id: string) => ['finance', 'invoice', id] as const,
  payments: (invoiceId: string) => ['finance', 'payments', invoiceId] as const,
  expenses: (schoolId: string, f?: object) => ['finance', 'expenses', schoolId, f] as const,
  students: (schoolId: string) => ['finance', 'students', schoolId] as const,
}

export function useInvoices(filters?: { status?: string; search?: string }) {
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

export function useExpenses(filters?: { category?: string; search?: string }) {
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
  return useMutation({
    mutationFn: (d: InvoiceFormData) => createInvoice(d),
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
  return useMutation({
    mutationFn: (d: PaymentFormData) => recordPayment(d),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'expenses'] }),
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
