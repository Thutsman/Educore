import { useEffect, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Pencil, Plus, Search, Trash2, XCircle } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/DataTable'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import { toast } from 'sonner'
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useApproveExpense,
  useRejectExpense,
  useMarkExpenseAsPaid,
} from '../hooks/useFinance'
import type { Expense, ExpenseFormData } from '../types'

const CATEGORIES = [
  { value: 'salaries',    label: 'Salaries' },
  { value: 'utilities',   label: 'Utilities' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'supplies',    label: 'Supplies' },
  { value: 'equipment',   label: 'Equipment' },
  { value: 'transport',   label: 'Transport' },
  { value: 'events',      label: 'Events' },
  { value: 'other',       label: 'Other' },
]

const schema = z.object({
  description:      z.string().min(1, 'Required'),
  amount:           z.coerce.number().min(0.01, 'Must be > 0'),
  category:         z.enum(['salaries', 'utilities', 'maintenance', 'supplies', 'equipment', 'transport', 'events', 'other']),
  expense_date:     z.string().min(1, 'Required'),
  paid_to:          z.string().optional(),
  reference_number: z.string().optional(),
  notes:            z.string().optional(),
})
type FormValues = z.infer<typeof schema>

const rejectionSchema = z.object({
  reason: z.string().trim().min(1, 'Rejection reason is required'),
})
type RejectionFormValues = z.infer<typeof rejectionSchema>

const STATUS_STYLES: Record<Expense['status'], string> = {
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-800',
  approved: 'border-blue-500/30 bg-blue-500/10 text-blue-700',
  paid: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
  rejected: 'border-red-500/30 bg-red-500/10 text-red-700',
}

function ExpenseStatusBadge({ status }: { status: Expense['status'] }) {
  return (
    <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', STATUS_STYLES[status])}>
      {status}
    </span>
  )
}

