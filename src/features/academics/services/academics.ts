import { supabase } from '@/lib/supabase'
import type { Department, AcademicClass, Subject, Exam, Grade, AcademicYear, Term, EnrolledStudent, TermCalendarEvent, TermCalendarEventType } from '../types'

// Bypass generic Database placeholder for write operations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const maybe = error as { code?: string; message?: string; details?: string; hint?: string }
  if (maybe.code === '42703') return true
  const text = `${maybe.message ?? ''} ${maybe.details ?? ''} ${maybe.hint ?? ''}`.toLowerCase()
  return text.includes('column') && text.includes('does not exist')
}

function getLetterGrade(pct: number): string {
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  return 'F'
}

// ─── Departments ─────────────────────────────────────────────────────────────

export async function getDepartments(schoolId: string): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name, code')
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('name')
  if (error || !data) return []
  return data as unknown as Department[]
}

export async function createDepartment(schoolId: string, d: { name: string; code?: string }): Promise<string | null> {
  const { data, error } = await db.from('departments').insert({
    name: d.name,
    code: d.code || null,
    school_id: schoolId,
  }).select('id').single()
  if (error || !data?.id) return null
  return data.id as string
}

export async function updateDepartment(id: string, d: Partial<{ name: string; code: string }>): Promise<boolean> {
  const { error } = await db.from('departments').update(d).eq('id', id)
  return !error
}

export async function setDepartmentSubjects(
  schoolId: string,
  departmentId: string,
  subjectIds: string[],
): Promise<boolean> {
  const uniqueSubjectIds = [...new Set(subjectIds)]

  const { error: clearError } = await db
    .from('subjects')
    .update({ department_id: null })
    .eq('school_id', schoolId)
    .eq('department_id', departmentId)
    .is('deleted_at', null)
  if (clearError) return false

  if (uniqueSubjectIds.length === 0) return true

  const { error: assignError } = await db
    .from('subjects')
    .update({ department_id: departmentId })
    .eq('school_id', schoolId)
    .in('id', uniqueSubjectIds)
    .is('deleted_at', null)
  return !assignError
}

function normalizeAcademicToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export async function ensureDepartmentSubjects(
  schoolId: string,
  departmentId: string,
  templates: Array<{ name: string; code: string }>,
): Promise<string[] | null> {
  if (templates.length === 0) return []

  type ExistingRow = {
    id: string
    name: string
    code: string
    deleted_at: string | null
  }

  const { data: existingRows, error: existingError } = await db
    .from('subjects')
    .select('id, name, code, deleted_at')
    .eq('school_id', schoolId)

  if (existingError || !existingRows) return null

  const rows = existingRows as ExistingRow[]
  const idsToAssign = new Set<string>()
  const rowsToInsert: Array<{ name: string; code: string; school_id: string; department_id: string }> = []

  for (const template of templates) {
    const normalizedTemplateName = normalizeAcademicToken(template.name)
    const normalizedTemplateCode = normalizeAcademicToken(template.code)

    const activeExisting = rows.find(r => {
      if (r.deleted_at) return false
      return normalizeAcademicToken(r.code) === normalizedTemplateCode || normalizeAcademicToken(r.name) === normalizedTemplateName
    })

    if (activeExisting) {
      idsToAssign.add(activeExisting.id)
      continue
    }

    rowsToInsert.push({
      name: template.name,
      code: template.code,
      school_id: schoolId,
      department_id: departmentId,
    })
  }

  if (rowsToInsert.length > 0) {
    const { data: insertedRows, error: insertError } = await db
      .from('subjects')
      .insert(rowsToInsert)
      .select('id')
    if (insertError || !insertedRows) return null
    for (const row of insertedRows as Array<{ id: string }>) idsToAssign.add(row.id)
  }

  return [...idsToAssign]
}

export async function deleteDepartment(id: string): Promise<boolean> {
  const { error } = await db.from('departments').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  return !error
}

// ─── Classes ─────────────────────────────────────────────────────────────────

