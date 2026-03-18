import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, School } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  SelectGroup, SelectLabel,
} from '@/components/ui/select'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { useAcademicYears, useClasses, useCreateClass, useUpdateClass, useDeleteClass, useDepartments } from '../hooks/useAcademics'
import { useTeachersForSelect, type TeacherSelectOption } from '@/features/staff/hooks/useStaff'
import type { AcademicClass } from '../types'

// ─── Level options ────────────────────────────────────────────────────────────

interface LevelOption {
  key: string
  label: string
  level: number
}

const PRIMARY_LEVELS: LevelOption[] = [
  { key: 'ecd-a',   label: 'ECD A',   level: 0 },
  { key: 'ecd-b',   label: 'ECD B',   level: 0 },
  { key: 'grade-1', label: 'Grade 1', level: 1 },
  { key: 'grade-2', label: 'Grade 2', level: 2 },
  { key: 'grade-3', label: 'Grade 3', level: 3 },
  { key: 'grade-4', label: 'Grade 4', level: 4 },
  { key: 'grade-5', label: 'Grade 5', level: 5 },
  { key: 'grade-6', label: 'Grade 6', level: 6 },
  { key: 'grade-7', label: 'Grade 7', level: 7 },
]

const SECONDARY_LEVELS: LevelOption[] = [
  { key: 'form-1', label: 'Form 1', level: 1 },
  { key: 'form-2', label: 'Form 2', level: 2 },
  { key: 'form-3', label: 'Form 3', level: 3 },
  { key: 'form-4', label: 'Form 4', level: 4 },
  { key: 'form-5', label: 'Form 5', level: 5 },
  { key: 'form-6', label: 'Form 6', level: 6 },
]

const ALL_LEVELS = [...PRIMARY_LEVELS, ...SECONDARY_LEVELS]

function levelKeyFromClass(cls: AcademicClass): string {
  if (!cls.level && cls.level !== 0) return ''
  const name = cls.name?.toLowerCase() ?? ''
  if (name.startsWith('ecd a')) return 'ecd-a'
  if (name.startsWith('ecd b')) return 'ecd-b'
  if (name.startsWith('grade')) return `grade-${cls.level}`
  if (name.startsWith('form'))  return `form-${cls.level}`
  // fallback: form for secondary-range levels, grade otherwise
  return cls.level <= 7 ? `grade-${cls.level}` : `form-${cls.level}`
}

// ─── Form modal ───────────────────────────────────────────────────────────────

const schema = z.object({
  name:             z.string().min(1, 'Class name is required'),
  academic_year_id: z.string().min(1, 'Academic year is required'),
  level_key:        z.string().min(1, 'Level is required'),
  stream:           z.string().optional(),
  class_teacher_id: z.string().optional(),
  department_id:    z.string().optional(),
})
type FormValues = z.infer<typeof schema>

