import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, CheckCircle, Paperclip, Upload, X, FileText, FileImage } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useTeacherRecord } from '@/features/dashboard/hooks/useTeacherDashboard'
import { useClasses, useSubjects, useTerms } from '@/features/academics/hooks/useAcademics'
import {
  useSchemeBooks,
  useCreateSchemeBook,
  useUpdateSchemeBook,
  useHodApproveSchemeBook,
  useApproveSchemeBook,
  useSchemeBookProgress,
  useUploadAttachment,
} from '../hooks/useSchemeBook'
import { useTeachers } from '@/features/staff/hooks/useStaff'
import { useSchool } from '@/context/SchoolContext'
import type { SchemeBook } from '../types'
import type { CreateSchemeBookInput } from '../services/schemeBook'
import { SchemeBookAttachmentsSheet } from './SchemeBookAttachmentsSheet'

const schema = z.object({
  class_id: z.string().min(1, 'Required'),
  subject_id: z.string().min(1, 'Required'),
  term_id: z.string().min(1, 'Required'),
  week: z.coerce.number().min(1).max(52),
  topic: z.string().min(1, 'Required'),
  objectives: z.string().optional(),
  teaching_methods: z.string().optional(),
  teaching_aids: z.string().optional(),
  references: z.string().optional(),
  evaluation: z.string().optional(),
  status: z.enum(['planned', 'completed']).optional(),
})
type FormValues = z.infer<typeof schema>

