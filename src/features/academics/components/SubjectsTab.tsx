import { useState } from 'react'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject } from '../hooks/useAcademics'
import type { Subject } from '../types'

const schema = z.object({
  name:        z.string().min(1, 'Required'),
  code:        z.string().min(1, 'Required'),
  description: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

function SubjectFormModal({ open, onOpenChange, subject }: { open: boolean; onOpenChange: (v: boolean) => void; subject?: Subject | null }) {
  const isEdit = !!subject
  const create = useCreateSubject()
  const update = useUpdateSubject()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { name: subject?.name ?? '', code: subject?.code ?? '', description: subject?.description ?? '' },
  })

  const onSubmit = async (v: FormValues) => {
    const ok = isEdit && subject
      ? await update.mutateAsync({ id: subject.id, data: { name: v.name, code: v.code, description: v.description } })
      : await create.mutateAsync({ name: v.name, code: v.code, description: v.description })
    if (ok) { form.reset(); onOpenChange(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Subject' : 'Add Subject'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Subject Name *</FormLabel>
                <FormControl><Input placeholder="Mathematics" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="code" render={({ field }) => (
              <FormItem>
                <FormLabel>Subject Code *</FormLabel>
                <FormControl><Input placeholder="MATH" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Optional description..." {...field} /></FormControl>
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

export function SubjectsTab() {
  const { role } = useAuth()
  const canEdit = role === 'school_admin' || role === 'headmaster' || role === 'deputy_headmaster' || role === 'hod'
  const { data: subjects = [], isLoading } = useSubjects()
  const deleteSubject = useDeleteSubject()
  const [editTarget, setEditTarget] = useState<Subject | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const columns: Column<Subject>[] = [
    { key: 'name', header: 'Subject', sortable: true, cell: r => <span className="font-medium">{r.name}</span> },
    { key: 'code', header: 'Code', className: 'font-mono text-xs', sortable: true },
    { key: 'description', header: 'Description', cell: r => r.description || <span className="text-muted-foreground">—</span> },
    ...(canEdit ? [{
      key: 'actions' as keyof Subject,
      header: '',
      className: 'text-right',
      cell: (r: Subject) => (
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
            <Plus className="mr-2 h-4 w-4" />Add Subject
          </Button>
        </div>
      )}
      <DataTable<Subject>
        columns={columns}
        data={subjects}
        keyExtractor={r => r.id}
        loading={isLoading}
        emptyState={<div className="flex flex-col items-center gap-2 py-16"><BookOpen className="h-8 w-8 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No subjects yet</p></div>}
      />
      <SubjectFormModal open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setEditTarget(null) }} subject={editTarget} />
      <Dialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Subject</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will remove the subject and all related data. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteSubject.isPending} onClick={async () => { if (deleteId) { await deleteSubject.mutateAsync(deleteId); setDeleteId(null) } }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
