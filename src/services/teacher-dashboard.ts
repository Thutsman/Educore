import { format, subDays, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TeacherRecord {
  id: string
  employee_no: string
  department_id: string | null
  specialization: string | null
  qualification: string | null
}

export interface HomeroomClass {
  id: string
  name: string
  grade_level: number
  room: string | null
  capacity: number
  student_count: number
}

export interface TeacherSubjectRow {
  id: string
  subject_id: string
  subject_name: string
  class_id: string
  class_name: string
  grade_level: number
}

export interface AttendanceSummary {
  present: number
  absent: number
  late: number
  excused: number
  total: number
  rate: number   // 0–100
  marked: boolean // whether any records exist for today
}

export interface AttendanceTrendPoint {
  date: string
  rate: number
  present: number
  total: number
}

export interface TeacherExamRow {
  id: string
  name: string
  exam_type: string
  exam_date: string | null
  total_marks: number
  subject_name: string
  class_name: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function n(v: unknown): number {
  const x = Number(v)
  return isNaN(x) ? 0 : x
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** Look up the teachers row for the currently-logged-in user. */
export async function getTeacherByProfile(schoolId: string, profileId: string): Promise<TeacherRecord | null> {
  const { data, error } = await supabase
    .from('teachers')
    .select('id, employee_no, department_id, specialization, qualification')
    .eq('school_id', schoolId)
    .eq('profile_id', profileId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) return null
  return data as unknown as TeacherRecord
}

/** Get the homeroom class assigned to this teacher (class_teacher_id). */
export async function getHomeroomClass(schoolId: string, teacherId: string): Promise<HomeroomClass | null> {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, grade_level, room, capacity')
    .eq('school_id', schoolId)
    .eq('class_teacher_id', teacherId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) return null

  type RawClass = { id: string; name: string; grade_level: number; room: string | null; capacity: number }
  const raw = data as unknown as RawClass

  const { count } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('class_id', raw.id)
    .eq('status', 'active')
    .is('deleted_at', null)

  return { ...raw, student_count: count ?? 0 }
}

/** All subject→class assignments for this teacher (current academic year). */
export async function getTeacherSubjects(_schoolId: string, teacherId: string): Promise<TeacherSubjectRow[]> {
  const { data, error } = await supabase
    .from('teacher_subjects')
    .select(`
      id, subject_id, class_id,
      subject:subjects(name),
      class:classes(name, grade_level)
    `)
    .eq('teacher_id', teacherId)

  if (error || !data) return []

  type Raw = {
    id: string
    subject_id: string
    class_id: string
    subject: { name: string } | null
    class: { name: string; grade_level: number } | null
  }

  return (data as unknown as Raw[]).map(r => ({
    id: r.id,
    subject_id: r.subject_id,
    subject_name: r.subject?.name ?? '—',
    class_id: r.class_id,
    class_name: r.class?.name ?? '—',
    grade_level: r.class?.grade_level ?? 0,
  }))
}

/** Today's attendance breakdown for the homeroom class. */
export async function getTodayAttendance(schoolId: string, classId: string): Promise<AttendanceSummary> {
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('attendance_records')
    .select('status')
    .eq('school_id', schoolId)
    .eq('class_id', classId)
    .eq('date', today)

  if (error || !data) {
    return { present: 0, absent: 0, late: 0, excused: 0, total: 0, rate: 0, marked: false }
  }

  type Raw = { status: string }
  const records = data as unknown as Raw[]
  const present  = records.filter(r => r.status === 'present').length
  const absent   = records.filter(r => r.status === 'absent').length
  const late     = records.filter(r => r.status === 'late').length
  const excused  = records.filter(r => r.status === 'excused').length
  const total    = records.length
  const rate     = total > 0 ? Math.round(((present + late) / total) * 100) : 0

  return { present, absent, late, excused, total, rate, marked: total > 0 }
}

/** Daily attendance rate for this class over the last N days. */
export async function getClassAttendanceTrend(
  schoolId: string,
  classId: string,
  days = 30
): Promise<AttendanceTrendPoint[]> {
  const since = format(subDays(new Date(), days), 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('attendance_records')
    .select('date, status')
    .eq('school_id', schoolId)
    .eq('class_id', classId)
    .gte('date', since)
    .order('date')

  if (error || !data?.length) return []

  const byDate: Record<string, { present: number; total: number }> = {}

  type Raw = { date: string; status: string }
  ;(data as unknown as Raw[]).forEach(r => {
    if (!byDate[r.date]) byDate[r.date] = { present: 0, total: 0 }
    byDate[r.date].total++
    if (r.status === 'present' || r.status === 'late') byDate[r.date].present++
  })

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { present, total }]) => ({
      date:    format(parseISO(date), 'dd MMM'),
      rate:    total > 0 ? Math.round((present / total) * 100) : 0,
      present,
      total,
    }))
}

/** Recent exams for any class this teacher teaches. */
export async function getTeacherRecentExams(schoolId: string, classIds: string[]): Promise<TeacherExamRow[]> {
  if (!classIds.length) return []

  const { data, error } = await supabase
    .from('exams')
    .select(`
      id, name, exam_type, exam_date, total_marks,
      subject:subjects(name),
      class:classes(name)
    `)
    .eq('school_id', schoolId)
    .in('class_id', classIds)
    .order('exam_date', { ascending: false })
    .limit(8)

  if (error || !data) return []

  type Raw = {
    id: string; name: string; exam_type: string; exam_date: string | null
    total_marks: number; subject: { name: string } | null; class: { name: string } | null
  }

  return (data as unknown as Raw[]).map(e => ({
    id:           e.id,
    name:         e.name,
    exam_type:    e.exam_type,
    exam_date:    e.exam_date,
    total_marks:  n(e.total_marks),
    subject_name: e.subject?.name ?? '—',
    class_name:   e.class?.name   ?? '—',
  }))
}
