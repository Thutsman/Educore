import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
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
import { cn } from '@/utils/cn'
import { useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset } from '../hooks/useAssets'
import type { Asset, AssetFormData } from '../types'

const CATEGORIES = ['furniture', 'equipment', 'vehicle', 'it', 'building', 'other'] as const
const STATUSES   = ['active', 'under_maintenance', 'disposed', 'lost'] as const

const STATUS_STYLES: Record<string, string> = {
  active:            'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  under_maintenance: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  disposed:          'bg-slate-500/10 text-slate-600 border-slate-500/20',
  lost:              'bg-red-500/10 text-red-700 border-red-500/20',
}

const schema = z.object({
  name:           z.string().min(1, 'Required'),
  asset_code:     z.string().min(1, 'Required'),
  category:       z.enum(CATEGORIES),
  status:         z.enum(STATUSES),
  location:       z.string().optional(),
  purchase_date:  z.string().optional(),
  purchase_price: z.coerce.number().optional(),
  description:    z.string().optional(),
})
type FormValues = z.infer<typeof schema>

function AssetFormModal({ open, onOpenChange, asset }: { open: boolean; onOpenChange: (v: boolean) => void; asset?: Asset | null }) {
  const isEdit = !!asset
  const create = useCreateAsset()
  const update = useUpdateAsset()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      name: asset?.name ?? '', asset_code: asset?.asset_code ?? '',
      category: asset?.category ?? 'other', status: asset?.status ?? 'active',
      location: asset?.location ?? '', purchase_date: asset?.purchase_date ?? '',
      purchase_price: asset?.purchase_price ?? undefined, description: asset?.description ?? '',
    },
  })
  const onSubmit = async (v: FormValues) => {
    const ok = isEdit && asset
      ? await update.mutateAsync({ id: asset.id, data: v as AssetFormData })
      : await create.mutateAsync(v as AssetFormData)
    if (ok) { form.reset(); onOpenChange(false) }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Asset' : 'Add Asset'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Asset Name *</FormLabel><FormControl><Input placeholder="Desktop Computer" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="asset_code" render={({ field }) => (
                <FormItem><FormLabel>Asset Code *</FormLabel><FormControl><Input placeholder="AST-001" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="purchase_date" render={({ field }) => (
                <FormItem><FormLabel>Purchase Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="purchase_price" render={({ field }) => (
                <FormItem><FormLabel>Purchase Price</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="location" render={({ field }) => (
              <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g. Room 204" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isPending || update.isPending}>
                {create.isPending || update.isPending ? 'Saving...' : 'Save Asset'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function AssetsPage() {
  const { role } = useAuth()
  const canEdit = role === 'headmaster' || role === 'deputy_headmaster'

  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState<Asset | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: assets = [], isLoading } = useAssets({ category: categoryFilter, status: statusFilter, search })
  const deleteAsset = useDeleteAsset()

  const columns: Column<Asset>[] = [
    { key: 'asset_code', header: 'Code', className: 'font-mono text-xs text-muted-foreground', sortable: true },
    { key: 'name', header: 'Asset', sortable: true, cell: r => <span className="font-medium">{r.name}</span> },
    { key: 'category', header: 'Category', cell: r => <span className="capitalize">{r.category}</span> },
    { key: 'location', header: 'Location', cell: r => r.location || '—' },
    { key: 'purchase_price', header: 'Value', className: 'text-right tabular-nums', cell: r => r.purchase_price != null ? formatCurrency(r.purchase_price) : '—' },
    { key: 'purchase_date', header: 'Purchased', cell: r => formatDate(r.purchase_date) },
    {
      key: 'status', header: 'Status',
      cell: r => (
        <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', STATUS_STYLES[r.status])}>
          {r.status.replace('_', ' ')}
        </span>
      ),
    },
    ...(canEdit ? [{
      key: 'actions' as keyof Asset,
      header: '',
      className: 'text-right',
      cell: (r: Asset) => (
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
    <div className="space-y-6">
      <PageHeader
        title="Assets"
        subtitle="School asset register"
        actions={
          canEdit ? (
            <Button onClick={() => { setEditTarget(null); setShowForm(true) }}>
              <Plus className="mr-2 h-4 w-4" />Add Asset
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search assets..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable<Asset>
        columns={columns}
        data={assets}
        keyExtractor={r => r.id}
        loading={isLoading}
        emptyState={
          <div className="flex flex-col items-center gap-2 py-16">
            <Package className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No assets found</p>
          </div>
        }
      />

      <AssetFormModal open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setEditTarget(null) }} asset={editTarget} />

      <Dialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remove Asset</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will soft-delete the asset from the register.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteAsset.isPending}
              onClick={async () => { if (deleteId) { await deleteAsset.mutateAsync(deleteId); setDeleteId(null) } }}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
