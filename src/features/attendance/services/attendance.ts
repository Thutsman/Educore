import { supabase } from '@/lib/supabase'
import type { AttendanceRecord, AttendanceSummary, AttendanceStatus } from '../types'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ─── Fetch records for a class on a specific date ────────────────────────────
export async function getAttendanceForDate(classId: string, date: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('id, student_id, class_id, date, status, reason, student:students(full_name, admission_no)')
    .eq('class_id', classId)
    .eq('date', date)

  if (error || !data) return []

  type Raw = { id: string; student_id: string; class_id: string; date: string; status: string; reason: string | null; student: { full_name: string; admission_no: string } | null }
  return (data as unknown as Raw[]).map(r => ({
    id: r.id,
    student_id: r.student_id,
    student_name: r.student?.full_name ?? '—',
    admission_number: r.student?.admission_no ?? '—',
    class_id: r.class_id,
    date: r.date,
    status: r.status as AttendanceStatus,
    remarks: r.reason,
  }))
}

// ─── Upsert a single attendance record ───────────────────────────────────────
export async function upsertAttendance(
  studentId: string, classId: string, date: string, status: AttendanceStatus, remarks?: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { error } = await db.from('attendance_records').upsert(
    { student_id: studentId, class_id: classId, date, period: 'full_day', status, reason: remarks || null, marked_by: user.id },
    { onConflict: 'student_id,date,period' }
  )
  return !error
}

// ─── Batch upsert (save all for a class/date) ────────────────────────────────
export async function batchUpsertAttendance(
  records: Array<{ studentId: string; classId: string; date: string; status: AttendanceStatus; remarks?: string }>
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { error } = await db.from('attendance_records').upsert(
    records.map(r => ({ student_id: r.studentId, class_id: r.classId, date: r.date, period: 'full_day', status: r.status, reason: r.remarks || null, marked_by: user.id })),
    { onConflict: 'student_id,date,period' }
  )
  return !error
}

// ─── Summary for a class over a date range ───────────────────────────────────
export async function getClassAttendanceSummary(
  classId: string, startDate: string, endDate: string
): Promise<AttendanceSummary[]> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('student_id, status, student:students(full_name, admission_no)')
    .eq('class_id', classId)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error || !data) return []

  type Raw = { student_id: string; status: string; student: { full_name: string; admission_no: string } | null }
  const rows = data as unknown as Raw[]

  const map = new Map<string, AttendanceSummary>()
  rows.forEach(r => {
    if (!map.has(r.student_id)) {
      map.set(r.student_id, {
        studentId: r.student_id,
        studentName: r.student?.full_name ?? '—',
        admissionNumber: r.student?.admission_no ?? '—',
        present: 0, absent: 0, late: 0, excused: 0, total: 0, attendanceRate: 0,
      })
    }
    const s = map.get(r.student_id)!
    s.total++
    if (r.status === 'present') s.present++
    else if (r.status === 'absent') s.absent++
    else if (r.status === 'late') s.late++
    else if (r.status === 'excused') s.excused++
  })

  return Array.from(map.values()).map(s => ({
    ...s,
    attendanceRate: s.total > 0 ? Math.round(((s.present + s.late) / s.total) * 100 * 10) / 10 : 0,
  }))
}

// ─── Class list (reused) ──────────────────────────────────────────────────────
export async function getClassesForAttendance(schoolId: string): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('name')
  if (error || !data) return []
  type Raw = { id: string; name: string }
  return (data as unknown as Raw[]).map(r => ({ id: r.id, name: r.name }))
}

// ─── Students for a class (for mark sheet) ───────────────────────────────────
export async function getStudentsForClass(classId: string): Promise<{ id: string; full_name: string; admission_number: string }[]> {
  const { data, error } = await supabase
    .from('students')
    .select('id, full_name, admission_no')
    .eq('class_id', classId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('full_name')
  if (error || !data) return []
  type Raw = { id: string; full_name: string; admission_no: string }
  return (data as unknown as Raw[]).map(r => ({ id: r.id, full_name: r.full_name, admission_number: r.admission_no }))
}