const MAX_FILE_BYTES = 10 * 1024 * 1024

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function SchemeFormModal({
  open,
  onOpenChange,
  scheme,
  teacherId,
  schoolId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  scheme?: SchemeBook | null
  teacherId: string | undefined
  schoolId: string
}) {
  const isEdit = !!scheme
  const create = useCreateSchemeBook(teacherId)
  const update = useUpdateSchemeBook()
  const uploadFile = useUploadAttachment()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const { data: classes = [] } = useClasses()
  const { data: subjects = [] } = useSubjects()
  const { data: terms = [] } = useTerms()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      class_id: '',
      subject_id: '',
      term_id: '',
      week: 1,
      topic: '',
      objectives: '',
      teaching_methods: '',
      teaching_aids: '',
      references: '',
      evaluation: '',
      status: 'planned',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        class_id: scheme?.class_id ?? '',
        subject_id: scheme?.subject_id ?? '',
        term_id: scheme?.term_id ?? '',
        week: scheme?.week ?? 1,
        topic: scheme?.topic ?? '',
        objectives: scheme?.objectives ?? '',
        teaching_methods: scheme?.teaching_methods ?? '',
        teaching_aids: scheme?.teaching_aids ?? '',
        references: scheme?.references ?? '',
        evaluation: scheme?.evaluation ?? '',
        status: scheme?.status ?? 'planned',
      })
      setPendingFiles([])
    }
  }, [open, scheme, form])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []).filter((f) => {
      if (f.size > MAX_FILE_BYTES) { toast.error(`${f.name}: exceeds 10 MB`); return false }
      return true
    })
    setPendingFiles((prev) => [...prev, ...picked])
    e.target.value = ''
  }

  const onSubmit = async (v: FormValues) => {
    const payload: CreateSchemeBookInput = {
      class_id: v.class_id,
      subject_id: v.subject_id,
      term_id: v.term_id,
      week: v.week,
      topic: v.topic,
      objectives: v.objectives || undefined,
      teaching_methods: v.teaching_methods || undefined,
      teaching_aids: v.teaching_aids || undefined,
      references: v.references || undefined,
      evaluation: v.evaluation || undefined,
      status: v.status as 'planned' | 'completed',
    }

    let schemeId: string | null = null
    if (isEdit && scheme) {
      const ok = await update.mutateAsync({ id: scheme.id, data: payload })
      if (!ok) return
      schemeId = scheme.id
    } else {
      schemeId = await create.mutateAsync(payload)
      if (!schemeId) return
    }

    for (const file of pendingFiles) {
      await uploadFile.mutateAsync({ schemeBookId: schemeId, file, schoolId, teacherId: teacherId! })
    }

    form.reset()
    setPendingFiles([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col overflow-hidden p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>{isEdit ? 'Edit scheme' : 'Add scheme'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* ── Required fields — always visible ── */}
            <div className="shrink-0 space-y-4 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="class_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                      <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="subject_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger></FormControl>
                      <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="term_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger></FormControl>
                      <SelectContent>{terms.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="week" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Week *</FormLabel>
                    <FormControl><Input type="number" min={1} max={52} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="topic" render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic *</FormLabel>
                  <FormControl><Input placeholder="Topic title" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* ── Tabs: Fill form / Upload scan ── */}
            <p className="shrink-0 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Choose submission method
            </p>
            <Tabs defaultValue="form" className="flex min-h-0 flex-1 flex-col">
              <TabsList className="shrink-0 w-full h-11 rounded-lg border border-border bg-muted p-1 gap-1">
                <TabsTrigger
                  value="form"
                  className="flex-1 h-full gap-2 rounded-md text-sm font-medium transition-all
                    data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                    data-[state=active]:shadow-sm"
                >
                  <Pencil className="h-3.5 w-3.5" /> Fill form
                </TabsTrigger>
                <TabsTrigger
                  value="upload"
                  className="flex-1 h-full gap-2 rounded-md text-sm font-medium transition-all
                    data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                    data-[state=active]:shadow-sm"
                >
                  <Upload className="h-3.5 w-3.5" /> Upload scan
                </TabsTrigger>
              </TabsList>

              <TabsContent value="form" className="min-h-0 flex-1 overflow-y-auto space-y-4 pt-4 pr-1">
                <FormField control={form.control} name="objectives" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objectives</FormLabel>
                    <FormControl><Textarea rows={2} placeholder="Learning objectives..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="teaching_methods" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teaching methods</FormLabel>
                    <FormControl><Textarea rows={1} placeholder="Methods" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="teaching_aids" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teaching aids</FormLabel>
                    <FormControl><Input placeholder="Aids" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="references" render={({ field }) => (
                  <FormItem>
                    <FormLabel>References</FormLabel>
                    <FormControl><Input placeholder="References" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="evaluation" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evaluation</FormLabel>
                    <FormControl><Textarea rows={1} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                {isEdit && (
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="planned">Planned</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
              </TabsContent>

              <TabsContent value="upload" className="flex flex-col items-center justify-center gap-4 pt-6 pb-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                {pendingFiles.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border px-6 py-10 text-center transition-colors hover:border-primary hover:bg-muted/40"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Click to upload files</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF or image (photo/scan) · up to 10 MB each</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full space-y-3">
                    <ul className="space-y-1.5">
                      {pendingFiles.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm">
                          {f.type.startsWith('image/')
                            ? <FileImage className="h-4 w-4 shrink-0 text-blue-500" />
                            : <FileText className="h-4 w-4 shrink-0 text-red-500" />
                          }
                          <span className="min-w-0 flex-1 truncate">{f.name}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(f.size)}</span>
                          <button type="button" onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))} className="shrink-0 text-muted-foreground hover:text-destructive">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="mr-2 h-3.5 w-3.5" /> Add more files
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="shrink-0 border-t pt-4 mt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isPending || update.isPending || uploadFile.isPending}>
                {create.isPending || update.isPending || uploadFile.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function SchemeBookPage() {
  const { user, hasRole } = useAuth()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  const { data: teacher } = useTeacherRecord(user?.id)
  const [classFilter, setClassFilter] = useState<string>('all')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [termFilter, setTermFilter] = useState<string>('all')
  const [teacherFilter, setTeacherFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editScheme, setEditScheme] = useState<SchemeBook | null>(null)
  const [attachmentScheme, setAttachmentScheme] = useState<SchemeBook | null>(null)

  const isAdmin = hasRole('headmaster', 'deputy_headmaster')
  const isHod = hasRole('hod')

  const filters = {
    classId: classFilter !== 'all' ? classFilter : undefined,
    subjectId: subjectFilter !== 'all' ? subjectFilter : undefined,
    termId: termFilter !== 'all' ? termFilter : undefined,
    teacherId: isAdmin && teacherFilter !== 'all' ? teacherFilter : undefined,
  }
  const { data: schemes = [], isLoading } = useSchemeBooks(filters)
  const { data: progress } = useSchemeBookProgress(filters.termId ?? null)
  const hodApprove = useHodApproveSchemeBook()
  const finalApprove = useApproveSchemeBook()

  const { data: classes = [] } = useClasses()
  const { data: subjects = [] } = useSubjects()
  const { data: terms = [] } = useTerms()
  const { data: teachers = [] } = useTeachers()

  const columns: Column<SchemeBook>[] = [
    ...(isAdmin ? [{ key: 'teacher_name' as keyof SchemeBook, header: 'Teacher', cell: (r: SchemeBook) => r.teacher_name }] : []),
    { key: 'week', header: 'Week', sortable: true, className: 'w-16' },
    { key: 'topic', header: 'Topic', sortable: true, cell: (r) => <span className="font-medium">{r.topic}</span> },
    { key: 'class_name', header: 'Class' },
    { key: 'subject_name', header: 'Subject' },
    { key: 'term_name', header: 'Term' },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.status === 'completed' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'hod_approved_at',
      header: 'HOD approved',
      cell: (r) => (r.hod_approved_at ? <span className="text-muted-foreground text-xs">Yes</span> : '—'),
    },
    {
      key: 'approved_at',
      header: 'Final approved',
      cell: (r) => (r.approved_at ? <span className="text-muted-foreground text-xs">Yes</span> : '—'),
    },
    {
      key: 'id',
      header: 'Files',
      className: 'w-16 text-center',
      cell: (r) => (
        <Button
          size="icon" variant="ghost" className="h-7 w-7"
          title="View attachments"
          onClick={() => setAttachmentScheme(r)}
        >
          <Paperclip className="h-3.5 w-3.5" />
        </Button>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      cell: (r) => (
        <div className="flex justify-end gap-2">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditScheme(r); setShowForm(true) }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {isHod && !r.hod_approved_at && (
            <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600" onClick={() => hodApprove.mutate({ id: r.id, profileId: user?.id ?? '' })} title="Approve (HOD)">
              <CheckCircle className="h-3.5 w-3.5" />
            </Button>
          )}
          {isAdmin && r.hod_approved_at && !r.approved_at && (
            <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" onClick={() => finalApprove.mutate({ id: r.id, profileId: user?.id ?? '' })} title="Final approve (Headmaster/Deputy)">
              <CheckCircle className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheme Book"
        subtitle="Weekly teaching schemes by class and subject"
        actions={
          teacher ? (
            <Button onClick={() => { setEditScheme(null); setShowForm(true) }}>
              <Plus className="mr-2 h-4 w-4" /> Add scheme
            </Button>
          ) : null
        }
      />

      {filters.termId && progress && progress.total > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Progress this term</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(progress.completed / progress.total) * 100}%` }}
              />
            </div>
            <span className="text-sm tabular-nums">{progress.completed} / {progress.total} completed</span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {isAdmin && (
          <Select value={teacherFilter} onValueChange={setTeacherFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All teachers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All teachers</SelectItem>
              {teachers.map((t) => (
                <SelectItem key={t.id} value={t.profile_id}>{t.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
        <Select value={termFilter} onValueChange={setTermFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All terms" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All terms</SelectItem>
            {terms.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable<SchemeBook>
        columns={columns}
        data={schemes}
        keyExtractor={(r) => r.id}
        loading={isLoading}
        emptyState={<div className="py-16 text-center text-sm text-muted-foreground">No schemes found. Add one to get started.</div>}
      />

      <SchemeFormModal
        open={showForm}
        onOpenChange={(v) => { setShowForm(v); if (!v) setEditScheme(null) }}
        scheme={editScheme}
        teacherId={teacher?.id}
        schoolId={schoolId}
      />

      <SchemeBookAttachmentsSheet
        scheme={attachmentScheme}
        open={!!attachmentScheme}
        onOpenChange={(v) => { if (!v) setAttachmentScheme(null) }}
        teacherId={teacher?.id}
        schoolId={schoolId}
        canUpload={!!teacher?.id && attachmentScheme?.teacher_id === teacher?.id}
      />
    </div>
  )
}
