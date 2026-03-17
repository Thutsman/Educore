import { useMemo, useState } from 'react'
import { X, Plus, AlertTriangle, BookOpen, Home } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import {
  useTeacherAllocations,
  useAddTeacherAllocation,
  useAddAllSubjectAllocations,
  useRemoveTeacherAllocation,
  useSubjectsForSelect,
  useClassesForSelect,
  useCurrentAcademicYear,
  useSetHomeroomClass,
  useClearHomeroomForTeacher,
} from '../hooks/useStaff'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacherId: string | null
  teacherName: string
}

export function TeacherAllocationsModal({ open, onOpenChange, teacherId, teacherName }: Props) {
  const [subjectId, setSubjectId] = useState('')
  const [classId, setClassId]     = useState('')
  const [homeroomClassId, setHomeroomClassId] = useState('')

  const { data: allocations = [], isLoading } = useTeacherAllocations(teacherId ?? undefined)
  const { data: subjects = [] }               = useSubjectsForSelect()
  const { data: classes = [] }                = useClassesForSelect()
  const { data: currentYear }                 = useCurrentAcademicYear()

  const addAllocation    = useAddTeacherAllocation()
  const addAllSubjects   = useAddAllSubjectAllocations()
  const removeAllocation = useRemoveTeacherAllocation()
  const setHomeroom = useSetHomeroomClass()
  const clearHomeroom = useClearHomeroomForTeacher()

  const currentHomeroom = useMemo(() => {
    return classes.find(c => c.class_teacher_id === teacherId) ?? null
  }, [classes, teacherId])

  const handleAdd = async () => {
    if (!teacherId || !subjectId || !classId) return
    if (!currentYear) {
      toast.error('No active academic year. Set one in Academics → Academic Years.')
      return
    }
    const ok = await addAllocation.mutateAsync({ teacherId, subjectId, classId })
    if (ok) {
      toast.success('Allocation added.')
      setClassId('')
    } else {
      toast.error('Failed to add allocation. It may already exist for this year.')
    }
  }

  const handleSetHomeroom = async () => {
    if (!teacherId || !homeroomClassId) return
    const ok = await setHomeroom.mutateAsync({ teacherId, classId: homeroomClassId })
    if (ok) {
      toast.success('Homeroom class assigned.')
      setHomeroomClassId('')
    } else {
      toast.error('Failed to assign homeroom class.')
    }
  }

  const handleClearHomeroom = async () => {
    if (!teacherId) return
    const ok = await clearHomeroom.mutateAsync({ teacherId })
    if (ok) toast.success('Homeroom class cleared.')
    else toast.error('Failed to clear homeroom class.')
  }

  const handleAddAllSubjects = async () => {
    if (!teacherId || !classId || subjects.length === 0) return
    if (!currentYear) {
      toast.error('No active academic year. Set one in Academics → Academic Years.')
      return
    }
    const { added, skipped } = await addAllSubjects.mutateAsync({
      teacherId,
      classId,
      subjectIds: subjects.map(s => s.id),
    })
    if (added > 0) {
      toast.success(`${added} subject${added !== 1 ? 's' : ''} assigned.${skipped > 0 ? ` ${skipped} already existed.` : ''}`)
      setClassId('')
    } else if (skipped > 0) {
      toast.info('All subjects were already allocated for this class.')
    } else {
      toast.error('Failed to assign subjects.')
    }
  }

  const handleRemove = async (allocationId: string) => {
    if (!teacherId) return
    const ok = await removeAllocation.mutateAsync({ allocationId, teacherId })
    if (ok) {
      toast.success('Allocation removed.')
    } else {
      toast.error('Failed to remove allocation.')
    }
  }

  // Group allocations by class for a cleaner view
  const allocationsByClass = allocations.reduce<Record<string, { className: string; items: typeof allocations }>>((acc, a) => {
    if (!acc[a.class_id]) acc[a.class_id] = { className: a.class_name, items: [] }
    acc[a.class_id].items.push(a)
    return acc
  }, {})

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) { setSubjectId(''); setClassId(''); setHomeroomClassId('') } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subject Allocations</DialogTitle>
          <p className="text-sm text-muted-foreground">{teacherName}</p>
        </DialogHeader>

        {/* Homeroom (Class Teacher) */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Homeroom (Class Teacher)</h4>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <div className="flex items-start gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10">
                <Home className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium">Current homeroom</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentHomeroom ? currentHomeroom.name : '—'}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearHomeroom}
                disabled={!teacherId || !currentHomeroom || clearHomeroom.isPending || setHomeroom.isPending}
                className="shrink-0 text-xs"
              >
                {clearHomeroom.isPending ? 'Clearing…' : 'Clear'}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Select value={homeroomClassId} onValueChange={setHomeroomClassId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select homeroom class to assign" />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom" sideOffset={4}>
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleSetHomeroom}
              disabled={!teacherId || !homeroomClassId || setHomeroom.isPending || clearHomeroom.isPending}
              className="shrink-0 text-xs"
            >
              {setHomeroom.isPending ? 'Assigning…' : 'Assign'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Assigning a homeroom class will automatically remove any previous homeroom assignment for this teacher.
          </p>
        </div>

        {/* Academic year indicator */}
        {currentYear ? (
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Allocations for academic year:{' '}
            <span className="font-semibold text-foreground">{currentYear.label}</span>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span className="text-amber-800 dark:text-amber-400">
              No active academic year found. Set one in{' '}
              <strong>Academics → Academic Years</strong> before adding allocations.
            </span>
          </div>
        )}

        {/* Add allocation form */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Add Allocation</h4>

          {/* Class selector shared by both options */}
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a class first" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" sideOffset={4}>
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Option A: all subjects at once (primary school) */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <div className="flex-1">
              <p className="text-xs font-medium">All subjects</p>
              <p className="text-xs text-muted-foreground">Primary class teacher — assigns every subject in one click</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddAllSubjects}
              disabled={!classId || !currentYear || addAllSubjects.isPending || subjects.length === 0}
              className="shrink-0 text-xs"
            >
              {addAllSubjects.isPending ? 'Assigning…' : 'Assign all'}
            </Button>
          </div>

          {/* Option B: single subject (secondary / specialist) */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <div className="flex-1">
              <p className="text-xs font-medium">Specific subject</p>
              <p className="text-xs text-muted-foreground">Secondary / specialist teacher</p>
            </div>
            <div className="flex gap-2">
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" sideOffset={4}>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!subjectId || !classId || !currentYear || addAllocation.isPending}
                className="shrink-0"
                title="Add this subject-class pair"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Current allocations */}
        <div>
          <h4 className="mb-3 text-sm font-semibold">
            Current Allocations
            {allocations.length > 0 && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                {allocations.length}
              </span>
            )}
          </h4>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : allocations.length === 0 ? (
            <EmptyState
              title="No allocations yet"
              description="Use the form above to assign subjects and classes to this teacher."
              className="py-8 border-dashed"
            />
          ) : (
            <div className="space-y-3">
              {Object.values(allocationsByClass).map(({ className, items }) => (
                <div key={items[0].class_id} className="rounded-lg border border-border">
                  <div className="border-b border-border bg-muted/30 px-4 py-2 text-xs font-semibold text-muted-foreground">
                    {className}
                  </div>
                  <div className="divide-y divide-border">
                    {items.map(a => (
                      <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-violet-500/10">
                          <BookOpen className="h-3.5 w-3.5 text-violet-500" />
                        </div>
                        <span className="flex-1 text-sm font-medium">{a.subject_name}</span>
                        <button
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                          onClick={() => handleRemove(a.id)}
                          disabled={removeAllocation.isPending}
                          aria-label={`Remove ${a.subject_name} from ${a.class_name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border pt-4">
          <p className="flex-1 text-xs text-muted-foreground">
            Changes are saved automatically. Close when done.
          </p>
          <Button onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
