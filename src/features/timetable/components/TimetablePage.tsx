import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Clock, Calendar } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/common/EmptyState'
import { useClasses, useAcademicYears } from '@/features/academics/hooks/useAcademics'
import { useTeachersForSelect } from '@/features/staff/hooks/useStaff'
import { useSubjects } from '@/features/academics/hooks/useAcademics'
import {
  usePeriods,
  useTimetableEntries,
  useCreatePeriod,
  useDeletePeriod,
  useUpsertTimetableEntry,
  useDeleteTimetableEntry,
} from '../hooks/useTimetable'
import { useAuth } from '@/hooks/useAuth'
import { useTeacherRecord } from '@/features/dashboard/hooks/useTeacherDashboard'
import { toast } from 'sonner'
import type { TimetableEntry } from '../types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const

function PeriodFormModal({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (v: boolean) => void; onSuccess: () => void }) {
  const [label, setLabel] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('08:45')
  const create = useCreatePeriod()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return
    const ok = await create.mutateAsync({ label: label.trim(), start_time: startTime, end_time: endTime })
    if (ok) {
      toast.success('Period added')
      setLabel('')
      setStartTime('08:00')
      setEndTime('08:45')
      onOpenChange(false)
      onSuccess()
    } else {
      toast.error('Failed to add period')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add period</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Period 1" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>End</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending || !label.trim()}>Add</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EntryFormModal({
  open,
  onOpenChange,
  classId,
  academicYearId,
  periodId,
  dayOfWeek,
  existing,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  classId: string
  academicYearId: string
  periodId: string
  dayOfWeek: number
  existing: TimetableEntry | null
  onSuccess: () => void
}) {
  const [subjectId, setSubjectId] = useState(existing?.subject_id ?? '')
  const [teacherId, setTeacherId] = useState(existing?.teacher_id ?? '')
  const [room, setRoom] = useState(existing?.room ?? '')
  useEffect(() => {
    if (open) {
      setSubjectId(existing?.subject_id ?? '')
      setTeacherId(existing?.teacher_id ?? '')
      setRoom(existing?.room ?? '')
    }
  }, [open, existing?.subject_id, existing?.teacher_id, existing?.room])
  const upsert = useUpsertTimetableEntry()
  const { data: subjects = [] } = useSubjects()
  const { data: teachers = [] } = useTeachersForSelect()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subjectId || !teacherId) return
    const ok = await upsert.mutateAsync({
      class_id: classId,
      subject_id: subjectId,
      teacher_id: teacherId,
      period_id: periodId,
      day_of_week: dayOfWeek,
      room: room || undefined,
      academic_year_id: academicYearId,
    })
    if (ok) {
      toast.success(existing ? 'Entry updated' : 'Entry added')
      onOpenChange(false)
      onSuccess()
    } else {
      toast.error('Failed to save. Check for teacher double-booking.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>{existing ? 'Edit entry' : 'Add entry'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Subject *</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Teacher *</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select teacher" /></SelectTrigger>
              <SelectContent>{teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Room</Label>
            <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. Room 12" className="mt-1" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={upsert.isPending || !subjectId || !teacherId}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TeacherTimetableView() {
  const { user } = useAuth()
  const { data: teacher } = useTeacherRecord(user?.id)
  const { data: years = [] } = useAcademicYears()
  const currentYearId = years.find((y) => y.is_current)?.id ?? years[0]?.id
  const { data: entries = [], isLoading } = useTimetableEntries({
    teacherId: teacher?.id,
    academicYearId: currentYearId,
  })
  const { data: periods = [] } = usePeriods()

  const byPeriodAndDay = new Map<string, TimetableEntry>()
  for (const e of entries) {
    byPeriodAndDay.set(`${e.period_id}-${e.day_of_week}`, e)
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Timetable" subtitle="Your teaching schedule for this academic year" />
      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No timetable entries yet.</p>
          <p className="text-xs text-muted-foreground">Your schedule will appear here once the admin adds your lessons.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="w-28 px-3 py-2 text-left font-medium text-muted-foreground">Period</th>
                {DAYS.map((d, i) => (
                  <th key={i} className="min-w-[140px] px-3 py-2 text-center font-medium text-muted-foreground">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <span className="font-medium">{p.label}</span>
                    <p className="text-[10px] text-muted-foreground">{p.start_time.slice(0, 5)}–{p.end_time.slice(0, 5)}</p>
                  </td>
                  {DAYS.map((_, i) => {
                    const day = i + 1
                    const entry = byPeriodAndDay.get(`${p.id}-${day}`)
                    return (
                      <td key={i} className="min-w-[140px] border-l border-border p-2 align-top">
                        {entry ? (
                          <div className="rounded-lg bg-muted/40 p-2">
                            <p className="font-medium text-xs">{entry.subject_name}</p>
                            <p className="text-[10px] text-muted-foreground">{entry.class_name}</p>
                            {entry.room && <p className="text-[10px] text-muted-foreground">{entry.room}</p>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function TimetablePage() {
  const { hasRole } = useAuth()
  const canManage = hasRole('school_admin', 'headmaster', 'deputy_headmaster', 'hod')
  const isTeacher = hasRole('teacher', 'class_teacher')

  if (isTeacher && !canManage) {
    return <TeacherTimetableView />
  }

  const [classFilter, setClassFilter] = useState<string>('')
  const [showPeriodModal, setShowPeriodModal] = useState(false)
  const [entryModal, setEntryModal] = useState<{
    periodId: string
    dayOfWeek: number
    existing: TimetableEntry | null
  } | null>(null)

  const { data: classes = [] } = useClasses()
  const { data: years = [] } = useAcademicYears()
  const { data: periods = [], isLoading: periodsLoading } = usePeriods()

  const selectedClass = classes.find((c) => c.id === classFilter)
  const academicYearId = selectedClass?.academic_year_id ?? years.find((y) => y.is_current)?.id ?? years[0]?.id ?? ''

  const { data: entries = [] } = useTimetableEntries({
    classId: classFilter || undefined,
    academicYearId: academicYearId || undefined,
  })
  const deletePeriod = useDeletePeriod()
  const deleteEntry = useDeleteTimetableEntry()

  const getEntry = (periodId: string, dayOfWeek: number) =>
    entries.find((e) => e.period_id === periodId && e.day_of_week === dayOfWeek) ?? null

  const handleDeletePeriod = async (id: string) => {
    if (!confirm('Delete this period? All entries in this slot will be removed.')) return
    const ok = await deletePeriod.mutateAsync(id)
    if (ok) toast.success('Period deleted')
    else toast.error('Failed to delete')
  }

  const handleDeleteEntry = async (id: string) => {
    const ok = await deleteEntry.mutateAsync(id)
    if (ok) toast.success('Entry removed')
    else toast.error('Failed to remove')
  }

  useEffect(() => {
    if (!classFilter && classes.length > 0) setClassFilter(classes[0].id)
  }, [classes, classFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable"
        subtitle="Manage periods and timetable entries by class"
        actions={
          <Button onClick={() => setShowPeriodModal(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add period
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-48">
          <Label className="text-xs text-muted-foreground">Class</Label>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {periods.length === 0 && !periodsLoading ? (
        <EmptyState
          icon={Clock}
          title="No periods defined"
          description="Add periods (e.g. Period 1: 08:00–08:45) to build your timetable."
          action={<Button onClick={() => setShowPeriodModal(true)}>Add period</Button>}
        />
      ) : !classFilter ? (
        <p className="text-sm text-muted-foreground">Select a class to view and edit the timetable.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="w-28 px-3 py-2 text-left font-medium text-muted-foreground">Period</th>
                {DAYS.map((_, i) => (
                  <th key={i} className="min-w-[140px] px-3 py-2 text-center font-medium text-muted-foreground">
                    {DAYS[i]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium">{p.label}</span>
                      <div className="flex gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleDeletePeriod(p.id)}
                          title="Delete period"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {p.start_time.slice(0, 5)}–{p.end_time.slice(0, 5)}
                    </p>
                  </td>
                  {DAYS.map((_, i) => {
                    const day = i + 1
                    const entry = getEntry(p.id, day)
                    return (
                      <td key={i} className="min-w-[140px] border-l border-border p-1 align-top">
                        <div className="min-h-[60px] rounded-lg border border-dashed border-border bg-muted/20 p-2">
                          {entry ? (
                            <div className="group relative">
                              <p className="font-medium text-xs">{entry.subject_name}</p>
                              <p className="text-[10px] text-muted-foreground">{entry.teacher_name}</p>
                              {entry.room && <p className="text-[10px] text-muted-foreground">{entry.room}</p>}
                              <div className="mt-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs"
                                  onClick={() => setEntryModal({ periodId: p.id, dayOfWeek: day, existing: entry })}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs text-destructive"
                                  onClick={() => handleDeleteEntry(entry.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-full w-full text-muted-foreground hover:text-foreground"
                              onClick={() => setEntryModal({ periodId: p.id, dayOfWeek: day, existing: null })}
                            >
                              <Plus className="mr-1 h-3 w-3" /> Add
                            </Button>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PeriodFormModal open={showPeriodModal} onOpenChange={setShowPeriodModal} onSuccess={() => {}} />
      {entryModal && classFilter && academicYearId && (
        <EntryFormModal
          open={!!entryModal}
          onOpenChange={() => setEntryModal(null)}
          classId={classFilter}
          academicYearId={academicYearId}
          periodId={entryModal.periodId}
          dayOfWeek={entryModal.dayOfWeek}
          existing={entryModal.existing}
          onSuccess={() => setEntryModal(null)}
        />
      )}
    </div>
  )
}
