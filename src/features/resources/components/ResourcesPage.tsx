import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, FileText, ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTeacherRecord } from '@/features/dashboard/hooks/useTeacherDashboard'
import { useAuth } from '@/hooks/useAuth'
import { useClasses, useSubjects } from '@/features/academics/hooks/useAcademics'
import {
  useLearningResources,
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
  useUploadResourceFile,
} from '../hooks/useResources'
import type { LearningResource, ResourceFileType } from '../types'
import type { CreateResourceInput } from '../services/resources'

const FILE_TYPES: ResourceFileType[] = ['pdf', 'video', 'ppt', 'doc']

const schema = z.object({
  subject_id: z.string().min(1, 'Required'),
  class_id: z.string().optional(),
  title: z.string().min(1, 'Required'),
  description: z.string().optional(),
  file_type: z.enum(['pdf', 'video', 'ppt', 'doc']),
  topic: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

function ResourceFormModal({
  open,
  onOpenChange,
  resource,
  teacherId,
  onFileUpload,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  resource?: LearningResource | null
  teacherId: string | undefined
  onFileUpload: (file: File) => Promise<string | null>
}) {
  const isEdit = !!resource
  const create = useCreateResource(teacherId)
  const update = useUpdateResource()
  const { data: classes = [] } = useClasses()
  const { data: subjects = [] } = useSubjects()
  const [fileUrl, setFileUrl] = useState<string>(resource?.file_url ?? '')
  const [fileUploading, setFileUploading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      subject_id: '',
      class_id: '',
      title: '',
      description: '',
      file_type: 'pdf',
      topic: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        subject_id: resource?.subject_id ?? '',
        class_id: resource?.class_id ?? '',
        title: resource?.title ?? '',
        description: resource?.description ?? '',
        file_type: (resource?.file_type as FormValues['file_type']) ?? 'pdf',
        topic: resource?.topic ?? '',
      })
      setFileUrl(resource?.file_url ?? '')
    }
  }, [open, resource, form])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileUploading(true)
    const url = await onFileUpload(file)
    setFileUploading(false)
    if (url) setFileUrl(url)
  }

  const onSubmit = async (v: FormValues) => {
    if (!fileUrl && !isEdit) return
    const payload: CreateResourceInput = {
      subject_id: v.subject_id,
      class_id: v.class_id || undefined,
      title: v.title,
      description: v.description || undefined,
      file_url: fileUrl,
      file_type: v.file_type as ResourceFileType,
      topic: v.topic || undefined,
    }
    const ok = isEdit && resource
      ? await update.mutateAsync({ id: resource.id, data: payload })
      : await create.mutateAsync(payload)
    if (ok) {
      form.reset()
      setFileUrl('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit resource' : 'Add resource'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <FormField control={form.control} name="class_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Class (optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl><SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="">All classes</SelectItem>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl><Input placeholder="Resource title" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Input placeholder="Brief description" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="file_type" render={({ field }) => (
              <FormItem>
                <FormLabel>File type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {FILE_TYPES.map((t) => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="topic" render={({ field }) => (
              <FormItem>
                <FormLabel>Topic</FormLabel>
                <FormControl><Input placeholder="Topic tag" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormItem>
              <FormLabel>File *</FormLabel>
              <Input type="file" onChange={handleFileChange} disabled={fileUploading} />
              {fileUrl && (
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-sm flex items-center gap-1 mt-1">
                  <ExternalLink className="h-3 w-3" /> View / replace file
                </a>
              )}
            </FormItem>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isPending || update.isPending || (!fileUrl && !isEdit)}>
                {create.isPending || update.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function ResourcesPage() {
  const { user } = useAuth()
  const { data: teacher } = useTeacherRecord(user?.id)
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [topicSearch, setTopicSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editResource, setEditResource] = useState<LearningResource | null>(null)

  const filters = {
    subjectId: subjectFilter !== 'all' ? subjectFilter : undefined,
    classId: classFilter !== 'all' ? classFilter : undefined,
    topic: topicSearch.trim() || undefined,
  }
  const { data: resources = [], isLoading } = useLearningResources(filters)
  const deleteResource = useDeleteResource()
  const uploadFile = useUploadResourceFile()

  const { data: classes = [] } = useClasses()
  const { data: subjects = [] } = useSubjects()

  const handleUpload = async (file: File): Promise<string | null> => {
    const url = await uploadFile.mutateAsync(file)
    return url ?? null
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning Resources"
        subtitle="Upload and organise learning materials"
        actions={
          <Button onClick={() => { setEditResource(null); setShowForm(true) }}>
            <Plus className="mr-2 h-4 w-4" /> Add resource
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All subjects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          placeholder="Search by topic..."
          className="w-48"
          value={topicSearch}
          onChange={(e) => setTopicSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold truncate">{r.title}</h3>
                  <p className="text-muted-foreground text-sm">{r.subject_name} {r.class_name ? ` · ${r.class_name}` : ''}</p>
                  {r.topic && <span className="mt-1 inline-block rounded bg-muted px-2 py-0.5 text-xs">{r.topic}</span>}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditResource(r); setShowForm(true) }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteResource.mutate(r.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {r.description && <p className="mt-2 text-muted-foreground text-sm line-clamp-2">{r.description}</p>}
              <a
                href={r.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2 text-primary text-sm font-medium"
              >
                <FileText className="h-4 w-4" /> Open file
              </a>
            </div>
          ))}
        </div>
      )}

      {!isLoading && resources.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">No resources. Add one to get started.</div>
      )}

      <ResourceFormModal
        open={showForm}
        onOpenChange={(v) => { setShowForm(v); if (!v) setEditResource(null) }}
        resource={editResource}
        teacherId={teacher?.id}
        onFileUpload={handleUpload}
      />
    </div>
  )
}
