import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ClipboardList, Loader2, Plus, ShoppingCart } from 'lucide-react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/utils/cn'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/utils/format'
import type { AppRole } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import type { ProcurementInitiator, PurchaseRequisition, PurchaseRequisitionStatus } from '../types'
import {
  useRequisitions,
  useRequisitionDetail,
  useSchoolProcurementInitiator,
  useProcurementCommands,
} from '../hooks/useProcurement'
import { financeToolbarControlClassName } from '@/features/finance/components/FinanceTermSelector'

const CATEGORIES = [
  { value: 'utilities', label: 'Utilities' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'transport', label: 'Transport' },
  { value: 'events', label: 'Events' },
  { value: 'other', label: 'Other' },
] as const

const draftSchema = z.object({
  title: z.string().min(1, 'Required'),
  justification: z.string().optional(),
  category: z.enum(['salaries', 'utilities', 'maintenance', 'supplies', 'equipment', 'transport', 'events', 'other']),
  estimated_amount: z.coerce.number().optional(),
})
type DraftForm = z.infer<typeof draftSchema>

const quoteSchema = z.object({
  supplier_name: z.string().min(1, 'Required'),
  quoted_amount: z.coerce.number().min(0.01, 'Must be > 0'),
  quote_date: z.string().min(1, 'Required'),
  notes: z.string().optional(),
})
type QuoteForm = z.infer<typeof quoteSchema>

const orderSchema = z.object({
  supplier_reference: z.string().optional(),
  order_notes: z.string().optional(),
})
type OrderForm = z.infer<typeof orderSchema>

const STATUS_LABEL: Record<PurchaseRequisitionStatus, string> = {
  draft: 'Draft',
  pending_headmaster: 'Pending Headmaster',
  approved: 'Approved',
  rejected: 'Rejected',
  ordered: 'Order issued',
}

const STATUS_CLASS: Record<PurchaseRequisitionStatus, string> = {
  draft: 'bg-slate-500/10 text-slate-700 border-slate-500/20',
  pending_headmaster: 'bg-amber-500/10 text-amber-800 border-amber-500/20',
  approved: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-700 border-red-500/20',
  ordered: 'bg-blue-500/10 text-blue-800 border-blue-500/20',
}

function roleCanRaise(procurement_initiator: ProcurementInitiator | null | undefined, hasRole: (...r: AppRole[]) => boolean) {
  if (!procurement_initiator) return false
  switch (procurement_initiator) {
    case 'bursar':
      return hasRole('bursar')
    case 'deputy_headmaster':
      return hasRole('deputy_headmaster')
    case 'either':
      return hasRole('bursar', 'deputy_headmaster')
    default:
      return false
  }
}

