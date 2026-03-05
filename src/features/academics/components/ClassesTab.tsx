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
} from '@/components/ui/select'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { useAcademicYears, useClasses, useCreateClass, useUpdateClass, useDeleteClass } from '../hooks/useAcademics'
import { useTeachersForSelect } from '@/features/staff/hooks/useStaff'
import type { AcademicClass } from '../types'

const schema = z.object({
  name:             z.string().min(1, 'Required'),
  academic_year_id: z.string().min(1, 'Academic year is required'),
  level:            z.coerce.number().min(1, 'Level is required'),
  stream: z.string().optional(),
  class_teacher_id: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

function ClassFormModal({ open, onOpenChange, cls }: { open: boolean; onOpenChange: (v: boolean) => void; cls?: AcademicClass | null }) {
  const isEdit = !!cls
  const create = useCreateClass()
  const update = useUpdateClass()
  const { data: years = [] } = useAcademicYears()
  const currentYear = years.find(y => y.is_current) ?? years[0]
  const { data: teachers = [] } = useTeachersForSelect(open)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      name: '',
      academic_year_id: '',
      level: 1,
      stream: '',
      class_teacher_id: '__none__',
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      name: cls?.name ?? '',
      academic_year_id: cls?.academic_year_id ?? currentYear?.id ?? '',
      level: cls?.level ?? 1,
      stream: cls?.stream ?? '',
      class_teacher_id: cls?.class_teacher_id ?? '__none__',
    })
  }, [open, cls, currentYear?.id, form])

  const onSubmit = async (v: FormValues) => {
    const payload = {
      name: v.name,
      academic_year_id: v.academic_year_id,
      level: v.level,
      stream: v.stream || undefined,
      class_teacher_id: v.class_teacher_id === '__none__' ? undefined : (v.class_teacher_id || undefined),
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
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Class Name *</FormLabel>
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
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="level" render={({ field }) => (
                <FormItem>
                  <FormLabel>Level (Form) *</FormLabel>
                  <FormControl><Input type="number" min="1" placeholder="1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="stream" render={({ field }) => (
                <FormItem>
                  <FormLabel>Stream</FormLabel>
                  <FormControl><Input placeholder="A" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="class_teacher_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Class Teacher (Homeroom)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? '__none__'}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                    ))}
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

export function ClassesTab() {
  const { role } = useAuth()
  const canEdit = role === 'headmaster' || role === 'deputy_headmaster'
  const { data: classes = [], isLoading } = useClasses()
  const deleteClass = useDeleteClass()
  const [editTarget, setEditTarget] = useState<AcademicClass | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const columns: Column<AcademicClass>[] = [
    { key: 'name', header: 'Class Name', sortable: true, cell: r => <span className="font-medium">{r.name}</span> },
    { key: 'level', header: 'Level', cell: r => r.level ? `Form ${r.level}` : '—' },
    { key: 'stream', header: 'Stream', cell: r => r.stream || '—' },
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
        emptyState={<div className="flex flex-col items-center gap-2 py-16"><School className="h-8 w-8 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No classes yet</p></div>}
      />
      <ClassFormModal open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setEditTarget(null) }} cls={editTarget} />
      <Dialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Class</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently remove the class. Enrolled students will not be deleted.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteClass.isPending} onClick={async () => { if (deleteId) { await deleteClass.mutateAsync(deleteId); setDeleteId(null) } }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
