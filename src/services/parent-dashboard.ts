import { addDays, format, parseISO, subDays } from 'date-fns'
import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export interface GuardianRecord {
  id: string
  full_name: string
  relationship: string
  phone: string | null
  email: string | null
}

export interface GuardianChild {
  student_id: string
  first_name: string
  last_name: string
  class_id: string | null
  class_name: string | null
}

export interface SubjectPerformancePoint {
  subject: string
  average: number
}

export interface ChildRecentResult {
  id: string
  subject: string
  assessment_title: string
  score: number
  date: string | null
}

export type AssignmentStatus = 'submitted' | 'overdue' | 'pending'

export interface ChildAssignmentStatusRow {
  assignment_id: string
  subject: string
  title: string
  due_date: string
  status: AssignmentStatus
  submitted_at: string | null
}

export interface ChildAttendanceBreakdown {
  present: number
  late: number
  absent: number
  unreasonedAbsences: number
  rate: number
  uniqueDaysRecorded: number
}

export type GuardianInvoiceStatus = 'Paid' | 'Overdue' | 'Pending'

export interface GuardianInvoiceRow {
  id: string
  invoice_no: string
  description: string
  amount: number
  due_date: string | null
  status: GuardianInvoiceStatus
  paid_at: string | null
  balance: number
  student_name: string
}

interface CurrentTerm {
  id: string
  start_date: string
  end_date: string
}

function n(v: unknown): number {
  const x = Number(v)
  return Number.isNaN(x) ? 0 : x
}

function safePct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return Math.round((numerator / denominator) * 100)
}

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return { first: 'Student', last: '' }
  if (parts.length === 1) return { first: parts[0], last: '' }
  return { first: parts[0], last: parts.slice(1).join(' ') }
}

function deriveInvoiceStatus(
  dueDate: string | null,
  paidAt: string | null,
  rawStatus: string,
  balance: number
): GuardianInvoiceStatus {
  if (paidAt || rawStatus === 'paid' || balance <= 0) return 'Paid'
  if (dueDate && dueDate < format(new Date(), 'yyyy-MM-dd')) return 'Overdue'
  return 'Pending'
}

function isAssessmentPublished(exam: Record<string, unknown> | null): boolean {
  if (!exam) return false
  if (typeof exam.published === 'boolean') return exam.published
  if (typeof exam.is_published === 'boolean') return exam.is_published
  if (typeof exam.published_at === 'string' && exam.published_at.length > 0) return true
  if (typeof exam.status === 'string') return exam.status.toLowerCase() === 'published'
  // TODO: Schema has no explicit publish fields on assessments/exams in migrations; revisit once publish metadata is standardized.
  return true
}

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

async function getCurrentTerm(schoolId: string): Promise<CurrentTerm | null> {
  const academicYearId = await getCurrentAcademicYearId(schoolId)
  if (!academicYearId) return null

  const { data, error } = await db
    .from('terms')
    .select('id, start_date, end_date')
    .eq('academic_year_id', academicYearId)
    .eq('is_current', true)
    .maybeSingle()

  if (error || !data?.id) return null
  return data as unknown as CurrentTerm
}

export async function getCurrentTermId(schoolId: string): Promise<string | null> {
  const term = await getCurrentTerm(schoolId)
  return term?.id ?? null
}

export async function getGuardianByProfile(schoolId: string, profileId: string): Promise<GuardianRecord | null> {
  const { data, error } = await db
    .from('guardians')
    .select('id, full_name, relationship, phone, email')
    .eq('school_id', schoolId)
    .eq('profile_id', profileId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) return null
  return data as unknown as GuardianRecord
}

export async function getGuardianChildren(schoolId: string, profileId: string): Promise<GuardianChild[]> {
  const guardian = await getGuardianByProfile(schoolId, profileId)
  if (!guardian) return []

  // Use the same linkage source as RLS policies to avoid mismatches
  // when guardian relations are updated from different flows.
  const { data: linkedIds, error: linkedIdsError } = await db.rpc('get_guardian_student_ids')
  if (linkedIdsError || !linkedIds) return []

  const studentIds = (linkedIds as string[]).filter(Boolean)
  if (!studentIds.length) return []

  const { data, error } = await db
    .from('students')
    .select('id, full_name, class_id, class:classes(name)')
    .eq('school_id', schoolId)
    .in('id', studentIds)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('full_name', { ascending: true })

  if (error || !data) return []

  type Row = {
    id: string
    full_name: string
    class_id: string | null
    class: { name: string } | null
  }

  return (data as unknown as Row[]).map((row) => {
    const names = splitName(row.full_name)
    return {
      student_id: row.id,
      first_name: names.first,
      last_name: names.last,
      class_id: row.class_id,
      class_name: row.class?.name ?? null,
    }
  })
}

