import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm, type Resolver, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Search, CreditCard, XCircle, AlertCircle, Printer, Users } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { useSchool } from '@/context/SchoolContext'
import { formatCurrency, formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import {
  useInvoices, useInvoice, usePaymentsForInvoice,
  useCreateInvoice, useCreateDraftInvoicesForClass, useFinalizeInvoice, useFinalizeDraftsForClassBillingPeriod, useVoidInvoice, useRecordPayment,
  useStudentsForInvoice,
} from '../hooks/useFinance'
import { toast } from 'sonner'
import { useClasses } from '@/features/academics/hooks/useAcademics'
import {
  FinanceInvoiceListToolbar,
  financeToolbarControlClassName,
  BillingPeriodYearTermControls,
  BillingPeriodYearTermRequiredControls,
  type FinanceInvoiceListSelection,
} from './FinanceTermSelector'
import { billingPeriodKeyFromYearTermStrings, buildBillingPeriodKey } from '../billingPeriod'
import type { Invoice } from '../types'

const STATUS_STYLES: Record<string, string> = {
  draft:   'bg-violet-500/10 text-violet-800 border-violet-500/20',
  unpaid:  'bg-slate-500/10 text-slate-600 border-slate-500/20',
  partial: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  paid:    'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  overdue: 'bg-red-500/10 text-red-700 border-red-500/20',
  waived:  'bg-blue-500/10 text-blue-700 border-blue-500/20',
  void:    'bg-muted text-muted-foreground border-border',
}

// ─── Create Invoice Modal ─────────────────────────────────────────────────────
const invoiceSchema = z
  .object({
    student_id:    z.string().min(1, 'Required'),
    billing_year:  z.string().optional(),
    billing_term:  z.string().optional(),
    amount:        z.coerce.number().min(0.01, 'Must be > 0'),
    due_date:      z.string().optional(),
    description:   z.string().optional(),
  })
  .superRefine((d, ctx) => {
    const hy = !!(d.billing_year?.trim())
    const ht = !!(d.billing_term?.trim())
    if (hy !== ht) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select both calendar year and term for billing period, or leave both as “All”.',
        path: ['billing_year'],
      })
    }
  })
type InvoiceForm = z.infer<typeof invoiceSchema>

function CreateInvoiceModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: students = [] } = useStudentsForInvoice()
  const create = useCreateInvoice()
  const [serverError, setServerError] = useState<string | null>(null)
  const form = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema) as Resolver<InvoiceForm>,
    defaultValues: {
      student_id: '',
      billing_year: '',
      billing_term: '',
      amount: 0,
    },
  })
  useEffect(() => {
    if (open) setServerError(null)
  }, [open])
  const onSubmit = async (v: InvoiceForm) => {
    setServerError(null)
    try {
      const bpk =
        v.billing_year?.trim() && v.billing_term?.trim()
          ? buildBillingPeriodKey(Number(v.billing_year), Number(v.billing_term))
          : null
      const ok = await create.mutateAsync({
        student_id: v.student_id,
        amount: v.amount,
        billing_period_key: bpk,
        description: v.description || undefined,
        due_date: v.due_date || undefined,
      })
      if (ok) {
        toast.success('Invoice successfully created')
        form.reset()
        onOpenChange(false)
      } else {
        setServerError('Failed to create invoice. Please try again.')
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to create invoice. Please try again.')
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {serverError}
              </div>
            )}
            <FormField control={form.control} name="student_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Student *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger></FormControl>
                  <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.admission_number})</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="billing_year" render={({ field }) => (
              <FormItem>
                <FormLabel>Billing period</FormLabel>
                <FormControl>
                  <BillingPeriodYearTermControls
                    billing_year={field.value ?? ''}
                    billing_term={form.watch('billing_term') ?? ''}
                    onBillingYearChange={field.onChange}
                    onBillingTermChange={(t) => form.setValue('billing_term', t)}
                    includeAllOption
                    optionalClearPair
                  />
                </FormControl>
                <FormDescription>Optional. Pick a calendar year and term (stored as e.g. 2026 Term 2) or leave both as “All”.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="amount" render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (USD) *</FormLabel>
                <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="due_date" render={({ field }) => (
              <FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="e.g. Term 2 Fees 2026" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Creating...' : 'Create Invoice'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

const batchDraftSchema = z.object({
  class_id:          z.string().min(1, 'Class required'),
  billing_year:      z.string().min(1, 'Year required'),
  billing_term:      z.enum(['1', '2', '3']),
  amount:            z.coerce.number().min(0.01, 'Must be > 0'),
  due_date:          z.string().optional(),
  description:       z.string().optional(),
  issue_immediately: z.boolean(),
})
type BatchDraftForm = z.infer<typeof batchDraftSchema>

function BatchDraftInvoicesModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: classes = [] } = useClasses()
  const batchCreate = useCreateDraftInvoicesForClass()
  const [serverError, setServerError] = useState<string | null>(null)
  const form = useForm<BatchDraftForm>({
    resolver: zodResolver(batchDraftSchema) as Resolver<BatchDraftForm>,
    defaultValues: {
      class_id: '',
      billing_year: String(new Date().getFullYear()),
      billing_term: '1' as const,
      amount: 0,
      issue_immediately: true,
    },
  })
  useEffect(() => {
    if (open) setServerError(null)
  }, [open])
  const onSubmit = async (v: BatchDraftForm) => {
    setServerError(null)
    try {
      const result = await batchCreate.mutateAsync({
        class_id: v.class_id,
        billing_period_key: buildBillingPeriodKey(Number(v.billing_year), Number(v.billing_term)),
        amount: v.amount,
        due_date: v.due_date || null,
        description: v.description || null,
        issue_immediately: v.issue_immediately,
      })
      if (result == null) {
        setServerError('Could not create invoices. Check the class has active students, then try again.')
        return
      }
      if (result.created === 0) {
        toast.info(
          `No new rows: all ${result.skipped} students already have an invoice for this billing period (voided invoices are ignored).`,
        )
        onOpenChange(false)
        return
      }
      if (v.issue_immediately) {
        toast.success(
          `Created ${result.created} issued invoice${result.created === 1 ? '' : 's'}${result.skipped ? ` (${result.skipped} skipped, already invoiced)` : ''}. Parents can see them when your rules allow; you can record payments.`,
        )
      } else {
        toast.success(
          `Created ${result.created} draft${result.created === 1 ? '' : 's'}${result.skipped ? ` (${result.skipped} skipped)` : ''}. Issue from each row or use Issue class drafts.`,
        )
      }
      form.reset()
      onOpenChange(false)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to create draft invoices.')
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Batch invoices (one class)</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          One invoice per learner in the class, same amount. Calendar year and term set the billing period label (e.g. 2026 Term 2) for de-duplication. Skips students who already have a non-void invoice for that period. Use Create Invoice for different amounts per learner.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {serverError}
              </div>
            )}
            <FormField control={form.control} name="class_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Class *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                  <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="billing_year" render={({ field }) => (
              <FormItem>
                <FormLabel>Billing period *</FormLabel>
                <FormControl>
                  <BillingPeriodYearTermControls
                    billing_year={field.value ?? ''}
                    billing_term={form.watch('billing_term') ?? ''}
                    onBillingYearChange={field.onChange}
                    onBillingTermChange={(t) =>
                      form.setValue('billing_term', t as BatchDraftForm['billing_term'])
                    }
                    includeAllOption={false}
                  />
                </FormControl>
                <FormDescription>Required so the system can skip learners already invoiced for the same year and term.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="billing_term" render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl><input type="hidden" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="amount" render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (USD) *</FormLabel>
                <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="due_date" render={({ field }) => (
              <FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="e.g. Term 2 Fees 2026" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="issue_immediately" render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-3 rounded-md border border-border p-3">
                <FormControl>
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 rounded border border-input accent-primary"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-snug">
                  <FormLabel className="cursor-pointer font-medium mt-0">Issue immediately</FormLabel>
                  <FormDescription>
                    Live invoices (unpaid) can be paid and are visible to parents when your access rules allow. Turn off to save drafts for internal checks first—then issue from the invoice or use Issue class drafts.
                  </FormDescription>
                </div>
              </FormItem>
            )} />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={batchCreate.isPending}>
                {batchCreate.isPending ? 'Creating…' : (form.watch('issue_immediately') ? 'Create invoices' : 'Create drafts')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

const bulkIssueSchema = z.object({
  class_id:      z.string().min(1, 'Class required'),
  billing_year:  z.string().min(1, 'Year required'),
  billing_term:  z.enum(['1', '2', '3']),
})
type BulkIssueForm = z.infer<typeof bulkIssueSchema>

function BulkIssueDraftsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: classes = [] } = useClasses()
  const finalizeBulk = useFinalizeDraftsForClassBillingPeriod()
  const [serverError, setServerError] = useState<string | null>(null)
  const form = useForm<BulkIssueForm, unknown, BulkIssueForm>({
    resolver: zodResolver(bulkIssueSchema) as Resolver<BulkIssueForm>,
    defaultValues: {
      class_id: '',
      billing_year: '',
      billing_term: undefined,
    },
  })
  useEffect(() => { if (open) setServerError(null) }, [open])
  const onSubmit: SubmitHandler<BulkIssueForm> = async (v) => {
    setServerError(null)
    try {
      const n = await finalizeBulk.mutateAsync({
        class_id: v.class_id,
        billing_period_key: buildBillingPeriodKey(Number(v.billing_year), Number(v.billing_term)),
      })
      if (n == null) {
        setServerError('Could not issue invoices. Check the class has students with drafts for this billing period.')
        return
      }
      if (n === 0) {
        toast.info('No draft invoices matched (same class, billing period, and status draft).')
        onOpenChange(false)
        return
      }
      toast.success(`Issued ${n} invoice${n === 1 ? '' : 's'} — they are now unpaid and payable.`)
      form.reset()
      onOpenChange(false)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to issue drafts.')
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Issue class drafts</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Turns all <span className="font-medium">draft</span> invoices for the chosen class and billing period into <span className="font-medium">unpaid</span> (same match as batch create). Does not change amounts or void rows.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {serverError}
              </div>
            )}
            <FormField control={form.control} name="class_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Class *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                  <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="billing_year" render={({ field }) => (
              <FormItem>
                <FormLabel>Billing period *</FormLabel>
                <FormControl>
                  <BillingPeriodYearTermRequiredControls
                    billing_year={field.value ?? ''}
                    billing_term={form.watch('billing_term') ?? ''}
                    onBillingYearChange={field.onChange}
                    onBillingTermChange={(t) =>
                      form.setValue('billing_term', t as BulkIssueForm['billing_term'])
                    }
                  />
                </FormControl>
                <FormDescription>Same calendar year and term as when the drafts were created.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="billing_term" render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl><input type="hidden" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={finalizeBulk.isPending}>{finalizeBulk.isPending ? 'Issuing…' : 'Issue all matching drafts'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
const paymentSchema = z.object({
  amount:           z.coerce.number().min(0.01, 'Must be > 0'),
  payment_date:     z.string().min(1, 'Required'),
  payment_method:   z.enum(['cash', 'bank_transfer', 'mobile_money', 'cheque', 'card', 'other']),
  reference_number: z.string().optional(),
  notes:            z.string().optional(),
})
type PaymentForm = z.infer<typeof paymentSchema>

function RecordPaymentModal({ invoiceId, studentId, maxAmount, open, onOpenChange }: { invoiceId: string; studentId: string; maxAmount: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const record = useRecordPayment()
  const [serverError, setServerError] = useState<string | null>(null)
  const form = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema) as Resolver<PaymentForm>,
    defaultValues: { amount: maxAmount, payment_date: new Date().toISOString().slice(0, 10), payment_method: 'cash' },
  })
  useEffect(() => { if (open) setServerError(null) }, [open])
  const onSubmit = async (v: PaymentForm) => {
    setServerError(null)
    try {
      const ok = await record.mutateAsync({ invoice_id: invoiceId, student_id: studentId, ...v })
      if (ok) {
        toast.success('Payment recorded successfully')
        form.reset()
        onOpenChange(false)
      } else {
        const message = 'Failed to record payment. Please try again.'
        setServerError(message)
        toast.error(message)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to record payment. Please try again.'
      setServerError(message)
      toast.error(message)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {serverError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Amount *</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="payment_date" render={({ field }) => (
                <FormItem><FormLabel>Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="payment_method" render={({ field }) => (
              <FormItem>
                <FormLabel>Method *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="reference_number" render={({ field }) => (
              <FormItem><FormLabel>Reference No.</FormLabel><FormControl><Input placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={record.isPending}>{record.isPending ? 'Saving...' : 'Save Payment'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Invoice Detail Modal ─────────────────────────────────────────────────────
function InvoiceDetailModal({ invoiceId, open, onOpenChange }: { invoiceId: string | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: invoice } = useInvoice(invoiceId)
  const { data: payments = [] } = usePaymentsForInvoice(invoiceId)
  const voidInv = useVoidInvoice()
  const finalizeInv = useFinalizeInvoice()
  const [showPayment, setShowPayment] = useState(false)
  const { currentSchool } = useSchool()

  if (!invoice) return null

  const handlePrintPdf = () => {
    const schoolName = currentSchool?.name ?? 'Educore ISMS'
    const win = window.open('', '_blank', 'width=900,height=1200')
    if (!win) return

    const paymentsRows = payments.map(p => `
      <tr>
        <td>${formatCurrency(p.amount)}</td>
        <td>${formatDate(p.payment_date)}</td>
        <td>${p.payment_method.replace('_', ' ')}</td>
        <td>${p.reference_number ?? ''}</td>
      </tr>
    `).join('')

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charSet="utf-8" />
  <title>${invoice.invoice_number} - ${schoolName}</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; color: #0f172a; }
    h1 { font-size: 20px; margin: 0; }
    h2 { font-size: 14px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; margin-top: 32px; margin-bottom: 8px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .school { font-size: 18px; font-weight: 700; }
    .muted { color: #6b7280; font-size: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 32px; font-size: 13px; margin-bottom: 16px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #9ca3af; }
    .value { font-weight: 500; }
    .amounts { margin-top: 16px; font-size: 13px; }
    .amount-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .amount-row.balance { font-weight: 600; }
    .amount-row.balance.positive { color: #059669; }
    .amount-row.balance.negative { color: #b91c1c; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
    th { background-color: #f9fafb; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="school">${schoolName}</div>
      <div class="muted">${invoice.invoice_number}</div>
    </div>
    <div class="muted">${new Date().toLocaleDateString()}</div>
  </div>

  <h2>Invoice Details</h2>
  <div class="grid">
    <div>
      <div class="label">Student</div>
      <div class="value">${invoice.student_name}</div>
    </div>
    <div>
      <div class="label">Class</div>
      <div class="value">${invoice.class_name ?? '—'}</div>
    </div>
    <div>
      <div class="label">Issued</div>
      <div class="value">${formatDate(invoice.created_at)}</div>
    </div>
    <div>
      <div class="label">Due Date</div>
      <div class="value">${formatDate(invoice.due_date)}</div>
    </div>
    ${invoice.billing_period_key ? `
    <div style="grid-column: span 2;">
      <div class="label">Billing period</div>
      <div class="value">${invoice.billing_period_key}</div>
    </div>` : ''}
    ${invoice.description ? `
    <div style="grid-column: span 2;">
      <div class="label">Description</div>
      <div class="value">${invoice.description}</div>
    </div>` : ''}
  </div>

  <div class="amounts">
    <div class="amount-row">
      <span>Invoice Amount</span>
      <span>${formatCurrency(invoice.amount)}</span>
    </div>
    <div class="amount-row">
      <span>Amount Paid</span>
      <span>${formatCurrency(invoice.amount_paid)}</span>
    </div>
    <div class="amount-row balance ${invoice.balance > 0 ? 'negative' : 'positive'}">
      <span>Balance</span>
      <span>${formatCurrency(invoice.balance)}</span>
    </div>
  </div>

  ${payments.length ? `
    <h2>Payment History</h2>
    <table>
      <thead>
        <tr>
          <th>Amount</th>
          <th>Date</th>
          <th>Method</th>
          <th>Reference</th>
        </tr>
      </thead>
      <tbody>
        ${paymentsRows}
      </tbody>
    </table>
  ` : ''}
</body>
</html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {invoice.invoice_number}
              <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', STATUS_STYLES[invoice.status])}>
                {invoice.status}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-muted-foreground">Student</p><p className="font-medium">{invoice.student_name}</p></div>
              <div><p className="text-muted-foreground">Class</p><p className="font-medium">{invoice.class_name || '—'}</p></div>
              <div><p className="text-muted-foreground">Issued</p><p>{formatDate(invoice.created_at)}</p></div>
              <div><p className="text-muted-foreground">Due Date</p><p>{formatDate(invoice.due_date)}</p></div>
              <div><p className="text-muted-foreground">Last Payment</p><p>{payments.length ? formatDate(payments[0].payment_date) : '—'}</p></div>
              <div><p className="text-muted-foreground">Payments</p><p>{payments.length} payment{payments.length !== 1 ? 's' : ''}</p></div>
              {invoice.billing_period_key && <div className="col-span-2"><p className="text-muted-foreground">Billing period</p><p>{invoice.billing_period_key}</p></div>}
              {invoice.description && <div className="col-span-2"><p className="text-muted-foreground">Description</p><p>{invoice.description}</p></div>}
            </div>

            <Separator />

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Invoice Amount</span><span className="font-medium">{formatCurrency(invoice.amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount Paid</span><span className="font-medium text-emerald-600">{formatCurrency(invoice.amount_paid)}</span></div>
              <div className="flex justify-between font-semibold"><span>Balance</span><span className={invoice.balance > 0 ? 'text-red-600' : 'text-emerald-600'}>{formatCurrency(invoice.balance)}</span></div>
            </div>

            {payments.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment History</p>
                  <div className="space-y-2">
                    {payments.map(p => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium">{formatCurrency(p.amount)}</p>
                          <p className="text-xs text-muted-foreground capitalize">{p.payment_method.replace('_', ' ')} · {formatDate(p.payment_date)}</p>
                        </div>
                        {p.reference_number && <p className="text-xs text-muted-foreground">{p.reference_number}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handlePrintPdf}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print / PDF
            </Button>
            {invoice.status === 'draft' && (
              <Button
                variant="default"
                size="sm"
                disabled={finalizeInv.isPending}
                onClick={async () => {
                  const ok = await finalizeInv.mutateAsync(invoice.id)
                  if (ok) toast.success('Invoice issued — it is now payable and visible to parents when rules allow.')
                  else toast.error('Could not issue invoice.')
                }}
              >
                Issue invoice
              </Button>
            )}
            {invoice.status !== 'paid' && invoice.status !== 'void' && invoice.status !== 'draft' && (
              <Button variant="outline" size="sm" onClick={() => setShowPayment(true)}>
                <CreditCard className="mr-2 h-4 w-4" />Record Payment
              </Button>
            )}
            {invoice.status !== 'void' && (
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                disabled={voidInv.isPending}
                onClick={async () => { await voidInv.mutateAsync(invoice.id); onOpenChange(false) }}>
                <XCircle className="mr-2 h-4 w-4" />Void
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showPayment && invoice.balance > 0 && (
        <RecordPaymentModal
          invoiceId={invoice.id}
          studentId={invoice.student_id}
          maxAmount={invoice.balance}
          open={showPayment}
          onOpenChange={setShowPayment}
        />
      )}
    </>
  )
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────
export function InvoicesTab() {
  const { role } = useAuth()
  const canCreate = role === 'headmaster' || role === 'bursar'

  const [searchParams] = useSearchParams()
  const filterParam = searchParams.get('filter')
  const [statusFilter, setStatusFilter] = useState(() => {
    if (filterParam === 'overdue') return 'overdue'
    if (filterParam === 'outstanding') return 'outstanding'
    return 'all'
  })

  useEffect(() => {
    if (filterParam === 'overdue') setStatusFilter('overdue')
    else if (filterParam === 'outstanding') setStatusFilter('outstanding')
  }, [filterParam])
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showBatchDraft, setShowBatchDraft] = useState(false)
  const [showBulkIssue, setShowBulkIssue] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [listFilters, setListFilters] = useState<FinanceInvoiceListSelection>({
    billing_year: '',
    billing_term: '',
    date_from: undefined,
    date_to: undefined,
  })

  const { data: invoices = [], isLoading } = useInvoices({
    status: statusFilter,
    search,
    billing_period_key: billingPeriodKeyFromYearTermStrings(listFilters.billing_year, listFilters.billing_term),
    created_from: listFilters.date_from,
    created_to: listFilters.date_to,
  })

  const columns: Column<Invoice>[] = [
    { key: 'invoice_number', header: 'Invoice #', sortable: true, className: 'font-mono text-xs' },
    { key: 'billing_period_key', header: 'Billing period', sortable: true, cell: r => r.billing_period_key || '—' },
    { key: 'student_name', header: 'Student', sortable: true, cell: r => <span className="font-medium">{r.student_name}</span> },
    { key: 'class_name', header: 'Class', cell: r => r.class_name || '—' },
    { key: 'amount', header: 'Amount', className: 'text-right tabular-nums', cell: r => formatCurrency(r.amount) },
    { key: 'amount_paid', header: 'Paid', className: 'text-right tabular-nums', cell: r => <span className="text-emerald-600">{formatCurrency(r.amount_paid)}</span> },
    { key: 'balance', header: 'Balance', className: 'text-right tabular-nums', cell: r => <span className={r.balance > 0 ? 'text-red-600 font-semibold' : 'text-emerald-600'}>{formatCurrency(r.balance)}</span> },
    { key: 'due_date', header: 'Due', cell: r => formatDate(r.due_date) },
    { key: 'status', header: 'Status', cell: r => (
      <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', STATUS_STYLES[r.status])}>{r.status}</span>
    )},
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <FinanceInvoiceListToolbar value={listFilters} onChange={setListFilters} />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Invoice number..."
              className={cn('pl-9 w-52 h-9 sm:h-10', financeToolbarControlClassName)}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={cn('w-36 h-9 sm:h-10', financeToolbarControlClassName)}>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="outstanding">Outstanding (unpaid + partial + overdue)</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="void">Void</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {canCreate && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => setShowBulkIssue(true)} className="h-9 border border-border shadow-sm sm:h-10">
              Issue class drafts
            </Button>
            <Button variant="secondary" onClick={() => setShowBatchDraft(true)} className="h-9 border border-border shadow-sm sm:h-10">
              <Users className="mr-2 h-4 w-4" />
              Batch for class
            </Button>
            <Button onClick={() => setShowCreate(true)} className="h-9 sm:h-10">
              <Plus className="mr-2 h-4 w-4" />Create Invoice
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <DataTable<Invoice>
          columns={columns}
          data={invoices}
          keyExtractor={r => r.id}
          loading={isLoading}
          onRowClick={r => setSelectedId(r.id)}
        />
      </div>

      <CreateInvoiceModal open={showCreate} onOpenChange={setShowCreate} />
      <BatchDraftInvoicesModal open={showBatchDraft} onOpenChange={setShowBatchDraft} />
      <BulkIssueDraftsModal open={showBulkIssue} onOpenChange={setShowBulkIssue} />
      <InvoiceDetailModal invoiceId={selectedId} open={!!selectedId} onOpenChange={v => { if (!v) setSelectedId(null) }} />
    </div>
  )
}
