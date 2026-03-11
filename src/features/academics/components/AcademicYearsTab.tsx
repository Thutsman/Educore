import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, CalendarDays, ChevronDown, ChevronRight } from 'lucide-react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import {
  useAcademicYears, useTerms,
  useCreateAcademicYear, useUpdateAcademicYear,
  useCreateTerm, useUpdateTerm, useDeleteTerm,
} from '../hooks/useAcademics'
import type { AcademicYear, Term } from '../types'

// ─── Academic Year Form ───────────────────────────────────────────────────────

const yearSchema = z.object({
  label:      z.string().min(2, 'Name is required'),
  start_date: z.string().min(1, 'Start date required'),
  end_date:   z.string().min(1, 'End date required'),
  is_current: z.boolean(),
})
type YearForm = z.infer<typeof yearSchema>

function YearModal({ open, onOpenChange, year }: { open: boolean; onOpenChange: (v: boolean) => void; year?: AcademicYear | null }) {
  const isEdit = !!year
  const create = useCreateAcademicYear()
  const update = useUpdateAcademicYear()
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<YearForm>({
    resolver: zodResolver(yearSchema) as Resolver<YearForm>,
    defaultValues: { label: '', start_date: '', end_date: '', is_current: false },
  })

  useEffect(() => {
    if (!open) return
    reset({
      label:      year?.name ?? '',
      start_date: year?.start_date ?? '',
      end_date:   year?.end_date ?? '',
      is_current: year?.is_current ?? false,
    })
  }, [open, year, reset])

  const onSubmit = async (v: YearForm) => {
    const ok = isEdit && year
      ? await update.mutateAsync({ id: year.id, data: v })
      : await create.mutateAsync(v)
    if (ok) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Academic Year' : 'Add Academic Year'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Year Label <span className="text-destructive">*</span></Label>
            <Input placeholder="2025 / 2026" {...register('label')} />
            {errors.label && <p className="text-xs text-destructive">{errors.label.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start Date <span className="text-destructive">*</span></Label>
              <Input type="date" {...register('start_date')} />
              {errors.start_date && <p className="text-xs text-destructive">{errors.start_date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>End Date <span className="text-destructive">*</span></Label>
              <Input type="date" {...register('end_date')} />
              {errors.end_date && <p className="text-xs text-destructive">{errors.end_date.message}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <input
              id="is_current"
              type="checkbox"
              className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
              checked={watch('is_current')}
              onChange={e => setValue('is_current', e.target.checked)}
            />
            <div>
              <Label htmlFor="is_current" className="cursor-pointer">Mark as Current Year</Label>
              <p className="text-xs text-muted-foreground">This will unset any other current year.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || create.isPending || update.isPending}>
              {isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Term Form ────────────────────────────────────────────────────────────────

const termSchema = z.object({
  name:       z.string().min(1, 'Name is required'),
  start_date: z.string().min(1, 'Start date required'),
  end_date:   z.string().min(1, 'End date required'),
  is_current: z.boolean(),
})
type TermForm = z.infer<typeof termSchema>

function TermModal({ open, onOpenChange, yearId, term }: {
  open: boolean; onOpenChange: (v: boolean) => void; yearId: string; term?: Term | null
}) {
  const isEdit = !!term
  const create = useCreateTerm()
  const update = useUpdateTerm()
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<TermForm>({
    resolver: zodResolver(termSchema) as Resolver<TermForm>,
    defaultValues: { name: '', start_date: '', end_date: '', is_current: false },
  })

  useEffect(() => {
    if (!open) return
    reset({
      name:       term?.name ?? '',
      start_date: term?.start_date ?? '',
      end_date:   term?.end_date ?? '',
      is_current: term?.is_current ?? false,
    })
  }, [open, term, reset])

  const onSubmit = async (v: TermForm) => {
    const ok = isEdit && term
      ? await update.mutateAsync({ id: term.id, data: v })
      : await create.mutateAsync({ ...v, academic_year_id: yearId })
    if (ok) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Term' : 'Add Term'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Term Name <span className="text-destructive">*</span></Label>
            <Input placeholder="Term 1" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start Date <span className="text-destructive">*</span></Label>
              <Input type="date" {...register('start_date')} />
              {errors.start_date && <p className="text-xs text-destructive">{errors.start_date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>End Date <span className="text-destructive">*</span></Label>
              <Input type="date" {...register('end_date')} />
              {errors.end_date && <p className="text-xs text-destructive">{errors.end_date.message}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <input
              id="term_current"
              type="checkbox"
              className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
              checked={watch('is_current')}
              onChange={e => setValue('is_current', e.target.checked)}
            />
            <Label htmlFor="term_current" className="cursor-pointer">Mark as Current Term</Label>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || create.isPending || update.isPending}>
              {isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Year Row with expandable terms ──────────────────────────────────────────

function YearRow({ year, canEdit }: { year: AcademicYear; canEdit: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const [showYearModal, setShowYearModal] = useState(false)
  const [showTermModal, setShowTermModal] = useState(false)
  const [editTerm, setEditTerm] = useState<Term | null>(null)
  const [deleteTermId, setDeleteTermId] = useState<string | null>(null)
  const { data: terms = [] } = useTerms(expanded ? year.id : undefined)
  const deleteTerm = useDeleteTerm()

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div
        className="flex items-center justify-between gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3">
          <button type="button" className="text-muted-foreground">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{year.name}</span>
          {year.is_current && (
            <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 text-xs">Current</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <span>{year.start_date} → {year.end_date}</span>
          {canEdit && (
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={e => { e.stopPropagation(); setShowYearModal(true) }}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-muted/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Terms</p>
            {canEdit && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setEditTerm(null); setShowTermModal(true) }}>
                <Plus className="h-3 w-3" /> Add Term
              </Button>
            )}
          </div>
          {terms.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No terms added yet.</p>
          ) : (
            <div className="space-y-2">
              {terms.map(t => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{t.name}</span>
                    {t.is_current && <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 text-xs">Current</Badge>}
                    <span className="text-xs text-muted-foreground">{t.start_date} → {t.end_date}</span>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditTerm(t); setShowTermModal(true) }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setDeleteTermId(t.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <YearModal open={showYearModal} onOpenChange={setShowYearModal} year={year} />
      <TermModal open={showTermModal} onOpenChange={v => { setShowTermModal(v); if (!v) setEditTerm(null) }} yearId={year.id} term={editTerm} />

      <Dialog open={!!deleteTermId} onOpenChange={v => !v && setDeleteTermId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Term</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete the term.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTermId(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteTerm.isPending} onClick={async () => {
              if (deleteTermId) { await deleteTerm.mutateAsync(deleteTermId); setDeleteTermId(null) }
            }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function AcademicYearsTab() {
  const { role } = useAuth()
  const canEdit = role === 'school_admin' || role === 'headmaster' || role === 'deputy_headmaster'
  const { data: years = [], isLoading } = useAcademicYears()
  const [showYearModal, setShowYearModal] = useState(false)

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <Button onClick={() => setShowYearModal(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Academic Year
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
      ) : years.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 rounded-xl border border-dashed border-border">
          <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No academic years configured yet.</p>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => setShowYearModal(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add your first academic year
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {years.map(y => <YearRow key={y.id} year={y} canEdit={canEdit} />)}
        </div>
      )}

      <YearModal open={showYearModal} onOpenChange={setShowYearModal} />
    </div>
  )
}
