import { useState, useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Search, CreditCard, XCircle, AlertCircle } from 'lucide-react'
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
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import {
  useInvoices, useInvoice, usePaymentsForInvoice,
  useCreateInvoice, useVoidInvoice, useRecordPayment,
  useStudentsForInvoice,
} from '../hooks/useFinance'
import { toast } from 'sonner'
import { useAcademicYears, useTerms } from '@/features/academics/hooks/useAcademics'
import type { Invoice } from '../types'

const STATUS_STYLES: Record<string, string> = {
  unpaid:  'bg-slate-500/10 text-slate-600 border-slate-500/20',
  partial: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  paid:    'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  overdue: 'bg-red-500/10 text-red-700 border-red-500/20',
  void:    'bg-muted text-muted-foreground border-border',
}

// ─── Create Invoice Modal ─────────────────────────────────────────────────────
const invoiceSchema = z.object({
  student_id:       z.string().min(1, 'Required'),
  academic_year_id: z.string().min(1, 'Academic year required'),
  term_id:          z.string().optional(),
  amount:           z.coerce.number().min(0.01, 'Must be > 0'),
  due_date:         z.string().optional(),
  description:      z.string().optional(),
})
type InvoiceForm = z.infer<typeof invoiceSchema>

function CreateInvoiceModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: students = [] } = useStudentsForInvoice()
  const { data: years = [] } = useAcademicYears()
  const currentYear = years.find(y => y.is_current) ?? years[0]
  const create = useCreateInvoice()
  const [serverError, setServerError] = useState<string | null>(null)
  const form = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema) as Resolver<InvoiceForm>,
    defaultValues: {
      student_id: '',
      academic_year_id: '',
      term_id: '',
      amount: 0,
    },
  })
  const selectedYearId = form.watch('academic_year_id') || currentYear?.id
  const { data: terms = [] } = useTerms(selectedYearId)
  const currentTerm = terms.find(t => t.is_current) ?? terms[0]
  useEffect(() => {
    if (open && currentYear) {
      setServerError(null)
      form.setValue('academic_year_id', currentYear.id)
      form.setValue('term_id', currentTerm?.id ?? '')
    }
  }, [open, currentYear?.id, currentTerm?.id, form])
  const onSubmit = async (v: InvoiceForm) => {
    setServerError(null)
    try {
      const ok = await create.mutateAsync({
        student_id: v.student_id,
        amount: v.amount,
        academic_year_id: v.academic_year_id,
        term_id: v.term_id || undefined,
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
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="academic_year_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Year *</FormLabel>
                  <Select onValueChange={(v) => { field.onChange(v); form.setValue('term_id', '') }} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger></FormControl>
                    <SelectContent>{years.map(y => <SelectItem key={y.id} value={y.id}>{y.name || y.id}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="term_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Term</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)}
                    value={field.value || '__none__'}
                  >
                    <FormControl><SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
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
              <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="e.g. Term 1 Fees 2025" {...field} /></FormControl><FormMessage /></FormItem>
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

// ─── Payment Modal ────────────────────────────────────────────────────────────
const paymentSchema = z.object({
  amount:           z.coerce.number().min(0.01, 'Must be > 0'),
  payment_date:     z.string().min(1, 'Required'),
  payment_method:   z.enum(['cash', 'bank_transfer', 'mobile_money', 'cheque', 'other']),
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
        form.reset()
        onOpenChange(false)
      } else {
        setServerError('Failed to record payment. Please try again.')
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to record payment. Please try again.')
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
  const [showPayment, setShowPayment] = useState(false)

  if (!invoice) return null

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
            {invoice.status !== 'paid' && invoice.status !== 'void' && (
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

  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: invoices = [], isLoading } = useInvoices({ status: statusFilter, search })

  const columns: Column<Invoice>[] = [
    { key: 'invoice_number', header: 'Invoice #', sortable: true, className: 'font-mono text-xs' },
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
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Invoice number..." className="pl-9 w-52" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="void">Void</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />Create Invoice
          </Button>
        )}
      </div>

      <DataTable<Invoice>
        columns={columns}
        data={invoices}
        keyExtractor={r => r.id}
        loading={isLoading}
        onRowClick={r => setSelectedId(r.id)}
      />

      <CreateInvoiceModal open={showCreate} onOpenChange={setShowCreate} />
      <InvoiceDetailModal invoiceId={selectedId} open={!!selectedId} onOpenChange={v => { if (!v) setSelectedId(null) }} />
    </div>
  )
}
