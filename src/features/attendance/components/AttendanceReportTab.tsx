import { useState } from 'react'
import { format, subMonths } from 'date-fns'
import { DataTable, type Column } from '@/components/common/DataTable'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/utils/cn'
import { useAttendanceClasses, useClassAttendanceSummary } from '../hooks/useAttendance'
import type { AttendanceSummary } from '../types'

export function AttendanceReportTab() {
  const [classId, setClassId] = useState<string>('')
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const { data: classes = [], isLoading: isClassesLoading } = useAttendanceClasses()
  const { data: summary = [], isLoading } = useClassAttendanceSummary(
    classId || null, startDate, endDate
  )

  const columns: Column<AttendanceSummary>[] = [
    { key: 'studentName', header: 'Student', sortable: true, cell: r => <span className="font-medium">{r.studentName}</span> },
    { key: 'admissionNumber', header: 'Adm. No.', className: 'font-mono text-xs text-muted-foreground' },
    { key: 'present', header: 'Present', className: 'text-center tabular-nums', cell: r => <span className="font-semibold text-emerald-600">{r.present}</span> },
    { key: 'absent',  header: 'Absent',  className: 'text-center tabular-nums', cell: r => <span className="font-semibold text-red-600">{r.absent}</span> },
    { key: 'late',    header: 'Late',    className: 'text-center tabular-nums', cell: r => <span className="font-semibold text-amber-600">{r.late}</span> },
    { key: 'excused', header: 'Excused', className: 'text-center tabular-nums', cell: r => <span className="font-semibold text-blue-600">{r.excused}</span> },
    { key: 'total',   header: 'Total',   className: 'text-center tabular-nums' },
    {
      key: 'attendanceRate',
      header: 'Rate',
      sortable: true,
      className: 'text-center',
      cell: r => (
        <span className={cn(
          'font-semibold tabular-nums',
          r.attendanceRate >= 80 ? 'text-emerald-600' : r.attendanceRate >= 60 ? 'text-amber-600' : 'text-red-600'
        )}>
          {r.attendanceRate}%
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label>Class</Label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>From</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1.5">
          <Label>To</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40" />
        </div>
      </div>

      {!isClassesLoading && classes.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 py-6">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            No classes are assigned to your account. Ask your administrator to set up class assignments.
          </p>
        </div>
      ) : !classId ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-20">
          <p className="text-sm text-muted-foreground">Select a class to view the attendance report</p>
        </div>
      ) : (
        <DataTable<AttendanceSummary>
          columns={columns}
          data={summary}
          keyExtractor={r => r.studentId}
          loading={isLoading}
        />
      )}
    </div>
  )
}
