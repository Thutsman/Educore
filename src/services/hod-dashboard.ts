import { format, subDays, startOfWeek, endOfWeek, addDays } from 'date-fns'
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

// ─── Actionable HOD KPIs (new redesign) ───────────────────────────────────────

export interface HodPassRateVsSchool {
  deptAvg: number // 0–100
  schoolAvg: number // 0–100
}

export interface HodAttendanceTrend {
  thisWeek: number // 0–100
  lastWeek: number // 0–100
}

export interface HodUpcomingAssessmentRow {
  id: string
  subject: string
  className: string
  date: string // yyyy-MM-dd
}

export interface HodTeacherLessonPlanStatusRow {
  teacherId: string
  teacherName: string
  employeeNo: string
  submitted: boolean
}

export type HodActivityKind = 'scheme_book' | 'assessment_result' | 'at_risk' | 'lesson_plan'

export interface HodActivityItem {
  id: string
  kind: HodActivityKind
  description: string
  occurredAt: string // ISO timestamp
}

const PASS_THRESHOLD = 50

// Supabase's auto-generated types in this repo currently only cover a subset
// of tables. Cast to `any` so read queries don't get inferred as `never`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

async function getCurrentAcademicYearId(schoolId: string): Promise<string | null> {
  const { data, error } = await db
    .from('academic_years')
    .select('id')
    .eq('school_id', schoolId)
    .eq('is_current', true)
    .maybeSingle()

  if (error || !data?.id) return null
  return data.id as string
}

async function getCurrentTermId(schoolId: string): Promise<string | null> {
  const academicYearId = await getCurrentAcademicYearId(schoolId)
  if (!academicYearId) return null

  const { data, error } = await db
    .from('terms')
    .select('id')
    .eq('academic_year_id', academicYearId)
    .eq('is_current', true)
    .maybeSingle()

  if (error || !data?.id) return null
  return data.id as string
}

async function getDepartmentClassIds(schoolId: string, departmentId: string): Promise<string[]> {
  const { data, error } = await db
    .from('classes')
    .select('id')
    .eq('school_id', schoolId)
    .eq('department_id', departmentId)
    .is('deleted_at', null)

  if (error || !data) return []
  return (data as unknown as { id: string }[]).map(r => r.id)
}

type LatestExamWindow = { examIds: string[]; latestDate: string } // latestDate is yyyy-MM-dd (from exam_date or created_at::date)

async function getLatestExamWindowForDepartment(
  schoolId: string,
  termId: string,
  classIds: string[]
): Promise<LatestExamWindow | null> {
  if (!classIds.length) return null

  const { data, error } = await db
    .from('exams')
    .select('id, exam_date, created_at')
    .eq('school_id', schoolId)
    .eq('term_id', termId)
    .in('class_id', classIds)

  if (error || !data?.length) return null

  const normalized = (data as unknown as { id: string; exam_date: string | null; created_at: string }[]).map(r => {
    const dt = r.exam_date ? new Date(r.exam_date) : new Date(r.created_at)
    return { ...r, dateKey: format(dt, 'yyyy-MM-dd') }
  })

  const latestDate = normalized.reduce((acc, r) => (r.dateKey > acc ? r.dateKey : acc), normalized[0]?.dateKey ?? format(new Date(), 'yyyy-MM-dd'))
  const examIds = normalized.filter(r => r.dateKey === latestDate).map(r => r.id)
  return { examIds, latestDate }
}

function nPercent(marksObtained: unknown, totalMarks: unknown): number {
  const m = Number(marksObtained)
  const t = Number(totalMarks)
  if (!isFinite(m) || !isFinite(t) || t <= 0) return 0
  return (m / t) * 100
}

async function getAttendanceRateForRange(
  schoolId: string,
  classIds: string[],
  activeStudentCount: number,
  rangeStart: string,
  rangeEnd: string
): Promise<number> {
  if (!activeStudentCount || !classIds.length) return 0

  const { data, error } = await db
    .from('attendance_records')
    .select('status, date')
    .eq('school_id', schoolId)
    .in('class_id', classIds)
    .gte('date', rangeStart)
    .lte('date', rangeEnd)

  if (error || !data) return 0

  const rows = data as unknown as { status: string; date: string }[]
  const uniqueDaysRecorded = new Set(rows.map(r => r.date)).size
  if (!uniqueDaysRecorded) return 0

  const presentOrLateCount = rows.filter(r => r.status === 'present' || r.status === 'late').length
  const expectedTotal = activeStudentCount * uniqueDaysRecorded
  return expectedTotal > 0 ? (presentOrLateCount / expectedTotal) * 100 : 0
}

