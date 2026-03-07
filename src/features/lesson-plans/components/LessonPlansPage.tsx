import { useState, useEffect } from 'react'
import { Plus, Pencil, Copy, Trash2, Calendar } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
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
import { format, subDays, addDays } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { useTeacherRecord } from '@/features/dashboard/hooks/useTeacherDashboard'
import { useClasses, useSubjects } from '@/features/academics/hooks/useAcademics'
import {
  useLessonPlans,
  useCreateLessonPlan,
  useUpdateLessonPlan,
  useDeleteLessonPlan,
  useDuplicateLessonPlan,
} from '../hooks/useLessonPlans'
import type { LessonPlan } from '../types'
import type { CreateLessonPlanInput } from '../services/lessonPlans'

const schema = z.object({
  class_id: z.string().min(1, 'Required'),
  subject_id: z.string().min(1, 'Required'),
  date: z.string().min(1, 'Required'),
  lesson_objectives: z.string().optional(),
  introduction: z.string().optional(),
  lesson_development: z.string().optional(),
  conclusion: z.string().optional(),
  homework: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

const defaultDateRange = () => {
  const today = new Date()
  return {
    start: format(subDays(today, 7), 'yyyy-MM-dd'),
    end: format(addDays(today, 30), 'yyyy-MM-dd'),
  }
}

function LessonPlanFormModal({
  open,
  onOpenChange,
  plan,
  teacherId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  plan?: LessonPlan | null
  teacherId: string | undefined
}) {
  const isEdit = !!plan
  const create = useCreateLessonPlan(teacherId)
  const update = useUpdateLessonPlan()
  const { data: classes = [] } = useClasses()
  const { data: subjects = [] } = useSubjects()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      class_id: '',
      subject_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      lesson_objectives: '',
      introduction: '',
      lesson_development: '',
      conclusion: '',
      homework: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        class_id: plan?.class_id ?? '',
        subject_id: plan?.subject_id ?? '',
        date: plan?.date ?? format(new Date(), 'yyyy-MM-dd'),
        lesson_objectives: plan?.lesson_objectives ?? '',
        introduction: plan?.introduction ?? '',
        lesson_development: plan?.lesson_development ?? '',
        conclusion: plan?.conclusion ?? '',
        homework: plan?.homework ?? '',
      })
    }
  }, [open, plan, form])

  const onSubmit = async (v: FormValues) => {
    const payload: CreateLessonPlanInput = {
      class_id: v.class_id,
      subject_id: v.subject_id,
      date: v.date,
      lesson_objectives: v.lesson_objectives || undefined,
      introduction: v.introduction || undefined,
      lesson_development: v.lesson_development || undefined,
      conclusion: v.conclusion || undefined,
      homework: v.homework || undefined,
    }
    const ok = isEdit && plan
      ? await update.mutateAsync({ id: plan.id, data: payload })
      : await create.mutateAsync(payload)
    if (ok) {
      form.reset()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit lesson plan' : 'Add lesson plan'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="class_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Class *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger></FormControl>
                    <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="subject_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger></FormControl>
                    <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date *</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="lesson_objectives" render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson objectives</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="introduction" render={({ field }) => (
              <FormItem>
                <FormLabel>Introduction</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="lesson_development" render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson development</FormLabel>
                <FormControl><Textarea rows={4} className="font-mono text-sm" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="conclusion" render={({ field }) => (
              <FormItem>
                <FormLabel>Conclusion</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="homework" render={({ field }) => (
              <FormItem>
                <FormLabel>Homework</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
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

export function LessonPlansPage() {
  const { user } = useAuth()
  const { data: teacher } = useTeacherRecord(user?.id)
  const [classFilter, setClassFilter] = useState<string>('all')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState(defaultDateRange)
  const [showForm, setShowForm] = useState(false)
  const [editPlan, setEditPlan] = useState<LessonPlan | null>(null)
  const [duplicateTarget, setDuplicateTarget] = useState<LessonPlan | null>(null)
  const [duplicateDate, setDuplicateDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const filters = {
    classId: classFilter !== 'all' ? classFilter : undefined,
    subjectId: subjectFilter !== 'all' ? subjectFilter : undefined,
    startDate: dateRange.start,
    endDate: dateRange.end,
  }
  const { data: plans = [], isLoading } = useLessonPlans(filters)
  const deletePlan = useDeleteLessonPlan()
  const duplicate = useDuplicateLessonPlan(teacher?.id)

  const { data: classes = [] } = useClasses()
  const { data: subjects = [] } = useSubjects()

  const columns: Column<LessonPlan>[] = [
    { key: 'date', header: 'Date', sortable: true, cell: (r) => format(new Date(r.date), 'dd MMM yyyy') },
    { key: 'class_name', header: 'Class' },
    { key: 'subject_name', header: 'Subject' },
    {
      key: 'topic',
      header: 'Objectives',
      cell: (r) => (
        <span className="line-clamp-2 text-muted-foreground text-sm">
          {r.lesson_objectives || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      cell: (r) => (
        <div className="flex justify-end gap-2">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditPlan(r); setShowForm(true) }} title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setDuplicateTarget(r); setDuplicateDate(format(addDays(new Date(r.date), 1), 'yyyy-MM-dd')) }} title="Duplicate">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deletePlan.mutate(r.id)} title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const handleDuplicate = async () => {
    if (!duplicateTarget) return
    const ok = await duplicate.mutateAsync({ id: duplicateTarget.id, newDate: duplicateDate })
    if (ok) setDuplicateTarget(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lesson Plans"
        subtitle="Daily lesson plans by class and subject"
        actions={
          <Button onClick={() => { setEditPlan(null); setShowForm(true) }}>
            <Plus className="mr-2 h-4 w-4" /> Add lesson plan
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All subjects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange((r) => ({ ...r, start: e.target.value }))}
            className="w-40"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange((r) => ({ ...r, end: e.target.value }))}
            className="w-40"
          />
        </div>
      </div>

      <DataTable<LessonPlan>
        columns={columns}
        data={plans}
        keyExtractor={(r) => r.id}
        loading={isLoading}
        emptyState={<div className="py-16 text-center text-sm text-muted-foreground">No lesson plans in this range. Add one to get started.</div>}
      />

      <LessonPlanFormModal open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) setEditPlan(null) }} plan={editPlan} teacherId={teacher?.id} />

      <Dialog open={!!duplicateTarget} onOpenChange={() => setDuplicateTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Duplicate lesson plan</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Create a copy for a new date.</p>
          <div className="space-y-2">
            <label className="text-sm font-medium">New date</label>
            <Input type="date" value={duplicateDate} onChange={(e) => setDuplicateDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateTarget(null)}>Cancel</Button>
            <Button onClick={handleDuplicate} disabled={duplicate.isPending}>
              {duplicate.isPending ? 'Duplicating...' : 'Duplicate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
