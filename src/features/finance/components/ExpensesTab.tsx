import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/DataTable'
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
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '../hooks/useFinance'
import type { Expense, ExpenseFormData } from '../types'

const CATEGORIES = [
  { value: 'salaries',    label: 'Salaries' },
  { value: 'utilities',   label: 'Utilities' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'supplies',    label: 'Supplies' },
  { value: 'transport',   label: 'Transport' },
  { value: 'other',       label: 'Other' },
]

const schema = z.object({
  description:      z.string().min(1, 'Required'),
  amount:           z.coerce.number().min(0.01, 'Must be > 0'),
  category:         z.enum(['salaries', 'utilities', 'maintenance', 'supplies', 'transport', 'other']),
  expense_date:     z.string().min(1, 'Required'),
  paid_to:          z.string().optional(),
  reference_number: z.string().optional(),
  notes:            z.string().optional(),
})
type FormValues = z.infer<typeof schema>

function ExpenseFormModal({ open, onOpenChange, expense }: { open: boolean; onOpenChange: (v: boolean) => void; expense?: Expense | null }) {
  const isEdit = !!expense
  const create = useCreateExpense()
  const update = useUpdateExpense()
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
  const onSubmit = async (v: FormValues) => {
    const ok = isEdit && expense
      ? await update.mutateAsync({ id: expense.id, data: v as ExpenseFormData })
      : await create.mutateAsync(v as ExpenseFormData)
    if (ok) { form.reset(); onOpenChange(false) }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Expense' : 'Add Expense'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                {create.isPending || update.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function ExpensesTab() {
  const { role } = useAuth()
  const canEdit = role === 'headmaster' || role === 'bursar'
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState<Expense | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: expenses = [], isLoading } = useExpenses({ category: categoryFilter, search })
  const deleteExpense = useDeleteExpense()

  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0)

  const columns: Column<Expense>[] = [
    { key: 'description', header: 'Description', sortable: true, cell: r => <span className="font-medium">{r.description}</span> },
    { key: 'category', header: 'Category', cell: r => <span className="capitalize">{r.category.replace('_', ' ')}</span> },
    { key: 'amount', header: 'Amount', sortable: true, className: 'text-right tabular-nums', cell: r => formatCurrency(r.amount) },
    { key: 'expense_date', header: 'Date', sortable: true, cell: r => formatDate(r.expense_date) },
    { key: 'paid_to', header: 'Paid To', cell: r => r.paid_to || '—' },
    ...(canEdit ? [{
      key: 'actions' as keyof Expense,
      header: '',
      className: 'text-right',
      cell: (r: Expense) => (
        <div className="flex justify-end gap-2">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={e => { e.stopPropagation(); setEditTarget(r); setShowForm(true) }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); setDeleteId(r.id) }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    }] : []),
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search expenses..." className="pl-9 w-52" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">Total: <span className="font-semibold text-foreground">{formatCurrency(totalAmount)}</span></p>
          {canEdit && (
            <Button onClick={() => { setEditTarget(null); setShowForm(true) }}>
              <Plus className="mr-2 h-4 w-4" />Add Expense
            </Button>
          )}
        </div>
      </div>

      <DataTable<Expense>
        columns={columns}
        data={expenses}
        keyExtractor={r => r.id}
        loading={isLoading}
      />

      <ExpenseFormModal open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setEditTarget(null) }} expense={editTarget} />

      <Dialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Expense</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete this expense record.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteExpense.isPending}
              onClick={async () => { if (deleteId) { await deleteExpense.mutateAsync(deleteId); setDeleteId(null) } }}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
