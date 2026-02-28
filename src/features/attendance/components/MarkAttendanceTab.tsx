import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { CheckCircle2, Save } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/utils/cn'
import {
  useAttendanceClasses, useStudentsForClass,
  useAttendanceForDate, useBatchSaveAttendance,
} from '../hooks/useAttendance'
import type { AttendanceMarkRow, AttendanceStatus } from '../types'

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'present', label: 'Present', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20' },
  { value: 'absent',  label: 'Absent',  color: 'bg-red-500/10 text-red-700 border-red-500/30 hover:bg-red-500/20' },
  { value: 'late',    label: 'Late',    color: 'bg-amber-500/10 text-amber-700 border-amber-500/30 hover:bg-amber-500/20' },
  { value: 'excused', label: 'Excused', color: 'bg-blue-500/10 text-blue-700 border-blue-500/30 hover:bg-blue-500/20' },
]

const ACTIVE_COLORS: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-500 text-white border-emerald-500',
  absent:  'bg-red-500 text-white border-red-500',
  late:    'bg-amber-500 text-white border-amber-500',
  excused: 'bg-blue-500 text-white border-blue-500',
}

export function MarkAttendanceTab() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [classId, setClassId] = useState<string>('')
  const [date, setDate] = useState<string>(today)
  const [rows, setRows] = useState<AttendanceMarkRow[]>([])
  const [saved, setSaved] = useState(false)

  const { data: classes = [], isLoading: isClassesLoading } = useAttendanceClasses()
  const { data: students = [] } = useStudentsForClass(classId || null)
  const { data: existing = [] } = useAttendanceForDate(classId || null, date)
  const saveAll = useBatchSaveAttendance()

  // Rebuild rows when students or existing records change
  useEffect(() => {
    if (!students.length) { setRows([]); return }
    const existMap = new Map(existing.map(e => [e.student_id, e]))
    setSaved(false)
    setRows(students.map(s => {
      const ex = existMap.get(s.id)
      return {
        studentId: s.id,
        studentName: s.full_name,
        admissionNumber: s.admission_number,
        status: (ex?.status ?? 'present') as AttendanceStatus,
        remarks: ex?.remarks ?? '',
        existingId: ex?.id,
      }
    }))
  }, [students.length, existing.length, classId, date])

  const updateRow = (idx: number, patch: Partial<AttendanceMarkRow>) => {
    setSaved(false)
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r))
  }

  const markAll = (status: AttendanceStatus) => {
    setSaved(false)
    setRows(prev => prev.map(r => ({ ...r, status })))
  }

  const handleSave = async () => {
    if (!classId || !date) return
    await saveAll.mutateAsync(rows.map(r => ({
      studentId: r.studentId, classId, date, status: r.status, remarks: r.remarks,
    })))
    setSaved(true)
  }

  const presentCount = rows.filter(r => r.status === 'present').length
  const absentCount  = rows.filter(r => r.status === 'absent').length
  const lateCount    = rows.filter(r => r.status === 'late').length

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label>Class</Label>
          <Select value={classId} onValueChange={v => { setClassId(v); setSaved(false) }}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={e => { setDate(e.target.value); setSaved(false) }} className="w-44" />
        </div>
      </div>

      {!isClassesLoading && classes.length === 0 && (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 py-6">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            No classes are assigned to your account. Ask your administrator to set up class assignments.
          </p>
        </div>
      )}

      {!classId && classes.length > 0 && (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-20">
          <p className="text-sm text-muted-foreground">Select a class to start marking attendance</p>
        </div>
      )}

      {classId && rows.length === 0 && (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-20">
          <p className="text-sm text-muted-foreground">No active students in this class</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
            <div className="flex gap-5 text-sm">
              <span><span className="font-semibold text-emerald-600">{presentCount}</span> <span className="text-muted-foreground">Present</span></span>
              <span><span className="font-semibold text-red-600">{absentCount}</span> <span className="text-muted-foreground">Absent</span></span>
              <span><span className="font-semibold text-amber-600">{lateCount}</span> <span className="text-muted-foreground">Late</span></span>
              <span><span className="font-semibold">{rows.length}</span> <span className="text-muted-foreground">Total</span></span>
            </div>
            <div className="flex gap-2">
              <span className="text-xs text-muted-foreground mr-1 self-center">Mark all:</span>
              {STATUS_OPTIONS.map(o => (
                <button key={o.value} onClick={() => markAll(o.value)}
                  className={cn('rounded-md border px-2.5 py-1 text-xs font-medium transition-colors', o.color)}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Student rows */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Adm. No.</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.studentId} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{row.studentName}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{row.admissionNumber}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1.5">
                        {STATUS_OPTIONS.map(o => (
                          <button
                            key={o.value}
                            onClick={() => updateRow(i, { status: o.value })}
                            className={cn(
                              'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                              row.status === o.value ? ACTIVE_COLORS[o.value] : 'border-border text-muted-foreground hover:bg-muted'
                            )}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <Input
                        value={row.remarks}
                        onChange={e => updateRow(i, { remarks: e.target.value })}
                        placeholder="Optional note..."
                        className="h-7 text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />Attendance saved
              </span>
            )}
            <Button onClick={handleSave} disabled={saveAll.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {saveAll.isPending ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