export async function getClasses(schoolId: string): Promise<AcademicClass[]> {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      id, name, grade_level, stream, academic_year_id, class_teacher_id, department_id, room,
      academic_year:academic_years(label),
      class_teacher:teachers(id, profile:profiles(full_name)),
      department:departments(name)
    `)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('name')
  if (error || !data) return []
  type Raw = {
    id: string
    name: string
    grade_level: number | null
    stream: string | null
    academic_year_id: string | null
    class_teacher_id: string | null
    department_id: string | null
    room: string | null
    academic_year: { label: string } | null
    class_teacher: { id: string; profile: { full_name: string } | null } | null
    department: { name: string } | null
  }
  return (data as unknown as Raw[]).map(r => ({
    id: r.id, name: r.name, level: r.grade_level, stream: r.stream,
    academic_year_id: r.academic_year_id,
    academic_year_name: r.academic_year?.label ?? null,
    class_teacher_id: r.class_teacher_id,
    class_teacher_name: r.class_teacher?.profile?.full_name ?? null,
    department_id: r.department_id,
    department_name: r.department?.name ?? null,
    room: r.room ?? null,
  }))
}

export async function createClass(
  schoolId: string,
  d: { name: string; level: number; stream?: string; academic_year_id: string; class_teacher_id?: string; department_id?: string | null },
): Promise<boolean> {
  const { error } = await db.from('classes').insert({
    name: d.name,
    grade_level: d.level,
    stream: d.stream || null,
    academic_year_id: d.academic_year_id,
    class_teacher_id: d.class_teacher_id || null,
    department_id: d.department_id || null,
    school_id: schoolId,
  })
  return !error
}

export async function updateClass(
  id: string,
  d: Partial<{ name: string; level: number; stream: string; academic_year_id: string; class_teacher_id: string | null; department_id: string | null }>,
): Promise<boolean> {
  const payload: Record<string, unknown> = {}
  if (d.name !== undefined) payload.name = d.name
  if (d.level !== undefined) payload.grade_level = d.level
  if (d.stream !== undefined) payload.stream = d.stream || null
  if (d.academic_year_id !== undefined) payload.academic_year_id = d.academic_year_id
  if (d.class_teacher_id !== undefined) payload.class_teacher_id = d.class_teacher_id
  if (d.department_id !== undefined) payload.department_id = d.department_id

  const { error } = await db.from('classes').update(payload).eq('id', id)
  return !error
}

export async function deleteClass(id: string): Promise<boolean> {
  const { error } = await db.from('classes').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  return !error
}

// ─── Subjects ────────────────────────────────────────────────────────────────

export async function getSubjects(schoolId: string): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('id, name, code, description, department_id')
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('name')
  if (error || !data) return []
  type Raw = { id: string; name: string; code: string; description: string | null; department_id: string | null }
  return (data as unknown as Raw[]).map(r => ({ ...r }))
}

export async function createSubject(schoolId: string, d: { name: string; code: string; description?: string }): Promise<boolean> {
  const { error } = await db.from('subjects').insert({ name: d.name, code: d.code, description: d.description || null, school_id: schoolId })
  return !error
}

export async function updateSubject(id: string, d: Partial<{ name: string; code: string; description: string }>): Promise<boolean> {
  const { error } = await db.from('subjects').update(d).eq('id', id)
  return !error
}

export async function deleteSubject(id: string): Promise<boolean> {
  const { error } = await db.from('subjects').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  return !error
}

// ─── Academic Years & Terms ───────────────────────────────────────────────────

export async function getAcademicYears(schoolId: string): Promise<AcademicYear[]> {
  const { data, error } = await supabase.from('academic_years').select('id, label, start_date, end_date, is_current').eq('school_id', schoolId).order('start_date', { ascending: false })
  if (error || !data) return []
  type Raw = { id: string; label: string; start_date: string; end_date: string; is_current: boolean }
  return (data as unknown as Raw[]).map(r => ({ id: r.id, name: r.label, start_date: r.start_date, end_date: r.end_date, is_current: r.is_current }))
}

export async function createAcademicYear(schoolId: string, d: { label: string; start_date: string; end_date: string; is_current: boolean }): Promise<boolean> {
  if (d.is_current) {
    await db.from('academic_years').update({ is_current: false }).eq('school_id', schoolId)
  }
  const { error } = await db.from('academic_years').insert({ ...d, school_id: schoolId })
  return !error
}

export async function updateAcademicYear(id: string, schoolId: string, d: Partial<{ label: string; start_date: string; end_date: string; is_current: boolean }>): Promise<boolean> {
  if (d.is_current) {
    await db.from('academic_years').update({ is_current: false }).eq('school_id', schoolId)
  }
  const { error } = await db.from('academic_years').update(d).eq('id', id)
  return !error
}

export async function createTerm(d: { name: string; academic_year_id: string; start_date: string; end_date: string; is_current: boolean }): Promise<boolean> {
  const { error } = await db.from('terms').insert(d)
  return !error
}

export async function updateTerm(id: string, d: Partial<{ name: string; start_date: string; end_date: string; is_current: boolean }>): Promise<boolean> {
  const { error } = await db.from('terms').update(d).eq('id', id)
  return !error
}

export async function deleteTerm(id: string): Promise<boolean> {
  const { error } = await db.from('terms').delete().eq('id', id)
  return !error
}

export async function getTerms(academicYearId?: string): Promise<Term[]> {
  let q = supabase.from('terms').select('id, name, academic_year_id, start_date, end_date, is_current').order('start_date')
  if (academicYearId) q = q.eq('academic_year_id', academicYearId)
  const { data, error } = await q
  if (error || !data) return []
  type Raw = { id: string; name: string; academic_year_id: string; start_date: string; end_date: string; is_current: boolean }
  return (data as unknown as Raw[]).map(r => ({ ...r }))
}

export async function getTermCalendarEvents(termId: string): Promise<TermCalendarEvent[]> {
  const { data, error } = await supabase
    .from('term_calendar_events')
    .select('id, term_id, event_date, event_type, title')
    .eq('term_id', termId)
    .order('event_date')
  if (error || !data) return []
  type Row = { id: string; term_id: string; event_date: string; event_type: TermCalendarEventType; title: string | null }
  return (data as unknown as Row[]).map(r => ({ ...r }))
}

export async function createTermCalendarEvent(
  schoolId: string,
  d: { term_id: string; event_date: string; event_type: TermCalendarEventType; title?: string },
): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser()
  const createdBy = userData.user?.id ?? null
  const { error } = await db.from('term_calendar_events').insert({
    school_id: schoolId,
    term_id: d.term_id,
    event_date: d.event_date,
    event_type: d.event_type,
    title: d.title || null,
    created_by: createdBy,
  })
  return !error
}

export async function updateTermCalendarEvent(
  id: string,
  d: Partial<{ event_date: string; event_type: TermCalendarEventType; title: string }>,
): Promise<boolean> {
  const patch = {
    ...(d.event_date !== undefined && { event_date: d.event_date }),
    ...(d.event_type !== undefined && { event_type: d.event_type }),
    ...(d.title !== undefined && { title: d.title || null }),
  }
  const { error } = await db.from('term_calendar_events').update(patch).eq('id', id)
  return !error
}

export async function deleteTermCalendarEvent(id: string): Promise<boolean> {
  const { error } = await db.from('term_calendar_events').delete().eq('id', id)
  return !error
}

// ─── Exams ───────────────────────────────────────────────────────────────────

export async function getExams(
  schoolId: string,
  filters?: { classId?: string; subjectId?: string; termId?: string; assessmentType?: Exam['assessment_type'] },
): Promise<Exam[]> {
  let q = supabase
    .from('exams')
    .select('id, name, assessment_type, weighting_percent, exam_type, weight, subject_id, class_id, term_id, exam_date, total_marks, subject:subjects(name), class:classes(name), term:terms(name)')
    .eq('school_id', schoolId)
    .order('exam_date', { ascending: false })

  if (filters?.classId) q = q.eq('class_id', filters.classId)
  if (filters?.subjectId) q = q.eq('subject_id', filters.subjectId)
  if (filters?.termId) q = q.eq('term_id', filters.termId)
  if (filters?.assessmentType) q = q.eq('assessment_type', filters.assessmentType)

  const { data, error } = await q
  if (error && !isMissingColumnError(error)) return []

  // Backward compatibility for DBs that don't yet have assessment_type / weighting_percent.
  if (error && isMissingColumnError(error)) {
    let legacyQuery = supabase
      .from('exams')
      .select('id, name, exam_type, weight, subject_id, class_id, term_id, exam_date, total_marks, subject:subjects(name), class:classes(name), term:terms(name)')
      .eq('school_id', schoolId)
      .order('exam_date', { ascending: false })

    if (filters?.classId) legacyQuery = legacyQuery.eq('class_id', filters.classId)
    if (filters?.subjectId) legacyQuery = legacyQuery.eq('subject_id', filters.subjectId)
    if (filters?.termId) legacyQuery = legacyQuery.eq('term_id', filters.termId)
    if (filters?.assessmentType && filters.assessmentType !== 'exam') legacyQuery = legacyQuery.eq('exam_type', filters.assessmentType)

    const { data: legacyData, error: legacyError } = await legacyQuery
    if (legacyError || !legacyData) return []

    type LegacyRaw = {
      id: string; name: string; subject_id: string; class_id: string; term_id: string | null
      exam_type: string | null
      weight: number | null
      exam_date: string | null; total_marks: number
      subject: { name: string } | null; class: { name: string } | null; term: { name: string } | null
    }
    return (legacyData as unknown as LegacyRaw[]).map(r => ({
      id: r.id, name: r.name,
      assessment_type: (r.exam_type === 'practical' || r.exam_type === 'quiz' || r.exam_type === 'test')
        ? r.exam_type
        : 'exam',
      weighting_percent: r.weight ?? 100,
      subject_id: r.subject_id, subject_name: r.subject?.name ?? '—',
      class_id: r.class_id, class_name: r.class?.name ?? '—',
      term_id: r.term_id, term_name: r.term?.name ?? null,
      exam_date: r.exam_date, total_marks: r.total_marks,
      description: null,
    }))
  }

  if (!data) return []

  type Raw = {
    id: string; name: string; subject_id: string; class_id: string; term_id: string | null
    assessment_type: Exam['assessment_type'] | null
    weighting_percent: number | null
    exam_type: string | null
    weight: number | null
    exam_date: string | null; total_marks: number
    subject: { name: string } | null; class: { name: string } | null; term: { name: string } | null
  }
  return (data as unknown as Raw[]).map(r => ({
    id: r.id, name: r.name,
    assessment_type: r.assessment_type
      ?? ((r.exam_type === 'practical' || r.exam_type === 'quiz' || r.exam_type === 'test')
        ? r.exam_type
        : 'exam'),
    weighting_percent: r.weighting_percent ?? r.weight ?? 100,
    subject_id: r.subject_id, subject_name: r.subject?.name ?? '—',
    class_id: r.class_id, class_name: r.class?.name ?? '—',
    term_id: r.term_id, term_name: r.term?.name ?? null,
    exam_date: r.exam_date, total_marks: r.total_marks,
    description: null,
  }))
}

export async function createExam(
  schoolId: string,
  d: {
    name: string
    assessment_type: Exam['assessment_type']
    weighting_percent: number
    subject_id: string
    class_id: string
    term_id?: string
    exam_date?: string
    total_marks: number
    description?: string
  },
): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser()
  const createdBy = userData.user?.id
  if (!createdBy) return false

  const selectedTermId = d.term_id || null

  let academicYearId: string | null = null
  if (selectedTermId) {
    const { data: termRow, error: termError } = await db
      .from('terms')
      .select('academic_year_id')
      .eq('id', selectedTermId)
      .maybeSingle()
    if (termError || !termRow?.academic_year_id) return false
    academicYearId = termRow.academic_year_id as string
  }

  // Fallback academic year (from class, or current school academic year)
  if (!academicYearId) {
    const { data: classRow, error: classError } = await db
      .from('classes')
      .select('academic_year_id')
      .eq('id', d.class_id)
      .maybeSingle()
    if (classError) return false
    academicYearId = classRow?.academic_year_id ?? null
  }

  if (!academicYearId) {
    const { data: currentYearRow, error: yearError } = await db
      .from('academic_years')
      .select('id')
      .eq('school_id', schoolId)
      .eq('is_current', true)
      .maybeSingle()
    if (yearError || !currentYearRow?.id) return false
    academicYearId = currentYearRow.id as string
  }

  // Ensure we always have a term_id (DB requires it)
  let termId = selectedTermId
  if (!termId) {
    const { data: currentTermRow, error: termError } = await db
      .from('terms')
      .select('id')
      .eq('academic_year_id', academicYearId)
      .eq('is_current', true)
      .maybeSingle()
    if (termError || !currentTermRow?.id) return false
    termId = currentTermRow.id as string
  }

  const payload = {
    name: d.name,
    assessment_type: d.assessment_type,
    weighting_percent: d.weighting_percent,
    exam_type: d.assessment_type === 'exam' ? 'mid_term' : d.assessment_type,
    weight: d.weighting_percent,
    subject_id: d.subject_id,
    class_id: d.class_id,
    term_id: termId,
    academic_year_id: academicYearId,
    exam_date: d.exam_date || null,
    total_marks: d.total_marks,
    created_by: createdBy,
    school_id: schoolId,
  }

  const { error } = await db.from('exams').insert(payload)
  if (!error) return true

  if (!isMissingColumnError(error)) return false

  // Backward compatibility for DBs before migration 044.
  const legacyPayload = {
    name: d.name,
    exam_type: d.assessment_type === 'exam' ? 'mid_term' : d.assessment_type,
    weight: d.weighting_percent,
    subject_id: d.subject_id,
    class_id: d.class_id,
    term_id: termId,
    academic_year_id: academicYearId,
    exam_date: d.exam_date || null,
    total_marks: d.total_marks,
    created_by: createdBy,
    school_id: schoolId,
  }
  const { error: legacyError } = await db.from('exams').insert(legacyPayload)
  return !legacyError
}

export async function updateExam(
  id: string,
  d: Partial<{
    name: string
    assessment_type: Exam['assessment_type']
    weighting_percent: number
    subject_id: string
    class_id: string
    term_id: string
    exam_date: string
    total_marks: number
    description: string
  }>,
): Promise<boolean> {
  const patch = {
    ...(d.name !== undefined && { name: d.name }),
    ...(d.assessment_type !== undefined && { assessment_type: d.assessment_type, exam_type: d.assessment_type === 'exam' ? 'mid_term' : d.assessment_type }),
    ...(d.weighting_percent !== undefined && { weighting_percent: d.weighting_percent, weight: d.weighting_percent }),
    ...(d.subject_id !== undefined && { subject_id: d.subject_id }),
    ...(d.class_id !== undefined && { class_id: d.class_id }),
    ...(d.term_id !== undefined && { term_id: d.term_id }),
    ...(d.exam_date !== undefined && { exam_date: d.exam_date }),
    ...(d.total_marks !== undefined && { total_marks: d.total_marks }),
  }
  const { error } = await db.from('exams').update(patch).eq('id', id)
  if (!error) return true

  if (!isMissingColumnError(error)) return false

  const legacyPatch = {
    ...(d.name !== undefined && { name: d.name }),
    ...(d.assessment_type !== undefined && { exam_type: d.assessment_type === 'exam' ? 'mid_term' : d.assessment_type }),
    ...(d.weighting_percent !== undefined && { weight: d.weighting_percent }),
    ...(d.subject_id !== undefined && { subject_id: d.subject_id }),
    ...(d.class_id !== undefined && { class_id: d.class_id }),
    ...(d.term_id !== undefined && { term_id: d.term_id }),
    ...(d.exam_date !== undefined && { exam_date: d.exam_date }),
    ...(d.total_marks !== undefined && { total_marks: d.total_marks }),
  }
  const { error: legacyError } = await db.from('exams').update(legacyPatch).eq('id', id)
  return !legacyError
}

export async function deleteExam(id: string): Promise<boolean> {
  const { error } = await db.from('exams').delete().eq('id', id)
  return !error
}

// ─── Grades ──────────────────────────────────────────────────────────────────

export async function getExamGrades(examId: string): Promise<Grade[]> {
  // Get exam total_marks first
  const { data: examData } = await supabase.from('exams').select('total_marks').eq('id', examId).single()
  type RawExam = { total_marks: number }
  const totalMarks = examData ? (examData as unknown as RawExam).total_marks : 100

  const { data, error } = await supabase
    .from('grades')
    .select('id, exam_id, student_id, marks_obtained, remarks, student:students(full_name, admission_no)')
    .eq('exam_id', examId)

  if (error || !data) return []

  type RawGrade = { id: string; exam_id: string; student_id: string; marks_obtained: number | null; remarks: string | null; student: { full_name: string; admission_no: string } | null }
  return (data as unknown as RawGrade[]).map(r => {
    const pct = r.marks_obtained != null ? (r.marks_obtained / totalMarks) * 100 : null
    return {
      id: r.id,
      exam_id: r.exam_id,
      student_id: r.student_id,
      student_name: r.student?.full_name ?? '—',
      admission_number: r.student?.admission_no ?? '—',
      marks_obtained: r.marks_obtained,
      remarks: r.remarks,
      percentage: pct != null ? Math.round(pct * 10) / 10 : null,
      letter_grade: pct != null ? getLetterGrade(pct) : null,
    }
  })
}

export async function upsertGrade(
  schoolId: string,
  examId: string,
  studentId: string,
  marksObtained: number | null,
  remarks?: string,
): Promise<boolean> {
  const { error } = await db.from('grades').upsert(
    {
      school_id: schoolId,
      exam_id: examId,
      student_id: studentId,
      marks_obtained: marksObtained,
      remarks: remarks || null,
    },
    { onConflict: 'student_id,exam_id' }
  )
  return !error
}

export async function getEnrolledStudents(classId: string): Promise<EnrolledStudent[]> {
  const { data, error } = await supabase
    .from('students')
    .select('id, full_name, admission_no')
    .eq('class_id', classId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('full_name')

  if (error || !data) return []
  type Raw = { id: string; full_name: string; admission_no: string }
  return (data as unknown as Raw[]).map(r => ({
    id: r.id,
    full_name: r.full_name,
    admission_number: r.admission_no,
  }))
}
