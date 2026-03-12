import { useState } from 'react'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
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
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '../hooks/useAcademics'
import type { Department } from '../types'

const schema = z.object({
  name:        z.string().min(1, 'Required'),
  code:        z.string().optional(),
  description: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

function DepartmentFormModal({ open, onOpenChange, dept }: { open: boolean; onOpenChange: (v: boolean) => void; dept?: Department | null }) {
  const isEdit = !!dept
  const create = useCreateDepartment()
  const update = useUpdateDepartment()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { name: dept?.name ?? '', code: dept?.code ?? '', description: dept?.description ?? '' },
  })

  const onSubmit = async (v: FormValues) => {
    const ok = isEdit && dept
      ? await update.mutateAsync({ id: dept.id, data: { name: v.name, code: v.code || undefined, description: v.description } })
      : await create.mutateAsync({ name: v.name, code: v.code, description: v.description })
    if (ok) {
      toast.success(isEdit ? 'Department updated.' : 'Department created.')
      form.reset()
      onOpenChange(false)
    } else {
      toast.error('Failed to save department. The code may already be in use.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) form.reset() }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Department' : 'Add Department'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Department Name *</FormLabel>
                <FormControl><Input placeholder="e.g. Science Department" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="code" render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl><Input placeholder="e.g. SCI, MATH, LANG" className="uppercase" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                <p className="text-xs text-muted-foreground">Short identifier used in reports. Must be unique per school.</p>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Optional..." {...field} /></FormControl>
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

export function DepartmentsTab() {
  const { role } = useAuth()
  const canEdit = role === 'school_admin' || role === 'headmaster' || role === 'deputy_headmaster'
  const { data: departments = [], isLoading } = useDepartments()
  const deleteDept = useDeleteDepartment()
  const [editTarget, setEditTarget] = useState<Department | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const columns: Column<Department>[] = [
    { key: 'name', header: 'Department', sortable: true, cell: r => <span className="font-medium">{r.name}</span> },
    { key: 'code', header: 'Code', className: 'font-mono text-xs', cell: r => r.code ?? <span className="text-muted-foreground">—</span> },
    { key: 'description', header: 'Description', cell: r => r.description || <span className="text-muted-foreground">—</span> },
    ...(canEdit ? [{
      key: 'actions' as keyof Department,
      header: '',
      className: 'text-right',
      cell: (r: Department) => (
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
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
        <strong>What is a Department?</strong> Departments are organisational units (e.g. Science Dept, Languages Dept) that group teachers and subjects. HODs are assigned to departments. Departments are different from Subjects — a department may contain many subjects.
      </div>
      {canEdit && (
        <div className="flex justify-end">
          <Button onClick={() => { setEditTarget(null); setShowForm(true) }}>
            <Plus className="mr-2 h-4 w-4" />Add Department
          </Button>
        </div>
      )}
      <DataTable<Department>
        columns={columns}
        data={departments}
        keyExtractor={r => r.id}
        loading={isLoading}
        emptyState={
          <div className="flex flex-col items-center gap-2 py-16">
            <Building2 className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No departments yet</p>
            {canEdit && <p className="text-xs text-muted-foreground">Create departments so teachers can be assigned to them.</p>}
          </div>
        }
      />
      <DepartmentFormModal
        open={showForm}
        onOpenChange={v => { setShowForm(v); if (!v) setEditTarget(null) }}
        dept={editTarget}
      />
      <Dialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Department</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will soft-delete the department. Teachers and subjects linked to it will remain but lose the department association.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteDept.isPending}
              onClick={async () => {
                if (deleteId) {
                  const ok = await deleteDept.mutateAsync(deleteId)
                  if (ok) { toast.success('Department deleted.'); setDeleteId(null) }
                  else toast.error('Failed to delete department.')
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
