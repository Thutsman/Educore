import { format, subDays } from 'date-fns'
import { supabase } from '@/lib/supabase'

function toISO(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

function n(v: unknown): number {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}

export interface ExecutiveClassOverviewFilters {
  academicYearId: string
  termId?: string | null
  attendanceLookbackDays?: number
}

export interface ExecutiveClassOverviewRow {
  classId: string
  className: string
  gradeLevel: number | null
  stream: string | null
  classTeacherName: string | null
  departmentName: string | null
  activePupils: number
  attendanceRate: number
  attendanceDaysRecorded: number
  avgMarkPercent: number | null
  passRatePercent: number | null
  gradeRowCount: number
  subjectAllocations: number
  schemeAwaitingHod: number
  schemeAwaitingFinal: number
  schemeFullyApproved: number
  assignmentsInTerm: number
  assignmentSubmissionRate: number | null
  assessmentAvgPercent: number | null
  assessmentMarkCount: number
}

/**
 * School-wide per-class snapshot for headmaster / deputy: attendance, exam results,
 * allocations, scheme books, assignments, assessments.
 */
export async function getExecutiveClassOverview(
  schoolId: string,
  filters: ExecutiveClassOverviewFilters,
): Promise<ExecutiveClassOverviewRow[]> {
  const lookback = filters.attendanceLookbackDays ?? 30
  const rangeEnd = new Date()
  const rangeStart = subDays(rangeEnd, lookback)
  const attFrom = toISO(rangeStart)
  const attTo = toISO(rangeEnd)

  let termStart: string | null = null
  let termEnd: string | null = null
  if (filters.termId) {
    const { data: termRow } = await supabase
      .from('terms')
      .select('start_date, end_date')
      .eq('id', filters.termId)
      .maybeSingle()
    type T = { start_date: string; end_date: string }
    const tr = termRow as unknown as T | null
    if (tr?.start_date && tr?.end_date) {
      termStart = tr.start_date
      termEnd = tr.end_date
    }
  }

  const { data: classRows, error: classErr } = await supabase
    .from('classes')
    .select(`
      id, name, grade_level, stream,
      class_teacher:teachers(profile:profiles(full_name)),
      department:departments(name)
    `)
    .eq('school_id', schoolId)
    .eq('academic_year_id', filters.academicYearId)
    .is('deleted_at', null)
    .order('name')

  if (classErr || !classRows?.length) return []

  type ClassRaw = {
    id: string
    name: string
    grade_level: number | null
    stream: string | null
    class_teacher: { profile: { full_name: string } | null } | null
    department: { name: string } | null
  }
  const classes = classRows as unknown as ClassRaw[]
  const classIds = classes.map(c => c.id)

  const [
    studentsRes,
    attRes,
    gradesRes,
    tsRes,
    schemeRes,
    assignRes,
    assessRes,
  ] = await Promise.all([
    supabase
      .from('students')
      .select('class_id')
      .eq('school_id', schoolId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .in('class_id', classIds),

    supabase
      .from('attendance_records')
      .select('class_id, date, status')
      .eq('school_id', schoolId)
      .gte('date', attFrom)
      .lte('date', attTo)
      .in('class_id', classIds),

    supabase
      .from('grades')
      .select(`
        marks_obtained,
        is_absent,
        exam:exams!inner(class_id, total_marks, pass_mark, academic_year_id, term_id, school_id)
      `)
      .eq('school_id', schoolId),

    supabase
      .from('teacher_subjects')
      .select('class_id, subject_id')
      .eq('academic_year_id', filters.academicYearId)
      .in('class_id', classIds),

    (() => {
      let q = supabase
        .from('scheme_books')
        .select('class_id, hod_approved_at, approved_at, term_id')
        .eq('school_id', schoolId)
        .in('class_id', classIds)
      if (filters.termId) q = q.eq('term_id', filters.termId)
      return q
    })(),

    (() => {
      let q = supabase
        .from('assignments')
        .select('id, class_id, due_date')
        .eq('school_id', schoolId)
        .in('class_id', classIds)
      if (termStart && termEnd) {
        q = q.gte('due_date', termStart).lte('due_date', termEnd)
      }
      return q
    })(),

    supabase
      .from('assessments')
      .select('id, class_id, date, total_marks')
      .in('class_id', classIds),
  ])

  const pupilsByClass: Record<string, number> = {}
  for (const cid of classIds) pupilsByClass[cid] = 0
  type Stu = { class_id: string | null }
  for (const s of (studentsRes.data ?? []) as Stu[]) {
    if (s.class_id && pupilsByClass[s.class_id] !== undefined) {
      pupilsByClass[s.class_id] += 1
    }
  }

  type AttRow = { class_id: string; date: string; status: string }
  const attByClass: Record<string, AttRow[]> = {}
  for (const cid of classIds) attByClass[cid] = []
  for (const r of (attRes.data ?? []) as AttRow[]) {
    if (attByClass[r.class_id]) attByClass[r.class_id].push(r)
  }

  type ExamMini = {
    class_id: string
    total_marks: number
    pass_mark: number
    academic_year_id: string
    term_id: string | null
  }
  type GradeRow = {
    marks_obtained: unknown
    is_absent: boolean
    exam: ExamMini
  }
  const gradesByClass: Record<string, GradeRow[]> = {}
  for (const cid of classIds) gradesByClass[cid] = []
  for (const g of (gradesRes.data ?? []) as GradeRow[]) {
    const ex = g.exam
    if (!ex || ex.academic_year_id !== filters.academicYearId) continue
    if (filters.termId && ex.term_id !== filters.termId) continue
    if (gradesByClass[ex.class_id]) gradesByClass[ex.class_id].push(g)
  }

  const subjectsByClass: Record<string, Set<string>> = {}
  for (const cid of classIds) subjectsByClass[cid] = new Set()
  type TsRow = { class_id: string; subject_id: string }
  for (const r of (tsRes.data ?? []) as TsRow[]) {
    subjectsByClass[r.class_id]?.add(r.subject_id)
  }

  const schemeByClass: Record<string, { hod: number; final: number; done: number }> = {}
  for (const cid of classIds) schemeByClass[cid] = { hod: 0, final: 0, done: 0 }
  type ScRow = { class_id: string; hod_approved_at: string | null; approved_at: string | null }
  for (const r of (schemeRes.data ?? []) as ScRow[]) {
    const b = schemeByClass[r.class_id]
    if (!b) continue
    if (r.approved_at) b.done++
    else if (r.hod_approved_at) b.final++
    else b.hod++
  }

  type AsgRow = { id: string; class_id: string; due_date: string }
  const assignments = (assignRes.data ?? []) as AsgRow[]
  const assignIds = assignments.map(a => a.id)
  const assignByClass: Record<string, AsgRow[]> = {}
  for (const cid of classIds) assignByClass[cid] = []
  for (const a of assignments) {
    assignByClass[a.class_id]?.push(a)
  }

  let submissionsByAssignment: Record<string, number> = {}
  if (assignIds.length > 0) {
    const chunk = 200
    for (let i = 0; i < assignIds.length; i += chunk) {
      const slice = assignIds.slice(i, i + chunk)
      const { data: subData } = await supabase
        .from('assignment_submissions')
        .select('assignment_id')
        .in('assignment_id', slice)
      type Sub = { assignment_id: string }
      for (const s of (subData ?? []) as Sub[]) {
        submissionsByAssignment[s.assignment_id] = (submissionsByAssignment[s.assignment_id] ?? 0) + 1
      }
    }
  }

  type AssRow = { id: string; class_id: string; date: string; total_marks: number }
  let assessments = (assessRes.data ?? []) as AssRow[]
  if (termStart && termEnd) {
    assessments = assessments.filter(a => a.date >= termStart && a.date <= termEnd)
  }
  const assessIds = assessments.map(a => a.id)
  const assessByClass: Record<string, AssRow[]> = {}
  for (const cid of classIds) assessByClass[cid] = []
  const assessTotalMarks: Record<string, number> = {}
  for (const a of assessments) {
    assessByClass[a.class_id]?.push(a)
    assessTotalMarks[a.id] = a.total_marks
  }

  const marksByAssessment: Record<string, { sumPct: number; count: number }> = {}
  if (assessIds.length > 0) {
    const chunk = 200
    for (let i = 0; i < assessIds.length; i += chunk) {
      const slice = assessIds.slice(i, i + chunk)
      const { data: markData } = await supabase
        .from('assessment_marks')
        .select('assessment_id, marks_obtained')
        .in('assessment_id', slice)
        .not('marks_obtained', 'is', null)
      type Mk = { assessment_id: string; marks_obtained: unknown }
      for (const m of (markData ?? []) as Mk[]) {
        const tm = assessTotalMarks[m.assessment_id] ?? 0
        if (tm <= 0) continue
        const pct = (n(m.marks_obtained) / tm) * 100
        if (!marksByAssessment[m.assessment_id]) marksByAssessment[m.assessment_id] = { sumPct: 0, count: 0 }
        marksByAssessment[m.assessment_id].sumPct += pct
        marksByAssessment[m.assessment_id].count += 1
      }
    }
  }

  return classes.map((c) => {
    const pupils = pupilsByClass[c.id] ?? 0
    const attRows = attByClass[c.id] ?? []
    const uniqueDays = new Set(attRows.map(r => r.date)).size
    const presentOrLate = attRows.filter(r => r.status === 'present' || r.status === 'late').length
    const attDenom = pupils * uniqueDays
    const attendanceRate = attDenom > 0 ? Math.round((presentOrLate / attDenom) * 1000) / 10 : 0

    const gRows = gradesByClass[c.id] ?? []
    let sumPct = 0
    let pctCount = 0
    let passCount = 0
    let passDenom = 0
    for (const g of gRows) {
      const ex = g.exam
      const tm = ex.total_marks
      if (tm <= 0) continue
      const mo = g.marks_obtained
      if (mo === null || mo === undefined || g.is_absent) continue
      const mark = n(mo)
      sumPct += (mark / tm) * 100
      pctCount += 1
      passDenom += 1
      if (mark >= n(ex.pass_mark)) passCount += 1
    }
    const avgMarkPercent = pctCount > 0 ? Math.round((sumPct / pctCount) * 10) / 10 : null
    const passRatePercent = passDenom > 0 ? Math.round((passCount / passDenom) * 1000) / 10 : null

    const sch = schemeByClass[c.id] ?? { hod: 0, final: 0, done: 0 }
    const asgs = assignByClass[c.id] ?? []
    let subTotal = 0
    for (const a of asgs) {
      subTotal += submissionsByAssignment[a.id] ?? 0
    }
    const assignmentSubmissionRate =
      asgs.length > 0 && pupils > 0
        ? Math.min(100, Math.round((subTotal / (asgs.length * pupils)) * 1000) / 10)
        : null

    const classAssess = assessByClass[c.id] ?? []
    let asSum = 0
    let asCnt = 0
    for (const a of classAssess) {
      const agg = marksByAssessment[a.id]
      if (agg && agg.count > 0) {
        asSum += agg.sumPct / agg.count
        asCnt += 1
      }
    }
    const assessmentAvgPercent = asCnt > 0 ? Math.round((asSum / asCnt) * 10) / 10 : null
    let assessmentMarkCount = 0
    for (const a of classAssess) {
      assessmentMarkCount += marksByAssessment[a.id]?.count ?? 0
    }

    return {
      classId: c.id,
      className: c.name,
      gradeLevel: c.grade_level,
      stream: c.stream,
      classTeacherName: c.class_teacher?.profile?.full_name ?? null,
      departmentName: c.department?.name ?? null,
      activePupils: pupils,
      attendanceRate,
      attendanceDaysRecorded: uniqueDays,
      avgMarkPercent,
      passRatePercent,
      gradeRowCount: pctCount,
      subjectAllocations: subjectsByClass[c.id]?.size ?? 0,
      schemeAwaitingHod: sch.hod,
      schemeAwaitingFinal: sch.final,
      schemeFullyApproved: sch.done,
      assignmentsInTerm: asgs.length,
      assignmentSubmissionRate,
      assessmentAvgPercent,
      assessmentMarkCount,
    }
  })
}