export async function getChildSubjectPerformance(schoolId: string, studentId: string): Promise<SubjectPerformancePoint[]> {
  const currentTerm = await getCurrentTerm(schoolId)
  if (!currentTerm) return []

  const { data, error } = await db
    .from('grades')
    .select(`
      marks_obtained,
      exam:exams(*, subject:subjects(name))
    `)
    .eq('school_id', schoolId)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  type Row = {
    marks_obtained: number | null
    exam: (Record<string, unknown> & {
      term_id?: string
      total_marks?: number
      subject?: { name: string } | null
      exam_date?: string | null
      created_at?: string | null
    }) | null
  }

  const latestBySubject: Record<string, number> = {}
  ;(data as unknown as Row[]).forEach((row) => {
    const exam = row.exam
    if (!exam) return
    if ((exam.term_id ?? null) !== currentTerm.id) return
    if (!isAssessmentPublished(exam)) return

    const subjectName = exam.subject?.name ?? 'Unknown Subject'
    if (latestBySubject[subjectName] !== undefined) return

    const totalMarks = n(exam.total_marks ?? 0)
    const score = safePct(n(row.marks_obtained), totalMarks)
    latestBySubject[subjectName] = score
  })

  return Object.entries(latestBySubject)
    .map(([subject, average]) => ({ subject, average }))
    .sort((a, b) => b.average - a.average)
}

export async function getChildRecentResults(schoolId: string, studentId: string): Promise<ChildRecentResult[]> {
  const fromDate = format(subDays(new Date(), 60), 'yyyy-MM-dd')
  const { data, error } = await db
    .from('grades')
    .select(`
      id,
      marks_obtained,
      exam:exams(*, subject:subjects(name))
    `)
    .eq('school_id', schoolId)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(40)

  if (error || !data) return []

  type Row = {
    id: string
    marks_obtained: number | null
    exam: (Record<string, unknown> & {
      name?: string
      total_marks?: number
      exam_date?: string | null
      date?: string | null
      subject?: { name: string } | null
    }) | null
  }

  return (data as unknown as Row[])
    .filter((row) => {
      if (!row.exam || !isAssessmentPublished(row.exam)) return false
      const date = (row.exam.exam_date ?? row.exam.date ?? null) as string | null
      if (!date) return false
      return date >= fromDate
    })
    .slice(0, 8)
    .map((row) => {
      const totalMarks = n(row.exam?.total_marks ?? 0)
      return {
        id: row.id,
        subject: row.exam?.subject?.name ?? 'Unknown Subject',
        assessment_title: (row.exam?.name as string | undefined) ?? 'Assessment',
        score: safePct(n(row.marks_obtained), totalMarks),
        date: (row.exam?.exam_date as string | undefined) ?? (row.exam?.date as string | undefined) ?? null,
      }
    })
}

export async function getChildAssignmentStatus(
  schoolId: string,
  studentId: string,
  classId: string
): Promise<ChildAssignmentStatusRow[]> {
  const currentTerm = await getCurrentTerm(schoolId)
  if (!currentTerm) return []

  const { data: assignments, error: assignmentsError } = await db
    .from('assignments')
    .select('id, title, due_date, subject:subjects(name)')
    .eq('class_id', classId)
    .gte('due_date', currentTerm.start_date)
    .lte('due_date', currentTerm.end_date)
    .order('due_date', { ascending: false })
    .limit(10)

  if (assignmentsError || !assignments) return []

  const assignmentIds = (assignments as { id: string }[]).map((row) => row.id)
  if (!assignmentIds.length) return []

  const { data: submissions } = await db
    .from('assignment_submissions')
    .select('assignment_id, submitted_at')
    .eq('student_id', studentId)
    .in('assignment_id', assignmentIds)

  const submitMap = new Map<string, string>()
  ;((submissions as { assignment_id: string; submitted_at: string | null }[] | null) ?? []).forEach((s) => {
    if (s.submitted_at) submitMap.set(s.assignment_id, s.submitted_at)
  })

  const today = format(new Date(), 'yyyy-MM-dd')
  type AssignmentRow = {
    id: string
    title: string
    due_date: string
    subject: { name: string } | null
  }

  return (assignments as unknown as AssignmentRow[]).map((row) => {
    const submittedAt = submitMap.get(row.id) ?? null
    let status: AssignmentStatus = 'pending'
    if (submittedAt) status = 'submitted'
    else if (row.due_date < today) status = 'overdue'

    return {
      assignment_id: row.id,
      subject: row.subject?.name ?? 'Unknown Subject',
      title: row.title,
      due_date: row.due_date,
      status,
      submitted_at: submittedAt,
    }
  })
}

