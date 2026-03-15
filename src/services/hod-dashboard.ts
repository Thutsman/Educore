import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { supabase } from '@/lib/supabase'
import type { SubjectPerfPoint, AttendancePoint, TeacherPerfRow } from '@/services/dashboard'

export async function getPendingSchemeApprovals(schoolId: string): Promise<number> {
  const { count, error } = await supabase
    .from('scheme_books')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .is('hod_approved_at', null)
  if (error) return 0
  return count ?? 0
}

export interface DepartmentStats {
  totalStudents: number
  activeStudents: number
  attendanceRate: number // 0–100
  passRate: number       // 0–100
  atRiskCount: number
}

export interface DepartmentTeacherRow extends TeacherPerfRow {}

export interface DepartmentClassRow {
  classId: string
  className: string
  gradeLevel: number
  studentCount: number
  average: number        // average mark across department subjects
  attendanceRate: number // 0–100 over recent period
}

function n(v: unknown): number {
  const x = Number(v)
  return isNaN(x) ? 0 : x
}

export async function getDepartmentStats(
  schoolId: string,
  departmentId: string,
  passThreshold = 50
): Promise<DepartmentStats> {
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd   = format(endOfWeek(new Date(),   { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const [
    studentsRes,
    attendanceRes,
    gradesRes,
  ] = await Promise.allSettled([
    supabase
      .from('students')
      .select(`
        id,
        status,
        class:classes(department_id)
      `)
      .eq('school_id', schoolId)
      .is('deleted_at', null),

    supabase
      .from('attendance_records')
      .select(`
        status,
        date,
        class:classes(department_id)
      `)
      .eq('school_id', schoolId)
      .gte('date', weekStart)
      .lte('date', weekEnd),

    supabase
      .from('grades')
      .select(`
        student_id,
        marks_obtained,
        student:students!inner(
          class:classes(department_id)
        )
      `)
      .eq('school_id', schoolId)
      .not('marks_obtained', 'is', null),
  ])

  type RawStudent = {
    id: string
    status: string
    class: { department_id: string | null } | null
  }
  const students = (studentsRes.status === 'fulfilled'
    ? (studentsRes.value.data ?? [])
    : []) as RawStudent[]
  const deptStudents = students.filter(
    s => s.class?.department_id === departmentId
  )

  const totalStudents = deptStudents.length
  const activeStudents = deptStudents.filter(s => s.status === 'active').length

  type RawAttendance = {
    status: string
    date: string
    class: { department_id: string | null } | null
  }
  const attendance = (attendanceRes.status === 'fulfilled'
    ? (attendanceRes.value.data ?? [])
    : []) as RawAttendance[]

  const deptAttendance = attendance.filter(
    r => r.class?.department_id === departmentId
  )

  const presentCount = deptAttendance.filter(
    a => a.status === 'present' || a.status === 'late'
  ).length
  const uniqueDays = new Set(deptAttendance.map(a => a.date)).size
  const expectedTotal = activeStudents * uniqueDays
  const attendanceRate = expectedTotal > 0
    ? (presentCount / expectedTotal) * 100
    : 0

  type RawGrade = {
    student_id: string
    marks_obtained: unknown
    student: { class: { department_id: string | null } | null } | null
  }
  const grades = (gradesRes.status === 'fulfilled'
    ? (gradesRes.value.data ?? [])
    : []) as RawGrade[]

  const deptGrades = grades.filter(
    g => g.student?.class?.department_id === departmentId
  )

  const byStudent: Record<string, { sum: number; count: number }> = {}
  deptGrades.forEach(g => {
    const id = g.student_id
    if (!id) return
    if (!byStudent[id]) byStudent[id] = { sum: 0, count: 0 }
    byStudent[id].sum += n(g.marks_obtained)
    byStudent[id].count += 1
  })

  let passCount = 0
  Object.values(byStudent).forEach(({ sum, count }) => {
    if (count === 0) return
    const avg = sum / count
    if (avg >= passThreshold) passCount += 1
  })

  const denom = activeStudents || totalStudents
  const passRate = denom > 0 ? (passCount / denom) * 100 : 0

  const atRiskCount = Math.max(0, (denom || 0) - passCount)

  return {
    totalStudents,
    activeStudents,
    attendanceRate,
    passRate,
    atRiskCount,
  }
}

export async function getDepartmentSubjectPerformance(
  schoolId: string,
  departmentId: string
): Promise<SubjectPerfPoint[]> {
  const { data } = await supabase
    .from('grades')
    .select(`
      marks_obtained,
      exam:exams!inner(
        subject:subjects(id, name, department_id)
      )
    `)
    .eq('school_id', schoolId)
    .not('marks_obtained', 'is', null)

  if (!data?.length) return []

  type Raw = {
    marks_obtained: unknown
    exam: {
      subject: { id: string; name: string; department_id: string | null } | null
    } | null
  }

  const map: Record<string, { sum: number; count: number }> = {}

  ;(data as unknown as Raw[]).forEach(g => {
    const subject = g.exam?.subject
    if (!subject || subject.department_id !== departmentId) return
    const key = subject.name
    if (!map[key]) map[key] = { sum: 0, count: 0 }
    map[key].sum += n(g.marks_obtained)
    map[key].count += 1
  })

  return Object.entries(map)
    .map(([subject, { sum, count }]) => ({
      subject,
      average: count > 0 ? Math.round(sum / count) : 0,
    }))
    .sort((a, b) => b.average - a.average)
}

export async function getDepartmentAttendanceTrend(
  schoolId: string,
  departmentId: string,
  days = 30
): Promise<AttendancePoint[]> {
  const since = format(subDays(new Date(), days), 'yyyy-MM-dd')

  const { data } = await supabase
    .from('attendance_records')
    .select(`
      date,
      status,
      class:classes(department_id)
    `)
    .eq('school_id', schoolId)
    .gte('date', since)
    .order('date')

  if (!data?.length) return []

  type Raw = {
    date: string
    status: string
    class: { department_id: string | null } | null
  }

  const byDate: Record<string, { present: number; total: number }> = {}

  ;(data as unknown as Raw[]).forEach(r => {
    if (r.class?.department_id !== departmentId) return
    if (!byDate[r.date]) byDate[r.date] = { present: 0, total: 0 }
    byDate[r.date].total++
    if (r.status === 'present' || r.status === 'late') byDate[r.date].present++
  })

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { present, total }]) => ({
      date,
      rate: total > 0 ? Math.round((present / total) * 100) : 0,
    }))
}