function ExpenseFormModal({ open, onOpenChange, expense }: { open: boolean; onOpenChange: (v: boolean) => void; expense?: Expense | null }) {
  const isEdit = !!expense
  const create = useCreateExpense()
  const update = useUpdateExpense()
  const [serverError, setServerError] = useState<string | null>(null)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      description: expense?.description ?? '',
      amount: expense?.amount ?? 0,
      category: expense?.category ?? 'other',
      expense_date: expense?.expense_date ?? new Date().toISOString().slice(0, 10),
      paid_to: expense?.paid_to ?? '',
      reference_number: expense?.reference_number ?? '',
      notes: expense?.notes ?? '',
    },
  })
  useEffect(() => {
    if (!open) return
    setServerError(null)
    form.reset({
      description: expense?.description ?? '',
      amount: expense?.amount ?? 0,
      category: expense?.category ?? 'other',
      expense_date: expense?.expense_date ?? new Date().toISOString().slice(0, 10),
      paid_to: expense?.paid_to ?? '',
      reference_number: expense?.reference_number ?? '',
      notes: expense?.notes ?? '',
    })
  }, [expense, form, open])

  const onSubmit = async (v: FormValues) => {
    setServerError(null)
    try {
      const ok = isEdit && expense
        ? await update.mutateAsync({ id: expense.id, data: v as ExpenseFormData })
        : await create.mutateAsync(v as ExpenseFormData)

      if (ok) {
        toast.success(isEdit ? 'Expense updated successfully' : 'Expense submitted for approval')
        form.reset()
        onOpenChange(false)
      } else {
        const message = isEdit
          ? 'Only pending expenses can be edited.'
          : 'Failed to create expense. Please try again.'
        setServerError(message)
        toast.error(message)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save expense. Please try again.'
      setServerError(message)
      toast.error(message)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Expense' : 'Add Expense'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {serverError ? (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </div>
            ) : null}
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description *</FormLabel><FormControl><Input placeholder="e.g. Electricity bill" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Amount *</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="expense_date" render={({ field }) => (
                <FormItem><FormLabel>Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="paid_to" render={({ field }) => (
                <FormItem><FormLabel>Paid To</FormLabel><FormControl><Input placeholder="Vendor name" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="reference_number" render={({ field }) => (
              <FormItem><FormLabel>Reference No.</FormLabel><FormControl><Input placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isPending || update.isPending}>
                {create.isPending || update.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Submit Expense'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function RejectExpenseDialog({
  expense,
  open,
  onOpenChange,
}: {
  expense: Expense | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const rejectExpense = useRejectExpense()
  const form = useForm<RejectionFormValues>({
    resolver: zodResolver(rejectionSchema) as Resolver<RejectionFormValues>,
    defaultValues: { reason: '' },
  })

  useEffect(() => {
    if (open) form.reset({ reason: '' })
  }, [form, open])

  const onSubmit = async (values: RejectionFormValues) => {
    if (!expense) return
    try {
      const ok = await rejectExpense.mutateAsync({ expenseId: expense.id, reason: values.reason })
      if (ok) {
        toast.success('Expense rejected')
        onOpenChange(false)
      } else {
        toast.error('Only pending expenses can be rejected.')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reject expense.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Reject Expense</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Provide a reason for rejecting <span className="font-medium text-foreground">{expense?.description ?? 'this expense'}</span>.
            </p>
            <FormField control={form.control} name="reason" render={({ field }) => (
              <FormItem>
                <FormLabel>Rejection reason *</FormLabel>
                <FormControl><Textarea rows={4} placeholder="Explain why this expense is being rejected" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" variant="destructive" disabled={rejectExpense.isPending}>
                {rejectExpense.isPending ? 'Rejecting...' : 'Reject Expense'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function MarkPaidDialog({
  expense,
  open,
  onOpenChange,
}: {
  expense: Expense | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const markAsPaid = useMarkExpenseAsPaid()

  const handleConfirm = async () => {
    if (!expense) return
    try {
      const ok = await markAsPaid.mutateAsync(expense.id)
      if (ok) {
        toast.success('Expense marked as paid')
        onOpenChange(false)
      } else {
        toast.error('Only approved expenses can be marked as paid.')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark expense as paid.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Mark Expense as Paid</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">
          Confirm payment for <span className="font-medium text-foreground">{expense?.description ?? 'this expense'}</span>.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={markAsPaid.isPending}>
            {markAsPaid.isPending ? 'Saving...' : 'Mark as Paid'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ExpensesTab() {
  const { hasRole } = useAuth()
  const canCreate = hasRole('bursar')
  const canApprove = hasRole('headmaster', 'deputy_headmaster')
  const canMarkPaid = hasRole('bursar')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState<Expense | null>(null)
  const [rejectTarget, setRejectTarget] = useState<Expense | null>(null)
  const [payTarget, setPayTarget] = useState<Expense | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: expenses = [], isLoading } = useExpenses({ category: categoryFilter, search })
  const deleteExpense = useDeleteExpense()
  const approveExpense = useApproveExpense()

  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0)

  const canEditExpense = (expense: Expense) => canCreate && expense.status === 'pending'
  const canDeleteExpense = (expense: Expense) => canCreate && expense.status === 'pending'
  const hasRowActions = (expense: Expense) =>
    (canApprove && expense.status === 'pending') ||
    (canMarkPaid && expense.status === 'approved') ||
    canEditExpense(expense) ||
    canDeleteExpense(expense)

  const columns: Column<Expense>[] = [
    {
      key: 'description',
      header: 'Description',
      sortable: true,
      cell: r => (
        <div>
          <span className="font-medium">{r.description}</span>
          {r.status === 'rejected' && r.rejection_reason ? (
            <p className="mt-1 text-xs text-red-700">{r.rejection_reason}</p>
          ) : null}
        </div>
      ),
    },
    { key: 'category', header: 'Category', cell: r => <span className="capitalize">{r.category.replace('_', ' ')}</span> },
    { key: 'amount', header: 'Amount', sortable: true, className: 'text-right tabular-nums', cell: r => formatCurrency(r.amount) },
    { key: 'expense_date', header: 'Date', sortable: true, cell: r => formatDate(r.expense_date) },
    { key: 'paid_to', header: 'Paid To', cell: r => r.paid_to || '—' },
    { key: 'status', header: 'Status', cell: r => <ExpenseStatusBadge status={r.status} /> },
    ...((canApprove || canCreate) ? [{
      key: 'actions' as keyof Expense,
      header: 'Actions',
      className: 'text-right',
      cell: (r: Expense) => (
        <div className="flex justify-end gap-2">
          {hasRowActions(r) ? (
            <>
              {canApprove && r.status === 'pending' ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9"
                    disabled={approveExpense.isPending}
                    onClick={async (e) => {
                      e.stopPropagation()
                      const ok = await approveExpense.mutateAsync(r.id)
                      if (ok) toast.success('Expense approved')
                      else toast.error('Only pending expenses can be approved.')
                    }}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" className="h-9" onClick={(e) => { e.stopPropagation(); setRejectTarget(r) }}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </>
              ) : null}
              {canMarkPaid && r.status === 'approved' ? (
                <Button size="sm" className="h-9" onClick={(e) => { e.stopPropagation(); setPayTarget(r) }}>
                  Mark as Paid
                </Button>
              ) : null}
              {canEditExpense(r) ? (
                <Button size="icon" variant="ghost" className="h-9 w-9" onClick={e => { e.stopPropagation(); setEditTarget(r); setShowForm(true) }}>
                  <Pencil className="h-4 w-4" />
                </Button>
              ) : null}
              {canDeleteExpense(r) ? (
                <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); setDeleteId(r.id) }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </>
          ) : (
            <span className="text-xs text-muted-foreground">No actions</span>
          )}
        </div>
      ),
    }] : []),
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-0 flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search expenses..." className="pl-9 w-full sm:w-52 h-9 sm:h-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-40 h-9 sm:h-10"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">Total: <span className="font-semibold text-foreground">{formatCurrency(totalAmount)}</span></p>
          {canCreate && (
            <Button onClick={() => { setEditTarget(null); setShowForm(true) }} className="h-9 sm:h-10">
              <Plus className="mr-2 h-4 w-4" />Add Expense
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <DataTable<Expense>
          columns={columns}
          data={expenses}
          keyExtractor={r => r.id}
          loading={isLoading}
          rowClassName={r => r.status === 'rejected' ? 'bg-red-500/5' : ''}
          emptyState={
            <EmptyState
              title="No expenses yet"
              description="No expenses yet. Create your first expense to start tracking school spending."
              action={canCreate ? (
                <Button onClick={() => { setEditTarget(null); setShowForm(true) }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
              ) : null}
              className="border-0 rounded-none"
            />
          }
        />
      </div>

      <ExpenseFormModal open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setEditTarget(null) }} expense={editTarget} />
      <RejectExpenseDialog open={!!rejectTarget} onOpenChange={v => !v && setRejectTarget(null)} expense={rejectTarget} />
      <MarkPaidDialog open={!!payTarget} onOpenChange={v => !v && setPayTarget(null)} expense={payTarget} />

      <Dialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Expense</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Only pending expenses can be deleted. This action permanently removes the record.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteExpense.isPending}
              onClick={async () => {
                if (!deleteId) return
                try {
                  const ok = await deleteExpense.mutateAsync(deleteId)
                  if (ok) {
                    toast.success('Expense deleted')
                    setDeleteId(null)
                  } else {
                    toast.error('Only pending expenses can be deleted.')
                  }
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Failed to delete expense.')
                }
              }}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
