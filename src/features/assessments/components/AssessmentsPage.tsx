import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ClipboardList } from 'lucide-react'
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
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { useTeacherRecord } from '@/features/dashboard/hooks/useTeacherDashboard'
import { useAuth } from '@/hooks/useAuth'
import { useClasses, useSubjects } from '@/features/academics/hooks/useAcademics'
import {
  useAssessments,
  useAssessmentMarks,
  useEnrolledStudents,
  useClassAssessmentAverages,
  useCreateAssessment,
  useUpdateAssessment,
  useDeleteAssessment,
  useUpsertAssessmentMark,
} from '../hooks/useAssessments'
import { AppBarChart } from '@/components/charts/AppBarChart'
import type { Assessment } from '../types'
import type { CreateAssessmentInput } from '../services/assessments'

const schema = z.object({
  class_id: z.string().min(1, 'Required'),
  subject_id: z.string().min(1, 'Required'),
  title: z.string().min(1, 'Required'),
  assessment_type: z.enum(['test', 'assignment', 'project']),
  date: z.string().min(1, 'Required'),
  total_marks: z.coerce.number().min(1),
})
type FormValues = z.infer<typeof schema>

function AssessmentFormModal({
  open,
  onOpenChange,
  assessment,
  teacherId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  assessment?: Assessment | null
  teacherId: string | undefined
}) {
  const isEdit = !!assessment
  const create = useCreateAssessment(teacherId)
  const update = useUpdateAssessment()
  const { data: classes = [] } = useClasses()
  const { data: subjects = [] } = useSubjects()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      class_id: '',
      subject_id: '',
      title: '',
      assessment_type: 'test',
      date: format(new Date(), 'yyyy-MM-dd'),
      total_marks: 100,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        class_id: assessment?.class_id ?? '',
        subject_id: assessment?.subject_id ?? '',
        title: assessment?.title ?? '',
        assessment_type: (assessment?.assessment_type as FormValues['assessment_type']) ?? 'test',
        date: assessment?.date ?? format(new Date(), 'yyyy-MM-dd'),
        total_marks: assessment?.total_marks ?? 100,
      })
    }
  }, [open, assessment, form])

  const onSubmit = async (v: FormValues) => {
    const payload: CreateAssessmentInput = {
      class_id: v.class_id,
      subject_id: v.subject_id,
      title: v.title,
      assessment_type: v.assessment_type as 'test' | 'assignment' | 'project',
      date: v.date,
      total_marks: v.total_marks,
    }
    const ok = isEdit && assessment
      ? await update.mutateAsync({ id: assessment.id, data: payload })
      : await create.mutateAsync(payload)
    if (ok) {
      form.reset()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit assessment' : 'Add assessment'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl><Input placeholder="e.g. Class Test 1" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="assessment_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="test">Test</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                    </SelectContent>
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
              <FormField control={form.control} name="total_marks" render={({ field }) => (
                <FormItem>
                  <FormLabel>Total marks</FormLabel>
                  <FormControl><Input type="number" min={1} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
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

export function AssessmentsPage() {
  const { user } = useAuth()
  const { data: teacher } = useTeacherRecord(user?.id)
  const [classFilter, setClassFilter] = useState<string>('all')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editAssessment, setEditAssessment] = useState<Assessment | null>(null)
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)

  const filters = {
    classId: classFilter !== 'all' ? classFilter : undefined,
    subjectId: subjectFilter !== 'all' ? subjectFilter : undefined,
  }
  const { data: assessments = [], isLoading } = useAssessments(filters)
  const { data: marks = [] } = useAssessmentMarks(selectedAssessment?.id ?? null)
  const { data: enrolled = [] } = useEnrolledStudents(selectedAssessment?.class_id ?? null)
  const { data: classAverages = [] } = useClassAssessmentAverages(selectedAssessment?.class_id ?? null)
  const deleteAssessment = useDeleteAssessment()
  const upsertMark = useUpsertAssessmentMark()

  const marksByStudent = new Map(marks.map((m) => [m.student_id, m]))
  const rows = enrolled.map((stu) => ({
    student: stu,
    mark: marksByStudent.get(stu.id),
  }))

  const chartData = classAverages.map((a) => ({
    name: a.title.length > 12 ? a.title.slice(0, 12) + '…' : a.title,
    average: Math.round(a.average * 10) / 10,
  }))

  const { data: classes = [] } = useClasses()
  const { data: subjects = [] } = useSubjects()

  const columns: Column<Assessment>[] = [
    { key: 'title', header: 'Title', sortable: true, cell: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'class_name', header: 'Class' },
    { key: 'subject_name', header: 'Subject' },
    { key: 'assessment_type', header: 'Type', cell: (r) => r.assessment_type },
    { key: 'date', header: 'Date', cell: (r) => format(new Date(r.date), 'dd MMM yyyy') },
    { key: 'total_marks', header: 'Total', className: 'tabular-nums' },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      cell: (r) => (
        <div className="flex justify-end gap-2">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedAssessment(r)} title="Enter marks">
            <ClipboardList className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditAssessment(r); setShowForm(true) }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteAssessment.mutate(r.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Continuous Assessments"
        subtitle="Record class tests and assignments"
        actions={
          <Button onClick={() => { setEditAssessment(null); setShowForm(true) }}>
            <Plus className="mr-2 h-4 w-4" /> Add assessment
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
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
      </div>

      <DataTable<Assessment>
        columns={columns}
        data={assessments}
        keyExtractor={(r) => r.id}
        loading={isLoading}
        emptyState={<div className="py-16 text-center text-sm text-muted-foreground">No assessments. Add one to get started.</div>}
      />

      <AssessmentFormModal
        open={showForm}
        onOpenChange={(v) => { setShowForm(v); if (!v) setEditAssessment(null) }}
        assessment={editAssessment}
        teacherId={teacher?.id}
      />

      <Dialog open={!!selectedAssessment} onOpenChange={() => setSelectedAssessment(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAssessment?.title} — Grade entry</DialogTitle>
          </DialogHeader>
          {selectedAssessment && (
            <div className="space-y-6">
              <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
                {selectedAssessment.class_name} · {selectedAssessment.subject_name} · Total: {selectedAssessment.total_marks} marks
              </div>
              <div className="space-y-2">
                {rows.map(({ student, mark }) => (
                  <div key={student.id} className="flex items-center gap-4 rounded-lg border border-border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{student.full_name}</p>
                      <p className="text-muted-foreground text-sm">{student.admission_no}</p>
                    </div>
                    <Input
                      type="number"
                      placeholder="Marks"
                      className="w-24"
                      min={0}
                      max={selectedAssessment.total_marks}
                      value={mark?.marks_obtained ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : Number(e.target.value)
                        upsertMark.mutate({
                          assessmentId: selectedAssessment.id,
                          studentId: student.id,
                          marks_obtained: val,
                        })
                      }}
                    />
                  </div>
                ))}
              </div>
              {chartData.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Class performance (recent assessments)</h4>
                  <AppBarChart
                    data={chartData}
                    xKey="name"
                    series={[{ key: 'average', label: 'Average' }]}
                    height={200}
                    colorByBar
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
