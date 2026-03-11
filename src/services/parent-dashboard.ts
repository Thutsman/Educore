import { format, subDays } from 'date-fns'
import { supabase } from '@/lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GuardianRecord {
  id: string
  full_name: string
  relationship: string
  phone: string | null
  email: string | null
}

export interface ChildSummary {
  id: string
  admission_no: string
  full_name: string
  class_id: string | null
  class_name: string | null
  grade_level: number | null
  status: string
  photo_url: string | null
}

export interface ChildAttendanceSummary {
  student_id: string
  present: number
  absent: number
  late: number
  excused: number
  total: number
  rate: number // 0–100
}

export interface ChildFeeStatus {
  student_id: string
  total_invoiced: number
  total_paid: number
  outstanding: number
  overdue_count: number
}

export interface OutstandingInvoice {
  id: string
  invoice_no: string
  student_id: string
  student_name: string
  amount: number
  amount_paid: number
  balance: number
  due_date: string | null
  status: string
  category: string | null
  fee_name: string | null
}

export interface RecentGrade {
  id: string
  student_id: string
  student_name: string
  subject_name: string
  exam_name: string
  exam_type: string
  exam_date: string | null
  marks_obtained: number | null
  total_marks: number
  grade_letter: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function n(v: unknown): number {
  const x = Number(v)
  return isNaN(x) ? 0 : x
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** Look up the guardian row for the currently-logged-in user. */
export async function getGuardianByProfile(schoolId: string, profileId: string): Promise<GuardianRecord | null> {
  const { data, error } = await supabase
    .from('guardians')
    .select('id, full_name, relationship, phone, email')
    .eq('school_id', schoolId)
    .eq('profile_id', profileId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) return null
  return data as unknown as GuardianRecord
}

/** Get all active children linked to this guardian (primary or secondary). */
export async function getChildren(schoolId: string, guardianId: string): Promise<ChildSummary[]> {
  const { data, error } = await supabase
    .from('students')
    .select(`
      id, admission_no, full_name, class_id, status, photo_url,
      class:classes(name, grade_level)
    `)
    .eq('school_id', schoolId)
    .or(`guardian_id.eq.${guardianId},guardian2_id.eq.${guardianId}`)
    .is('deleted_at', null)
    .eq('status', 'active')

  if (error || !data) return []

  type Raw = {
    id: string; admission_no: string; full_name: string
    class_id: string | null; status: string; photo_url: string | null
    class: { name: string; grade_level: number } | null
  }

  return (data as unknown as Raw[]).map(s => ({
    id:           s.id,
    admission_no: s.admission_no,
    full_name:    s.full_name,
    class_id:     s.class_id,
    class_name:   s.class?.name ?? null,
    grade_level:  s.class?.grade_level ?? null,
    status:       s.status,
    photo_url:    s.photo_url ?? null,
  }))
}

/** Attendance summary per student over the last N days. */
export async function getChildrenAttendance(
  schoolId: string,
  studentIds: string[],
  days = 30,
): Promise<ChildAttendanceSummary[]> {
  if (!studentIds.length) return []
  const since = format(subDays(new Date(), days), 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('attendance_records')
    .select('student_id, status')
    .eq('school_id', schoolId)
    .in('student_id', studentIds)
    .gte('date', since)

  const empty = studentIds.map(id => ({
    student_id: id, present: 0, absent: 0, late: 0, excused: 0, total: 0, rate: 0,
  }))
  if (error) return empty

  const map: Record<string, { present: number; absent: number; late: number; excused: number }> = {}
  studentIds.forEach(id => { map[id] = { present: 0, absent: 0, late: 0, excused: 0 } })

  type Raw = { student_id: string; status: string }
  ;(data as unknown as Raw[]).forEach(r => {
    if (!map[r.student_id]) return
    if (r.status === 'present')      map[r.student_id].present++
    else if (r.status === 'absent')  map[r.student_id].absent++
    else if (r.status === 'late')    map[r.student_id].late++
    else if (r.status === 'excused') map[r.student_id].excused++
  })

  return studentIds.map(id => {
    const m     = map[id]
    const total = m.present + m.absent + m.late + m.excused
    const rate  = total > 0 ? Math.round(((m.present + m.late) / total) * 100) : 0
    return { student_id: id, ...m, total, rate }
  })
}

/** Fee totals per student — invoiced, paid, outstanding. */
export async function getChildrenFeeStatus(schoolId: string, studentIds: string[]): Promise<ChildFeeStatus[]> {
  if (!studentIds.length) return []

  const { data, error } = await supabase
    .from('invoices')
    .select('student_id, amount, amount_paid, balance, status')
    .eq('school_id', schoolId)
    .in('student_id', studentIds)
    .is('deleted_at', null)
    .neq('status', 'void')
    .neq('status', 'waived')

  const empty = studentIds.map(id => ({
    student_id: id, total_invoiced: 0, total_paid: 0, outstanding: 0, overdue_count: 0,
  }))
  if (error) return empty

  const map: Record<string, { invoiced: number; paid: number; outstanding: number; overdue: number }> = {}
  studentIds.forEach(id => { map[id] = { invoiced: 0, paid: 0, outstanding: 0, overdue: 0 } })

  type Raw = { student_id: string; amount: number; amount_paid: number; balance: number; status: string }
  ;(data as unknown as Raw[]).forEach(inv => {
    if (!map[inv.student_id]) return
    map[inv.student_id].invoiced    += n(inv.amount)
    map[inv.student_id].paid        += n(inv.amount_paid)
    map[inv.student_id].outstanding += n(inv.balance)
    if (inv.status === 'overdue') map[inv.student_id].overdue++
  })

  return studentIds.map(id => ({
    student_id:     id,
    total_invoiced: map[id].invoiced,
    total_paid:     map[id].paid,
    outstanding:    map[id].outstanding,
    overdue_count:  map[id].overdue,
  }))
}

/** All unpaid / partial / overdue invoices for this parent's children (limit 10). */
export async function getOutstandingInvoices(schoolId: string, studentIds: string[]): Promise<OutstandingInvoice[]> {
  if (!studentIds.length) return []

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      id, invoice_no, student_id, amount, amount_paid, balance, due_date, status,
      fee_structure:fee_structures(name, category),
      student:students(full_name)
    `)
    .eq('school_id', schoolId)
    .in('student_id', studentIds)
    .in('status', ['unpaid', 'partial', 'overdue'])
    .is('deleted_at', null)
    .order('due_date', { ascending: true })
    .limit(10)

  if (error || !data) return []

  type Raw = {
    id: string; invoice_no: string; student_id: string
    amount: number; amount_paid: number; balance: number
    due_date: string | null; status: string
    fee_structure: { name: string; category: string } | null
    student: { full_name: string } | null
  }

  return (data as unknown as Raw[]).map(inv => ({
    id:           inv.id,
    invoice_no:   inv.invoice_no,
    student_id:   inv.student_id,
    student_name: inv.student?.full_name ?? '—',
    amount:       n(inv.amount),
    amount_paid:  n(inv.amount_paid),
    balance:      n(inv.balance),
    due_date:     inv.due_date ?? null,
    status:       inv.status,
    category:     inv.fee_structure?.category ?? null,
    fee_name:     inv.fee_structure?.name ?? null,
  }))
}

/** Most recent exam grades across all children (limit 10). */
export async function getRecentGrades(schoolId: string, studentIds: string[]): Promise<RecentGrade[]> {
  if (!studentIds.length) return []

  const { data, error } = await supabase
    .from('grades')
    .select(`
      id, student_id, marks_obtained, grade_letter,
      exam:exams(name, exam_type, exam_date, total_marks, subject:subjects(name)),
      student:students(full_name)
    `)
    .eq('school_id', schoolId)
    .in('student_id', studentIds)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error || !data) return []

  type Raw = {
    id: string; student_id: string
    marks_obtained: number | null; grade_letter: string | null
    exam: {
      name: string; exam_type: string; exam_date: string | null
      total_marks: number; subject: { name: string } | null
    } | null
    student: { full_name: string } | null
  }

  return (data as unknown as Raw[]).map(g => ({
    id:             g.id,
    student_id:     g.student_id,
    student_name:   g.student?.full_name ?? '—',
    subject_name:   g.exam?.subject?.name ?? '—',
    exam_name:      g.exam?.name ?? '—',
    exam_type:      g.exam?.exam_type ?? '—',
    exam_date:      g.exam?.exam_date ?? null,
    marks_obtained: g.marks_obtained ?? null,
    total_marks:    n(g.exam?.total_marks ?? 100),
    grade_letter:   g.grade_letter ?? null,
  }))
}
