import { useState } from 'react'
import { Plus, Pencil, Trash2, ClipboardList } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/utils/format'
import {
  useExams, useClasses, useSubjects, useTerms,
  useCreateExam, useUpdateExam, useDeleteExam,
} from '../hooks/useAcademics'
import type { Exam } from '../types'

const schema = z.object({
  name:        z.string().min(1, 'Required'),
  subject_id:  z.string().min(1, 'Required'),
  class_id:    z.string().min(1, 'Required'),
  term_id:     z.string().optional(),
  exam_date:   z.string().optional(),
  total_marks: z.coerce.number().min(1, 'Must be ≥ 1'),
  description: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

function ExamFormModal({
  open, onOpenChange, exam,
}: { open: boolean; onOpenChange: (v: boolean) => void; exam?: Exam | null }) {
  const isEdit = !!exam
  const create = useCreateExam()
  const update = useUpdateExam()
  const { data: classes = [] } = useClasses()
  const { data: subjects = [] } = useSubjects()
  const { data: terms = [] } = useTerms()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      name:        exam?.name ?? '',
      subject_id:  exam?.subject_id ?? '',
      class_id:    exam?.class_id ?? '',
      term_id:     exam?.term_id ?? '',
      exam_date:   exam?.exam_date ?? '',
      total_marks: exam?.total_marks ?? 100,
      description: exam?.description ?? '',
    },
  })

  const onSubmit = async (v: FormValues) => {
    const payload = { ...v, term_id: v.term_id || undefined, exam_date: v.exam_date || undefined, description: v.description || undefined }
    const ok = isEdit && exam
      ? await update.mutateAsync({ id: exam.id, data: payload })
      : await create.mutateAsync(payload)
    if (ok) { form.reset(); onOpenChange(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Exam' : 'Add Exam'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Exam Name *</FormLabel>
                <FormControl><Input placeholder="Mid-Term Test" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="subject_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger></FormControl>
                    <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="term_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Term</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger></FormControl>
                    <SelectContent>{terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="exam_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Exam Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="total_marks" render={({ field }) => (
              <FormItem>
                <FormLabel>Total Marks *</FormLabel>
                <FormControl><Input type="number" placeholder="100" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Optional notes..." {...field} /></FormControl>
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

export function ExamsTab() {
  const { role } = useAuth()
  const canEdit = ['hod', 'class_teacher', 'teacher'].includes(role ?? '')

  const [classFilter, setClassFilter] = useState<string>('all')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')

  const { data: classes = [] } = useClasses()
  const { data: subjects = [] } = useSubjects()
  const { data: exams = [], isLoading } = useExams({
    classId:   classFilter !== 'all' ? classFilter : undefined,
    subjectId: subjectFilter !== 'all' ? subjectFilter : undefined,
  })
  const deleteExam = useDeleteExam()
  const [editTarget, setEditTarget] = useState<Exam | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const columns: Column<Exam>[] = [
    { key: 'name', header: 'Exam', sortable: true, cell: r => <span className="font-medium">{r.name}</span> },
    { key: 'subject_name', header: 'Subject', sortable: true },
    { key: 'class_name', header: 'Class', sortable: true },
    { key: 'term_name', header: 'Term', cell: r => r.term_name || '—' },
    { key: 'exam_date', header: 'Date', cell: r => formatDate(r.exam_date) },
    { key: 'total_marks', header: 'Total Marks', className: 'text-right tabular-nums' },
    ...(canEdit ? [{
      key: 'actions' as keyof Exam,
      header: '',
      className: 'text-right',
      cell: (r: Exam) => (
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
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Subjects" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {canEdit && (
          <Button onClick={() => { setEditTarget(null); setShowForm(true) }}>
            <Plus className="mr-2 h-4 w-4" />Add Exam
          </Button>
        )}
      </div>

      <DataTable<Exam>
        columns={columns}
        data={exams}
        keyExtractor={r => r.id}
        loading={isLoading}
        emptyState={
          <div className="flex flex-col items-center gap-2 py-16">
            <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No exams found</p>
          </div>
        }
      />

      <ExamFormModal open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setEditTarget(null) }} exam={editTarget} />

      <Dialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Exam</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will delete the exam and all grades associated with it.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteExam.isPending}
              onClick={async () => { if (deleteId) { await deleteExam.mutateAsync(deleteId); setDeleteId(null) } }}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