export async function getChildAttendanceBreakdown(
  schoolId: string,
  studentId: string,
  termId?: string
): Promise<ChildAttendanceBreakdown> {
  const currentTerm = await getCurrentTerm(schoolId)
  const effectiveTermId = termId ?? currentTerm?.id ?? null
  if (!effectiveTermId) {
    return { present: 0, late: 0, absent: 0, unreasonedAbsences: 0, rate: 0, uniqueDaysRecorded: 0 }
  }

  const { data: termRow } = await db
    .from('terms')
    .select('start_date, end_date')
    .eq('id', effectiveTermId)
    .maybeSingle()

  if (!termRow?.start_date || !termRow?.end_date) {
    return { present: 0, late: 0, absent: 0, unreasonedAbsences: 0, rate: 0, uniqueDaysRecorded: 0 }
  }

  const { data, error } = await db
    .from('attendance_records')
    .select('date, status, reason')
    .eq('school_id', schoolId)
    .eq('student_id', studentId)
    .gte('date', termRow.start_date)
    .lte('date', termRow.end_date)

  if (error || !data) {
    return { present: 0, late: 0, absent: 0, unreasonedAbsences: 0, rate: 0, uniqueDaysRecorded: 0 }
  }

  let present = 0
  let late = 0
  let absent = 0
  let unreasonedAbsences = 0
  const uniqueDays = new Set<string>()
  type Row = { date: string; status: string; reason: string | null }
  ;(data as unknown as Row[]).forEach((row) => {
    uniqueDays.add(row.date)
    if (row.status === 'present') present += 1
    if (row.status === 'late') late += 1
    if (row.status === 'absent') {
      absent += 1
      if (!row.reason || row.reason.trim().length === 0) unreasonedAbsences += 1
    }
  })

  const uniqueDaysRecorded = uniqueDays.size
  const rate = safePct(present + late, uniqueDaysRecorded)
  return { present, late, absent, unreasonedAbsences, rate, uniqueDaysRecorded }
}

export async function getChildAttendanceRate(schoolId: string, studentId: string): Promise<number> {
  const breakdown = await getChildAttendanceBreakdown(schoolId, studentId)
  return breakdown.rate
}

export async function getGuardianOutstandingBalance(schoolId: string, guardianId: string): Promise<number> {
  const { data: children } = await db
    .from('students')
    .select('id')
    .eq('school_id', schoolId)
    .or(`guardian_id.eq.${guardianId},guardian2_id.eq.${guardianId}`)
    .eq('status', 'active')
    .is('deleted_at', null)

  const studentIds = ((children as { id: string }[] | null) ?? []).map((c) => c.id)
  if (!studentIds.length) return 0

  const { data: invoices, error } = await db
    .from('invoices')
    .select('balance, status')
    .eq('school_id', schoolId)
    .in('student_id', studentIds)
    .is('deleted_at', null)
    .neq('status', 'void')
    .neq('status', 'waived')

  if (error || !invoices) return 0
  return (invoices as { balance: number }[]).reduce((sum, row) => sum + n(row.balance), 0)
}

export async function getGuardianInvoices(schoolId: string, guardianId: string): Promise<GuardianInvoiceRow[]> {
  const { data: children } = await db
    .from('students')
    .select('id')
    .eq('school_id', schoolId)
    .or(`guardian_id.eq.${guardianId},guardian2_id.eq.${guardianId}`)
    .eq('status', 'active')
    .is('deleted_at', null)

  const studentIds = ((children as { id: string }[] | null) ?? []).map((c) => c.id)
  if (!studentIds.length) return []

  const { data, error } = await db
    .from('invoices')
    .select(`
      *,
      student:students(full_name),
      fee_structure:fee_structures(name)
    `)
    .eq('school_id', schoolId)
    .in('student_id', studentIds)
    .is('deleted_at', null)
    .neq('status', 'void')
    .neq('status', 'waived')
    .order('due_date', { ascending: false })
    .limit(20)

  if (error || !data) return []

  type Row = Record<string, unknown> & {
    id: string
    invoice_no: string
    amount: number
    due_date: string | null
    paid_at?: string | null
    status: string
    balance: number
    student?: { full_name: string } | null
    fee_structure?: { name: string } | null
  }

  return (data as unknown as Row[]).map((row) => ({
    id: row.id,
    invoice_no: row.invoice_no,
    description: row.fee_structure?.name ?? row.invoice_no,
    amount: n(row.amount),
    due_date: row.due_date ?? null,
    paid_at: (row.paid_at as string | null | undefined) ?? null,
    balance: n(row.balance),
    student_name: row.student?.full_name ?? 'Student',
    status: deriveInvoiceStatus(
      row.due_date ?? null,
      (row.paid_at as string | null | undefined) ?? null,
      row.status,
      n(row.balance)
    ),
  }))
}

export function getDateInCurrentTermWindow(schoolId: string): Promise<{ start: string; end: string } | null> {
  return getCurrentTerm(schoolId).then((term) => {
    if (!term) return null
    return { start: term.start_date, end: term.end_date }
  })
}

export function getRecentResultDateWindow(): { start: string; end: string } {
  return {
    start: format(subDays(new Date(), 60), 'yyyy-MM-dd'),
    end: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
  }
}

export function formatIsoDate(date: string | null): string {
  if (!date) return '—'
  return format(parseISO(date), 'dd MMM yyyy')
}