export async function getHodPassRateVsSchool(
  schoolId: string,
  departmentId: string
): Promise<HodPassRateVsSchool> {
  // Requires DB-side aggregate to bypass HOD RLS for school-wide grades.
  const { data, error } = await db.rpc('get_hod_pass_rate_vs_school', {
    school_id: schoolId,
    department_id: departmentId,
  })

  if (error || !data) return { deptAvg: 0, schoolAvg: 0 }

  const row = Array.isArray(data) ? data[0] : data
  const deptAvg = Number((row as { dept_avg?: unknown; deptAvg?: unknown }).dept_avg ?? (row as { deptAvg?: unknown }).deptAvg ?? 0)
  const schoolAvg = Number((row as { school_avg?: unknown; schoolAvg?: unknown }).school_avg ?? (row as { schoolAvg?: unknown }).schoolAvg ?? 0)

  return { deptAvg: isFinite(deptAvg) ? deptAvg : 0, schoolAvg: isFinite(schoolAvg) ? schoolAvg : 0 }
}

export async function getHodAttendanceTrend(
  schoolId: string,
  departmentId: string
): Promise<HodAttendanceTrend> {
  const classIds = await getDepartmentClassIds(schoolId, departmentId)
  if (!classIds.length) return { thisWeek: 0, lastWeek: 0 }

  const { data: students } = await db
    .from('students')
    .select('id')
    .eq('school_id', schoolId)
    .in('class_id', classIds)
    .eq('status', 'active')
    .is('deleted_at', null)

  const activeStudentCount = (students as unknown as { id: string }[] | null)?.length ?? 0
  if (!activeStudentCount) return { thisWeek: 0, lastWeek: 0 }

  const now = new Date()
  const thisWeekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const thisWeekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const lastWeekAnchor = subDays(now, 7)
  const lastWeekStart = format(startOfWeek(lastWeekAnchor, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const lastWeekEnd = format(endOfWeek(lastWeekAnchor, { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const [thisWeek, lastWeek] = await Promise.all([
    getAttendanceRateForRange(schoolId, classIds, activeStudentCount, thisWeekStart, thisWeekEnd),
    getAttendanceRateForRange(schoolId, classIds, activeStudentCount, lastWeekStart, lastWeekEnd),
  ])

  return { thisWeek, lastWeek }
}

export async function getHodAtRiskCount(
  schoolId: string,
  departmentId: string
): Promise<number> {
  const termId = await getCurrentTermId(schoolId)
  if (!termId) return 0

  const classIds = await getDepartmentClassIds(schoolId, departmentId)
  if (!classIds.length) return 0

  const latestWindow = await getLatestExamWindowForDepartment(schoolId, termId, classIds)
  if (!latestWindow?.examIds.length) return 0

  const { data: studentRows } = await supabase
    .from('students')
    .select('id, status')
    .eq('school_id', schoolId)
    .in('class_id', classIds)
    .is('deleted_at', null)

  const students = (studentRows as unknown as { id: string; status: string }[] | null) ?? []
  const activeStudentIds = students.filter(s => s.status === 'active').map(s => s.id)
  const denomIds = activeStudentIds.length ? activeStudentIds : students.map(s => s.id)

  if (!denomIds.length) return 0

  const { data: grades } = await supabase
    .from('grades')
    .select(`
      student_id,
      marks_obtained,
      exam:exams(total_marks)
    `)
    .eq('school_id', schoolId)
    .in('exam_id', latestWindow.examIds)
    .not('marks_obtained', 'is', null)

  if (!grades?.length) {
    // No latest assessment data => everything in denom is effectively "at-risk" in the existing dashboard logic.
    return denomIds.length
  }

  type RawGrade = {
    student_id: string
    marks_obtained: unknown
    exam: { total_marks: unknown } | null
  }
  const gradeRows = grades as unknown as RawGrade[]

  const byStudent: Record<string, { sum: number; count: number }> = {}
  gradeRows.forEach(g => {
    if (!g.exam?.total_marks) return
    const pct = nPercent(g.marks_obtained, g.exam.total_marks)
    if (!byStudent[g.student_id]) byStudent[g.student_id] = { sum: 0, count: 0 }
    byStudent[g.student_id].sum += pct
    byStudent[g.student_id].count += 1
  })

  let atRisk = 0
  for (const sid of denomIds) {
    const entry = byStudent[sid]
    const avg = entry && entry.count > 0 ? entry.sum / entry.count : null
    if (avg == null || avg < PASS_THRESHOLD) atRisk++
  }
  return atRisk
}

export async function getHodSchemeCompliance(
  schoolId: string,
  departmentId: string,
  termIdOverride?: string
): Promise<{ submitted: number; total: number }> {
  const termId = termIdOverride ?? await getCurrentTermId(schoolId)
  if (!termId) return { submitted: 0, total: 0 }

  const { data: teacherRows } = await supabase
    .from('teachers')
    .select('id')
    .eq('school_id', schoolId)
    .eq('department_id', departmentId)
    .eq('status', 'active')
    .is('deleted_at', null)

  const teacherIds = (teacherRows as unknown as { id: string }[] | null)?.map(r => r.id) ?? []
  const total = teacherIds.length
  if (!total) return { submitted: 0, total: 0 }

  const { data: schemeRows } = await supabase
    .from('scheme_books')
    .select('teacher_id')
    .eq('school_id', schoolId)
    .eq('term_id', termId)
    .in('teacher_id', teacherIds)

  const submitted = new Set((schemeRows as unknown as { teacher_id: string }[] | null)?.map(r => r.teacher_id) ?? []).size
  return { submitted, total }
}

export async function getHodSubjectPerformance(
  schoolId: string,
  departmentId: string
): Promise<Array<{ subject: string; average: number }>> {
  const termId = await getCurrentTermId(schoolId)
  if (!termId) return []

  const classIds = await getDepartmentClassIds(schoolId, departmentId)
  if (!classIds.length) return []

  const latestWindow = await getLatestExamWindowForDepartment(schoolId, termId, classIds)
  if (!latestWindow?.examIds.length) return []

  const { data: grades } = await supabase
    .from('grades')
    .select(`
      marks_obtained,
      exam:exams(total_marks, subject:subjects(name, department_id))
    `)
    .eq('school_id', schoolId)
    .in('exam_id', latestWindow.examIds)
    .not('marks_obtained', 'is', null)

  if (!grades?.length) return []

  type RawGrade = {
    marks_obtained: unknown
    exam: { total_marks: unknown; subject: { name: string; department_id: string | null } | null } | null
  }

  const rows = grades as unknown as RawGrade[]
  const map: Record<string, { sum: number; count: number }> = {}

  rows.forEach(g => {
    const subject = g.exam?.subject
    if (!subject || subject.department_id !== departmentId) return
    const pct = nPercent(g.marks_obtained, g.exam?.total_marks ?? 0)
    if (!map[subject.name]) map[subject.name] = { sum: 0, count: 0 }
    map[subject.name].sum += pct
    map[subject.name].count += 1
  })

  return Object.entries(map)
    .map(([subject, { sum, count }]) => ({
      subject,
      average: count > 0 ? Math.round(sum / count) : 0,
    }))
    .sort((a, b) => b.average - a.average)
}

export async function getHodUpcomingAssessments(
  schoolId: string,
  departmentId: string
): Promise<HodUpcomingAssessmentRow[]> {
  const today = format(new Date(), 'yyyy-MM-dd')
  const end = format(addDays(new Date(), 14), 'yyyy-MM-dd')

  const classIds = await getDepartmentClassIds(schoolId, departmentId)
  if (!classIds.length) return []

  const { data, error } = await supabase
    .from('assessments')
    .select(`
      id, subject:subjects(name), class:classes(name), date
    `)
    .eq('school_id', schoolId)
    .in('class_id', classIds)
    .gte('date', today)
    .lte('date', end)
    .order('date', { ascending: true })
    .limit(6)

  if (error || !data) return []

  type Row = { id: string; date: string; subject: { name: string } | null; class: { name: string } | null }
  return (data as unknown as Row[]).map(r => ({
    id: r.id,
    subject: r.subject?.name ?? '—',
    className: r.class?.name ?? '—',
    date: r.date,
  }))
}

export async function getHodTeacherLessonPlanStatus(
  schoolId: string,
  departmentId: string
): Promise<HodTeacherLessonPlanStatusRow[]> {
  const now = new Date()
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const classIds = await getDepartmentClassIds(schoolId, departmentId)
  if (!classIds.length) return []

  const { data: teacherRows } = await supabase
    .from('teachers')
    .select(`
      id, employee_no,
      teacher_profile:profiles(full_name)
    `)
    .eq('school_id', schoolId)
    .eq('department_id', departmentId)
    .eq('status', 'active')
    .is('deleted_at', null)

  const teachers = (teacherRows as unknown as { id: string; employee_no: string; teacher_profile?: { full_name: string } | null }[] | null) ?? []

  if (!teachers.length) return []

  const { data: lpRows } = await supabase
    .from('lesson_plans')
    .select('teacher_id')
    .eq('school_id', schoolId)
    .in('class_id', classIds)
    .gte('date', weekStart)
    .lte('date', weekEnd)

  const submittedTeacherIds = new Set((lpRows as unknown as { teacher_id: string }[] | null)?.map(r => r.teacher_id) ?? [])

  return teachers.map(t => ({
    teacherId: t.id,
    teacherName: t.teacher_profile?.full_name ?? '—',
    employeeNo: t.employee_no,
    submitted: submittedTeacherIds.has(t.id),
  }))
}

export async function getHodActivityFeed(
  schoolId: string,
  departmentId: string
): Promise<HodActivityItem[]> {
  const sinceTs = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const classIds = await getDepartmentClassIds(schoolId, departmentId)
  if (!classIds.length) return []

  // Scheme book submissions
  const { data: schemeRows } = await supabase
    .from('scheme_books')
    .select('id, created_at, teacher:teachers(profile:profiles(full_name))')
    .eq('school_id', schoolId)
    .in('class_id', classIds)
    .gte('created_at', sinceTs)

  const schemeItems: HodActivityItem[] = (schemeRows as unknown as { id: string; created_at: string; teacher: { profile: { full_name: string } | null } | null }[] | null)?.map(r => ({
    id: `scheme-${r.id}`,
    kind: 'scheme_book',
    description: `${r.teacher?.profile?.full_name ?? 'A teacher'} submitted a scheme book`,
    occurredAt: r.created_at,
  })) ?? []

  // Assessment result captured (based on grade creation timestamps)
  // This avoids relying on `assessment_marks` SELECT policies that may not be department-scoped for HODs.
  const { data: recentGradeRows } = await supabase
    .from('grades')
    .select('exam_id, created_at, exam:exams(subject:subjects(name), class:classes(name))')
    .eq('school_id', schoolId)
    .gte('created_at', sinceTs)
    .not('marks_obtained', 'is', null)

  type RecentGradeRow = {
    exam_id: string
    created_at: string
    exam: { subject: { name: string } | null; class: { name: string } | null } | null
  }

  const examGroups: Record<string, { maxAt: string; subject?: string; className?: string }> = {}
  ;((recentGradeRows as unknown as RecentGradeRow[] | null) ?? []).forEach(r => {
    const subjectName = r.exam?.subject?.name ?? '—'
    const className = r.exam?.class?.name ?? '—'
    const existing = examGroups[r.exam_id]
    if (!existing || r.created_at > existing.maxAt) {
      examGroups[r.exam_id] = { maxAt: r.created_at, subject: subjectName, className }
    }
  })

  const assessmentItems: HodActivityItem[] = Object.entries(examGroups).map(([examId, g]) => ({
    id: `assessment-${examId}`,
    kind: 'assessment_result',
    description: `Results captured for ${g.subject ?? '—'} · ${g.className ?? '—'}`,
    occurredAt: g.maxAt,
  }))

  // At-risk flagged (latest exam window in current term, only if within last 7 days)
  const termId = await getCurrentTermId(schoolId)
  const atRiskItems: HodActivityItem[] = []
  if (termId) {
    const latestWindow = await getLatestExamWindowForDepartment(schoolId, termId, classIds)
    if (latestWindow?.latestDate) {
      const latestDateObj = new Date(`${latestWindow.latestDate}T00:00:00Z`)
      const sinceDate = new Date(sinceTs)
      if (latestDateObj.getTime() >= sinceDate.getTime()) {
        const { data: gradesRows } = await supabase
          .from('grades')
          .select(`
            student_id,
            marks_obtained,
            created_at,
            exam:exams(total_marks, subject:subjects(name, department_id))
          `)
          .eq('school_id', schoolId)
          .in('exam_id', latestWindow.examIds)
          .not('marks_obtained', 'is', null)

        type GradeRow = {
          student_id: string
          marks_obtained: unknown
          created_at: string
          exam: { total_marks: unknown; subject: { name: string; department_id: string | null } | null } | null
        }

        const rows = (gradesRows as unknown as GradeRow[] | null) ?? []

        const map: Record<
          string,
          { byStudent: Record<string, { sum: number; count: number }>; maxCreatedAt: string }
        > = {}

        rows.forEach(r => {
          const subject = r.exam?.subject
          if (!subject || subject.department_id !== departmentId) return
          const subjectName = subject.name
          if (!map[subjectName]) map[subjectName] = { byStudent: {}, maxCreatedAt: r.created_at }
          map[subjectName].maxCreatedAt = r.created_at > map[subjectName].maxCreatedAt ? r.created_at : map[subjectName].maxCreatedAt

          const pct = nPercent(r.marks_obtained, r.exam?.total_marks ?? 0)
          const studentAgg = map[subjectName].byStudent[r.student_id] ?? { sum: 0, count: 0 }
          studentAgg.sum += pct
          studentAgg.count += 1
          map[subjectName].byStudent[r.student_id] = studentAgg
        })

        for (const [subjectName, v] of Object.entries(map)) {
          let count = 0
          for (const studentAgg of Object.values(v.byStudent)) {
            const avg = studentAgg.count > 0 ? studentAgg.sum / studentAgg.count : null
            if (avg == null || avg < PASS_THRESHOLD) count++
          }
          if (count > 0) {
            atRiskItems.push({
              id: `at-risk-${subjectName}-${v.maxCreatedAt}`,
              kind: 'at_risk',
              description: `${count} learner(s) flagged as at-risk in ${subjectName}`,
              occurredAt: v.maxCreatedAt,
            })
          }
        }
      }
    }
  }

  // Lesson plan submissions (group by teacher + week)
  const { data: lpRows } = await supabase
    .from('lesson_plans')
    .select('teacher_id, date, created_at, teacher:teachers(profile:profiles(full_name))')
    .eq('school_id', schoolId)
    .in('class_id', classIds)
    .gte('created_at', sinceTs)

  type LPRaw = {
    teacher_id: string
    date: string
    created_at: string
    teacher: { profile: { full_name: string } | null } | null
  }

  const lpGroups: Record<string, { maxAt: string; teacherName: string; weekStart: string }> = {}
  ;((lpRows as unknown as LPRaw[] | null) ?? []).forEach(r => {
    const d = new Date(r.date)
    const weekStart = format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const key = `${r.teacher_id}-${weekStart}`
    const existing = lpGroups[key]
    const teacherName = r.teacher?.profile?.full_name ?? 'A teacher'
    if (!existing || r.created_at > existing.maxAt) {
      lpGroups[key] = { maxAt: r.created_at, teacherName, weekStart }
    }
  })

  const lessonPlanItems: HodActivityItem[] = Object.entries(lpGroups).map(([key, g]) => ({
    id: `lesson-${key}`,
    kind: 'lesson_plan',
    description: `${g.teacherName} submitted lesson plan for week of ${g.weekStart}`,
    occurredAt: g.maxAt,
  }))

  const all = [...schemeItems, ...assessmentItems, ...atRiskItems, ...lessonPlanItems]
  all.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
  return all.slice(0, 8)
}