function ClassFormModal({ open, onOpenChange, cls }: {
  open: boolean; onOpenChange: (v: boolean) => void; cls?: AcademicClass | null
}) {
  const isEdit = !!cls
  const create = useCreateClass()
  const update = useUpdateClass()
  const { data: years = [] } = useAcademicYears()
  const currentYear = years.find(y => y.is_current) ?? years[0]
  const { data: teachers = [] } = useTeachersForSelect(open)
  const { data: departments = [] } = useDepartments()

  function getTeacherWarning(t: TeacherSelectOption): string | null {
    if (!t.homeroom_class_name) return null
    if (cls && t.homeroom_class_name === cls.name) return null
    return `Already homeroom for ${t.homeroom_class_name}`
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { name: '', academic_year_id: '', level_key: '', stream: '', class_teacher_id: '__none__', department_id: '__none__' },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      name:             cls?.name ?? '',
      academic_year_id: cls?.academic_year_id ?? currentYear?.id ?? '',
      level_key:        cls ? levelKeyFromClass(cls) : '',
      stream:           cls?.stream ?? '',
      class_teacher_id: cls?.class_teacher_id ?? '__none__',
      department_id:    cls?.department_id ?? '__none__',
    })
  }, [open, cls, currentYear?.id, form])

  // Auto-suggest class name when level or stream changes (new class only)
  const levelKey = form.watch('level_key')
  const stream   = form.watch('stream')
  useEffect(() => {
    if (isEdit) return
    const opt = ALL_LEVELS.find(o => o.key === levelKey)
    if (!opt) return
    const suggested = stream?.trim() ? `${opt.label} ${stream.trim()}` : opt.label
    const current = form.getValues('name')
    // Only auto-fill if the name is empty or was a previous auto-suggestion
    const wasAutoFilled = ALL_LEVELS.some(o => current === o.label || current.startsWith(o.label + ' '))
    if (!current || wasAutoFilled) {
      form.setValue('name', suggested, { shouldValidate: false })
    }
  }, [levelKey, stream, isEdit, form])

  const onSubmit = async (v: FormValues) => {
    const opt = ALL_LEVELS.find(o => o.key === v.level_key)
    const payload = {
      name:             v.name,
      academic_year_id: v.academic_year_id,
      level:            opt?.level ?? 1,
      stream:           v.stream || undefined,
      class_teacher_id: v.class_teacher_id === '__none__' ? undefined : (v.class_teacher_id || undefined),
      department_id:    v.department_id === '__none__' ? null : (v.department_id || null),
    }
    const ok = isEdit && cls
      ? await update.mutateAsync({ id: cls.id, data: payload })
      : await create.mutateAsync(payload)
    if (ok) { form.reset(); onOpenChange(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Class' : 'Add Class'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Level + Stream side by side */}
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="level_key" render={({ field }) => (
                <FormItem>
                  <FormLabel>Level *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-72 overflow-y-auto">
                      <SelectGroup>
                        <SelectLabel className="text-xs font-semibold text-muted-foreground">Primary School</SelectLabel>
                        {PRIMARY_LEVELS.map(o => (
                          <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel className="text-xs font-semibold text-muted-foreground">Secondary School</SelectLabel>
                        {SECONDARY_LEVELS.map(o => (
                          <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="stream" render={({ field }) => (
                <FormItem>
                  <FormLabel>Stream / Section</FormLabel>
                  <FormControl><Input placeholder="A, Blue, Science…" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Class name (auto-suggested, editable) */}
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Class Name *
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">(auto-filled, editable)</span>
                </FormLabel>
                <FormControl><Input placeholder="Form 1A" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="academic_year_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Academic Year *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select academic year" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {years.map(y => (
                      <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="department_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? '__none__'}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="class_teacher_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Class Teacher (Homeroom)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? '__none__'}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {teachers.map(t => {
                      const warning = getTeacherWarning(t)
                      return (
                        <SelectItem key={t.id} value={t.id}>
                          <span className="flex items-center justify-between gap-3 w-full">
                            <span>{t.full_name}</span>
                            {warning && <span className="text-xs text-amber-600 font-normal">{warning}</span>}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
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

// ─── Tab ──────────────────────────────────────────────────────────────────────

export function ClassesTab() {
  const { role } = useAuth()
  const canEdit = role === 'school_admin' || role === 'headmaster' || role === 'deputy_headmaster'
  const { data: classes = [], isLoading } = useClasses()
  const deleteClass = useDeleteClass()
  const [editTarget, setEditTarget] = useState<AcademicClass | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const columns: Column<AcademicClass>[] = [
    { key: 'name', header: 'Class Name', sortable: true, cell: r => <span className="font-medium">{r.name}</span> },
    { key: 'level', header: 'Level', cell: r => r.level != null ? String(r.level) : '—' },
    { key: 'stream', header: 'Stream', cell: r => r.stream || '—' },
    { key: 'department_name', header: 'Department', cell: r => r.department_name || '—' },
    { key: 'academic_year_name', header: 'Academic Year', cell: r => r.academic_year_name || '—' },
    { key: 'class_teacher_name', header: 'Class Teacher', cell: r => r.class_teacher_name || '—' },
    ...(canEdit ? [{
      key: 'actions' as keyof AcademicClass,
      header: '',
      className: 'text-right',
      cell: (r: AcademicClass) => (
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
      {canEdit && (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          During setup, you can create classes first and assign homeroom (class teachers) later in{' '}
          <span className="font-medium text-foreground">Staff → Allocations</span>.
        </div>
      )}
      {canEdit && (
        <div className="flex justify-end">
          <Button onClick={() => { setEditTarget(null); setShowForm(true) }}>
            <Plus className="mr-2 h-4 w-4" />Add Class
          </Button>
        </div>
      )}
      <DataTable<AcademicClass>
        columns={columns}
        data={classes}
        keyExtractor={r => r.id}
        loading={isLoading}
        emptyState={
          <div className="flex flex-col items-center gap-2 py-16">
            <School className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No classes yet</p>
          </div>
        }
      />
      <ClassFormModal open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setEditTarget(null) }} cls={editTarget} />
      <Dialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Class</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently remove the class. Enrolled students will not be deleted.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteClass.isPending} onClick={async () => {
              if (deleteId) { await deleteClass.mutateAsync(deleteId); setDeleteId(null) }
            }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