export function ProcurementTab() {
  const { profile, hasRole } = useAuth()
  const [searchParams] = useSearchParams()
  const filterParam = searchParams.get('filter')
  const { data: initiator } = useSchoolProcurementInitiator()
  const { data: rows = [], isLoading } = useRequisitions()
  const [detailId, setDetailId] = useState<string | null>(null)
  const detailQuery = useRequisitionDetail(detailId)
  const cmds = useProcurementCommands()

  const [showCreate, setShowCreate] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showOrder, setShowOrder] = useState(false)

  const canRaise = roleCanRaise(initiator ?? null, hasRole)
  const hm = hasRole('headmaster')
  const bur = hasRole('bursar')

  useEffect(() => {
    if (filterParam !== 'pending_hm') return
    const pend = rows.find((r) => r.status === 'pending_headmaster')
    if (pend) setDetailId(pend.id)
  }, [filterParam, rows])

  const filteredRows = useMemo(() => {
    if (filterParam === 'pending_hm') return rows.filter((r) => r.status === 'pending_headmaster')
    return rows
  }, [filterParam, rows])

  const createForm = useForm<DraftForm>({
    resolver: zodResolver(draftSchema) as Resolver<DraftForm>,
    defaultValues: {
      title: '',
      justification: '',
      category: 'supplies',
      estimated_amount: undefined,
    },
  })

  const detailDraftForm = useForm<DraftForm>({
    resolver: zodResolver(draftSchema) as Resolver<DraftForm>,
    defaultValues: {
      title: '',
      justification: '',
      category: 'supplies',
      estimated_amount: undefined,
    },
  })

  const quoteForm = useForm<QuoteForm>({
    resolver: zodResolver(quoteSchema) as Resolver<QuoteForm>,
    defaultValues: {
      supplier_name: '',
      quoted_amount: 0,
      quote_date: new Date().toISOString().slice(0, 10),
      notes: '',
    },
  })

  const orderForm = useForm<OrderForm>({
    resolver: zodResolver(orderSchema) as Resolver<OrderForm>,
    defaultValues: { supplier_reference: '', order_notes: '' },
  })

  const det = detailQuery.data ?? null

  useEffect(() => {
    if (!det || det.status !== 'draft') return
    detailDraftForm.reset({
      title: det.title,
      justification: det.justification ?? '',
      category: det.category as DraftForm['category'],
      estimated_amount: det.estimated_amount ?? undefined,
    })
  }, [det, detailDraftForm])

  const onCreate = async (v: DraftForm) => {
    if (!profile?.id) return
    const id = await cmds.createDraft.mutateAsync({ userId: profile.id, input: v })
    if (id) {
      toast.success('Draft requisition saved')
      setShowCreate(false)
      createForm.reset()
      setDetailId(id)
    } else toast.error('Could not create requisition.')
  }

  const onSaveDraftDetail = async (v: DraftForm) => {
    if (!det) return
    const ok = await cmds.updateDraft.mutateAsync({ id: det.id, input: v })
    toast[ok ? 'success' : 'error'](ok ? 'Saved' : 'Could not save (draft only)')
  }

  const onSubmitToHm = async () => {
    if (!det) return
    const ok = await cmds.submit.mutateAsync(det.id)
    toast[ok ? 'success' : 'error'](
      ok ? 'Sent to Headmaster' : 'Add ≥1 quotation and choose a preferred supplier first.',
    )
  }

  const onApprove = async () => {
    if (!det || !profile?.id) return
    const ok = await cmds.approveHm.mutateAsync({ id: det.id, userId: profile.id })
    toast[ok ? 'success' : 'error'](ok ? 'Requisition approved' : 'Approve failed.')
  }

  const onReject = async () => {
    if (!det || !profile?.id) return
    const ok = await cmds.rejectHm.mutateAsync({ id: det.id, userId: profile.id, reason: rejectReason })
    if (ok) {
      toast.success('Requisition rejected')
      setRejectOpen(false)
      setRejectReason('')
    } else toast.error('Reject failed')
  }

  const onMarkOrdered = async (v: OrderForm) => {
    if (!det) return
    const ok = await cmds.markOrdered.mutateAsync({
      id: det.id,
      input: { supplier_reference: v.supplier_reference, order_notes: v.order_notes },
    })
    toast[ok ? 'success' : 'error'](ok ? 'Order issued' : 'Could not update')
    if (ok) setShowOrder(false)
  }

  const onAddQuote = async (v: QuoteForm) => {
    if (!det) return
    const ok = await cmds.addQuoteMut.mutateAsync({ requisitionId: det.id, input: v })
    toast[ok ? 'success' : 'error'](ok ? 'Quotation added' : 'Could not add quotation')
    if (ok) quoteForm.reset({ supplier_name: '', quoted_amount: 0, quote_date: new Date().toISOString().slice(0, 10), notes: '' })
  }

  const columns: Column<PurchaseRequisition>[] = [
    { key: 'reference_no', header: 'Ref', sortable: true, className: 'font-mono text-xs' },
    { key: 'title', header: 'Title', sortable: true, cell: (r) => <span className="font-medium">{r.title}</span> },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (r) => (
        <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium capitalize', STATUS_CLASS[r.status])}>
          {STATUS_LABEL[r.status]}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (r) => <span className="capitalize">{r.category}</span>,
    },
    {
      key: 'estimated_amount',
      header: 'Estimate',
      className: 'text-right tabular-nums',
      cell: (r) => (r.estimated_amount != null ? formatCurrency(r.estimated_amount) : '—'),
    },
    {
      key: 'created_at',
      header: 'Created',
      cell: (r) => formatDate(r.created_at),
    },
    {
      key: 'linked_expense_id',
      header: '',
      cell: (r) =>
        r.linked_expense_id ? (
          <span className="text-xs text-muted-foreground">Expense linked</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      {filterParam === 'pending_hm' ? (
        <p className="text-sm text-muted-foreground rounded-lg border border-border bg-muted/30 px-3 py-2">
          Showing requisitions awaiting Headmaster approval.{' '}
          <Link to="/finance?tab=procurement" className="font-medium text-primary underline underline-offset-2">
            Clear filter
          </Link>
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Procurement initiator for this school:{' '}
          <span className="font-medium text-foreground capitalize">
            {(initiator ?? 'bursar').replace('_', ' ')}
          </span>
        </p>
        {canRaise ? (
          <Button className="h-9 gap-2 sm:h-10" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> New requisition
          </Button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <DataTable<PurchaseRequisition>
          columns={columns}
          data={filteredRows}
          keyExtractor={(r) => r.id}
          loading={isLoading}
          onRowClick={(r) => setDetailId(r.id)}
          emptyState={
            <EmptyState icon={ClipboardList} title="No requisitions yet" description="Raise a draft when you need supplies or services quoted." />
          }
        />
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New procurement requisition</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form className="space-y-4" onSubmit={createForm.handleSubmit(onCreate)}>
              <FormField
                control={createForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl><Input placeholder="What you need procured" className={financeToolbarControlClassName} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="justification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Justification</FormLabel>
                    <FormControl><Textarea rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={createForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className={financeToolbarControlClassName}><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="salaries">Salaries</SelectItem>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="estimated_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated (USD)</FormLabel>
                      <FormControl><Input type="number" step="0.01" className={financeToolbarControlClassName} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" disabled={cmds.createDraft.isPending}>
                  {cmds.createDraft.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save draft'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">
              {det?.reference_no ?? '—'} · {det?.title ?? 'Requisition'}
            </DialogTitle>
          </DialogHeader>
          {!det ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', STATUS_CLASS[det.status])}>
                  {STATUS_LABEL[det.status]}
                </span>
                {det.linked_expense_id ? (
                  <span className="text-xs text-muted-foreground">Linked to expense</span>
                ) : null}
              </div>

              {det.status === 'draft' && det.raised_by === profile?.id && canRaise ? (
                <Form {...detailDraftForm}>
                  <form
                    className="space-y-3 rounded-lg border border-border p-3"
                    onSubmit={detailDraftForm.handleSubmit(onSaveDraftDetail)}
                  >
                    <p className="text-sm font-medium">Edit draft</p>
                    <FormField control={detailDraftForm.control} name="title" render={({ field }) => (
                      <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={detailDraftForm.control} name="justification" render={({ field }) => (
                      <FormItem><FormLabel>Justification</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <FormField control={detailDraftForm.control} name="category" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="salaries">Salaries</SelectItem>
                              {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      <FormField control={detailDraftForm.control} name="estimated_amount" render={({ field }) => (
                        <FormItem><FormLabel>Estimate</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
                      )} />
                    </div>
                    <Button type="submit" variant="secondary" disabled={cmds.updateDraft.isPending} size="sm">Save draft</Button>
                  </form>
                </Form>
              ) : null}

              {/* Quotes */}
              {(det.status === 'draft') && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Quotations</p>
                  <ul className="space-y-2">
                    {det.quotes.map((q) => (
                      <li
                        key={q.id}
                        className={cn(
                          'flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm',
                          q.selected ? 'border-primary bg-primary/5' : 'border-border',
                        )}
                      >
                        <span className="font-medium">{q.supplier_name}</span>
                        <span className="tabular-nums">{formatCurrency(q.quoted_amount)}</span>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={q.selected ? 'default' : 'outline'}
                            className="h-8"
                            disabled={cmds.selectQuoteMut.isPending}
                            onClick={() => cmds.selectQuoteMut.mutate({ requisitionId: det.id, quoteId: q.id })}
                          >
                            Prefer
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 text-destructive"
                            onClick={() => cmds.deleteQuoteMut.mutate({ quoteId: q.id, requisitionId: det.id })}
                          >
                            Remove
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <Form {...quoteForm}>
                    <form className="space-y-2 rounded-md border border-dashed border-border p-3" onSubmit={quoteForm.handleSubmit(onAddQuote)}>
                      <p className="text-xs font-medium text-muted-foreground">Add quotation</p>
                      <FormField control={quoteForm.control} name="supplier_name" render={({ field }) => (
                        <FormItem><FormControl><Input placeholder="Supplier name" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <FormField control={quoteForm.control} name="quoted_amount" render={({ field }) => (
                          <FormItem><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={quoteForm.control} name="quote_date" render={({ field }) => (
                          <FormItem><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                        )} />
                      </div>
                      <Button type="submit" size="sm" variant="outline" disabled={cmds.addQuoteMut.isPending}>Add quote</Button>
                    </form>
                  </Form>
                </div>
              )}

              {det.status !== 'draft' && det.quotes.length > 0 ? (
                <div className="text-sm">
                  <p className="font-medium">Quotations</p>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    {det.quotes.map((q) => (
                      <li key={q.id}>
                        {q.supplier_name}: {formatCurrency(q.quoted_amount)}
                        {q.selected ? <span className="ml-2 text-primary">(preferred)</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                {det.status === 'draft' && det.raised_by === profile?.id && canRaise ? (
                  <Button onClick={() => void onSubmitToHm()} disabled={cmds.submit.isPending}>
                    Submit to Headmaster
                  </Button>
                ) : null}
                {det.status === 'pending_headmaster' && hm ? (
                  <>
                    <Button onClick={() => void onApprove()} disabled={cmds.approveHm.isPending}>Approve</Button>
                    <Button variant="outline" onClick={() => setRejectOpen(true)}>Reject</Button>
                  </>
                ) : null}
                {det.status === 'approved' && bur ? (
                  <>
                    <Button variant="secondary" onClick={() => { orderForm.reset(); setShowOrder(true) }}>
                      <ShoppingCart className="mr-2 h-4 w-4" /> Issue order
                    </Button>
                    {!det.linked_expense_id ? (
                      <Button asChild>
                        <Link to={`/finance?tab=expenses&prefillReq=${det.id}`}>
                          Record expense
                        </Link>
                      </Button>
                    ) : null}
                  </>
                ) : null}
                {det.status === 'ordered' && bur && !det.linked_expense_id ? (
                  <Button asChild>
                    <Link to={`/finance?tab=expenses&prefillReq=${det.id}`}>Record expense</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject requisition</DialogTitle></DialogHeader>
          <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason..." rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => void onReject()} disabled={!rejectReason.trim()}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showOrder} onOpenChange={setShowOrder}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Issue order</DialogTitle></DialogHeader>
          <Form {...orderForm}>
            <form className="space-y-4" onSubmit={orderForm.handleSubmit(onMarkOrdered)}>
              <FormField control={orderForm.control} name="supplier_reference" render={({ field }) => (
                <FormItem><FormLabel>LPO / reference</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={orderForm.control} name="order_notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowOrder(false)}>Cancel</Button>
                <Button type="submit" disabled={cmds.markOrdered.isPending}>Confirm</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