export async function getDepartmentTeacherWorkload(
  schoolId: string,
  departmentId: string
): Promise<DepartmentTeacherRow[]> {
  const { data } = await supabase
    .from('teachers')
    .select(`
      employee_no,
      profile:profiles(full_name),
      teacher_subjects(subject_id, class_id)
    `)
    .eq('school_id', schoolId)
    .eq('department_id', departmentId)
    .eq('status', 'active')
    .is('deleted_at', null)

  if (!data?.length) return []

  type Raw = {
    employee_no: string
    profile: { full_name: string } | null
    teacher_subjects: { subject_id: string; class_id: string }[] | null
  }

  return (data as unknown as Raw[]).map(t => {
    const ts = t.teacher_subjects ?? []
    return {
      teacherName: t.profile?.full_name ?? '—',
      employeeNo: t.employee_no,
      classCount: new Set(ts.map(x => x.class_id)).size,
      subjectCount: new Set(ts.map(x => x.subject_id)).size,
    }
  })
}

export async function getDepartmentClassesOverview(
  schoolId: string,
  departmentId: string,
  days = 7
): Promise<DepartmentClassRow[]> {
  const since = format(subDays(new Date(), days), 'yyyy-MM-dd')

  const [classesRes, studentsRes, gradesRes, attendanceRes] = await Promise.allSettled([
    supabase
      .from('classes')
      .select('id, name, grade_level')
      .eq('school_id', schoolId)
      .eq('department_id', departmentId)
      .is('deleted_at', null),

    supabase
      .from('students')
      .select('id, class_id, status')
      .eq('school_id', schoolId)
      .is('deleted_at', null),

    supabase
      .from('grades')
      .select(`
        marks_obtained,
        student_id,
        student:students!inner(
          class_id,
          class:classes(department_id)
        )
      `)
      .eq('school_id', schoolId)
      .not('marks_obtained', 'is', null),

    supabase
      .from('attendance_records')
      .select('class_id, status, date')
      .eq('school_id', schoolId)
      .gte('date', since),
  ])

  type RawClass = { id: string; name: string; grade_level: number }
  const classes = (classesRes.status === 'fulfilled'
    ? (classesRes.value.data ?? [])
    : []) as RawClass[]

  if (!classes.length) return []

  const classIds = new Set(classes.map(c => c.id))

  type RawStudent = { id: string; class_id: string | null; status: string }
  const students = (studentsRes.status === 'fulfilled'
    ? (studentsRes.value.data ?? [])
    : []) as RawStudent[]

  const studentCounts: Record<string, number> = {}
  students.forEach(s => {
    if (!s.class_id || s.status !== 'active') return
    if (!classIds.has(s.class_id)) return
    studentCounts[s.class_id] = (studentCounts[s.class_id] ?? 0) + 1
  })

  type RawGrade = {
    marks_obtained: unknown
    student: { class_id: string | null; class: { department_id: string | null } | null } | null
  }
  const grades = (gradesRes.status === 'fulfilled'
    ? (gradesRes.value.data ?? [])
    : []) as RawGrade[]

  const marksByClass: Record<string, { sum: number; count: number }> = {}
  grades.forEach(g => {
    const cls = g.student?.class
    const classId = g.student?.class_id ?? null
    if (!classId || !cls || cls.department_id !== departmentId) return
    if (!classIds.has(classId)) return
    if (!marksByClass[classId]) marksByClass[classId] = { sum: 0, count: 0 }
    marksByClass[classId].sum += n(g.marks_obtained)
    marksByClass[classId].count += 1
  })

  type RawAtt = { class_id: string | null; status: string; date: string }
  const attendance = (attendanceRes.status === 'fulfilled'
    ? (attendanceRes.value.data ?? [])
    : []) as RawAtt[]

  const attByClass: Record<string, { present: number; total: number }> = {}
  attendance.forEach(r => {
    if (!r.class_id || !classIds.has(r.class_id)) return
    if (!attByClass[r.class_id]) attByClass[r.class_id] = { present: 0, total: 0 }
    attByClass[r.class_id].total++
    if (r.status === 'present' || r.status === 'late') {
      attByClass[r.class_id].present++
    }
  })

  return classes.map(c => {
    const studentsCount = studentCounts[c.id] ?? 0
    const marks = marksByClass[c.id]
    const avg = marks && marks.count > 0 ? Math.round(marks.sum / marks.count) : 0
    const att = attByClass[c.id]
    const attRate = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : 0

    return {
      classId: c.id,
      className: c.name,
      gradeLevel: c.grade_level,
      studentCount: studentsCount,
      average: avg,
      attendanceRate: attRate,
    }
  })
}

