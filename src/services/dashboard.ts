import { format, subMonths, startOfWeek, endOfWeek, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase'

// ─── Date helpers ────────────────────────────────────────────────────────────

function toISO(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

function monthKey(date: Date) {
  return format(date, 'yyyy-MM')
}

function monthLabel(date: Date) {
  return format(date, 'MMM yy')
}

/** Build an array of the last N month keys, oldest first */
function lastNMonths(n: number): { key: string; label: string }[] {
  return Array.from({ length: n }, (_, i) => {
    const d = subMonths(new Date(), n - 1 - i)
    return { key: monthKey(d), label: monthLabel(d) }
  })
}

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface SchoolStats {
  totalStudents: number
  activeStudents: number
  feeCollectionRate: number   // 0–100
  totalRevenue: number
  totalOutstanding: number
  attendanceRate: number      // 0–100
  activeStaff: number
}

export interface EnrollmentPoint { month: string; students: number }
export interface FinancePoint    { month: string; revenue: number; expenses: number }
export interface ClassPerfPoint  { className: string; average: number; students: number }
export interface SubjectPerfPoint{ subject: string; average: number }
export interface AttendancePoint { date: string; rate: number }

export interface OutstandingByClass {
  className: string
  students: number
  outstanding: number
}

export interface PaymentMethodStat {
  method: string
  count: number
  total: number
}

export interface TeacherPerfRow {
  teacherName: string
  classCount: number
  subjectCount: number
  employeeNo: string
}

// ─── Utility: safe number ────────────────────────────────────────────────────

function n(v: unknown): number {
  const x = Number(v)
  return isNaN(x) ? 0 : x
}

// ════════════════════════════════════════════════════════════════════════════
// HEADMASTER QUERIES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Core KPI figures for the headmaster stat cards.
 */
export async function getSchoolStats(): Promise<SchoolStats> {
  const weekStart = toISO(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const weekEnd   = toISO(endOfWeek(new Date(),   { weekStartsOn: 1 }))

  const [
    studentsRes,
    invoicesRes,
    attendanceRes,
    teachersRes,
    staffRes,
  ] = await Promise.allSettled([
    supabase
      .from('students')
      .select('status')
      .is('deleted_at', null),

    supabase
      .from('invoices')
      .select('amount, amount_paid, balance, status')
      .is('deleted_at', null)
      .not('status', 'eq', 'void'),

    supabase
      .from('attendance_records')
      .select('status')
      .gte('date', weekStart)
      .lte('date', weekEnd),

    supabase
      .from('teachers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .is('deleted_at', null),

    supabase
      .from('staff')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .is('deleted_at', null),
  ])

  type RawStudent    = { status: string }
  type RawInvoice    = { amount: unknown; amount_paid: unknown; balance: unknown; status: string }
  type RawAttendance = { status: string }

  const students   = (studentsRes.status   === 'fulfilled' ? (studentsRes.value.data   ?? []) : []) as RawStudent[]
  const invoices   = (invoicesRes.status   === 'fulfilled' ? (invoicesRes.value.data   ?? []) : []) as RawInvoice[]
  const attendance = (attendanceRes.status === 'fulfilled' ? (attendanceRes.value.data ?? []) : []) as RawAttendance[]
  const teachers   = teachersRes.status   === 'fulfilled' ? (teachersRes.value.count  ?? 0)  : 0
  const staff      = staffRes.status      === 'fulfilled' ? (staffRes.value.count     ?? 0)  : 0

  const totalStudents  = students.length
  const activeStudents = students.filter(s => s.status === 'active').length

  const totalInvoiced    = invoices.reduce((s, i) => s + n(i.amount), 0)
  const totalPaid        = invoices.reduce((s, i) => s + n(i.amount_paid), 0)
  const totalOutstanding = invoices.reduce((s, i) => s + n(i.balance), 0)
  const feeCollectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0

  const presentCount  = attendance.filter(a => a.status === 'present').length
  const attendanceRate = attendance.length > 0 ? (presentCount / attendance.length) * 100 : 0

  return {
    totalStudents,
    activeStudents,
    feeCollectionRate,
    totalRevenue: totalPaid,
    totalOutstanding,
    attendanceRate,
    activeStaff: teachers + staff,
  }
}

/**
 * New student enrolments grouped by month for the past N months.
 */
export async function getEnrollmentTrend(months = 12): Promise<EnrollmentPoint[]> {
  const since = toISO(subMonths(new Date(), months))

  const { data } = await supabase
    .from('students')
    .select('admission_date')
    .gte('admission_date', since)
    .is('deleted_at', null)

  const buckets = lastNMonths(months)
  const counts: Record<string, number> = {}

  type RawStudent2 = { admission_date: string | null }
  ;((data ?? []) as RawStudent2[]).forEach(s => {
    if (!s.admission_date) return
    const key = s.admission_date.slice(0, 7)
    counts[key] = (counts[key] ?? 0) + 1
  })

  return buckets.map(({ key, label }) => ({
    month: label,
    students: counts[key] ?? 0,
  }))
}

/**
 * Average grade per class (current academic year).
 */
export async function getClassPerformance(): Promise<ClassPerfPoint[]> {
  const { data } = await supabase
    .from('grades')
    .select(`
      marks_obtained,
      student:students!inner(
        class:classes(name)
      )
    `)
    .not('marks_obtained', 'is', null)

  if (!data?.length) return []

  const map: Record<string, { sum: number; count: number }> = {}

  type RawGrade = { marks_obtained: unknown; student: unknown }
  ;((data ?? []) as RawGrade[]).forEach((g) => {
    const student = g.student as { class: { name: string } | null }
    const className = student?.class?.name
    if (!className) return
    const m = n(g.marks_obtained)
    if (!map[className]) map[className] = { sum: 0, count: 0 }
    map[className].sum   += m
    map[className].count += 1
  })

  return Object.entries(map)
    .map(([className, { sum, count }]) => ({
      className,
      average: Math.round(sum / count),
      students: count,
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 10)
}

// ════════════════════════════════════════════════════════════════════════════
// DEPUTY QUERIES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Daily attendance rate for the last 30 days.
 */
export async function getAttendanceTrend(days = 30): Promise<AttendancePoint[]> {
  const since = toISO(subMonths(new Date(), 1))

  const { data } = await supabase
    .from('attendance_records')
    .select('date, status')
    .gte('date', since)
    .order('date')

  if (!data?.length) return []

  const byDate: Record<string, { present: number; total: number }> = {}

  type RawAtt = { date: string; status: string }
  ;((data ?? []) as RawAtt[]).forEach(r => {
    if (!byDate[r.date]) byDate[r.date] = { present: 0, total: 0 }
    byDate[r.date].total++
    if (r.status === 'present') byDate[r.date].present++
  })

  return Object.entries(byDate)
    .slice(-days)
    .map(([date, { present, total }]) => ({
      date: format(parseISO(date), 'dd MMM'),
      rate: total > 0 ? Math.round((present / total) * 100) : 0,
    }))
}

/**
 * Average grade per subject (for deputy's academic overview).
 */
export async function getSubjectPerformance(): Promise<SubjectPerfPoint[]> {
  const { data } = await supabase
    .from('grades')
    .select(`
      marks_obtained,
      exam:exams!inner(
        subject:subjects(name)
      )
    `)
    .not('marks_obtained', 'is', null)

  if (!data?.length) return []

  const map: Record<string, { sum: number; count: number }> = {}

  type RawGrade2 = { marks_obtained: unknown; exam: unknown }
  ;((data ?? []) as RawGrade2[]).forEach((g) => {
    const exam   = g.exam   as { subject: { name: string } | null }
    const subjectName = exam?.subject?.name
    if (!subjectName) return
    if (!map[subjectName]) map[subjectName] = { sum: 0, count: 0 }
    map[subjectName].sum   += n(g.marks_obtained)
    map[subjectName].count += 1
  })

  return Object.entries(map)
    .map(([subject, { sum, count }]) => ({
      subject,
      average: Math.round(sum / count),
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 8)
}

/**
 * Teacher workload summary for the deputy's staff overview.
 */
export async function getTeacherPerformance(): Promise<TeacherPerfRow[]> {
  const { data } = await supabase
    .from('teachers')
    .select(`
      employee_no,
      profile:profiles(full_name),
      teacher_subjects(subject_id, class_id)
    `)
    .eq('status', 'active')
    .is('deleted_at', null)
    .limit(20)

  if (!data?.length) return []

  type RawTeacher = { employee_no: string; profile: unknown; teacher_subjects: unknown }
  return (data as unknown as RawTeacher[]).map((t) => {
    const ts = (t.teacher_subjects ?? []) as Array<{ subject_id: string; class_id: string }>
    const profile = t.profile as { full_name: string } | null
    return {
      teacherName:  profile?.full_name ?? '—',
      employeeNo:   t.employee_no,
      classCount:   new Set(ts.map(x => x.class_id)).size,
      subjectCount: new Set(ts.map(x => x.subject_id)).size,
    }
  })
}

// ════════════════════════════════════════════════════════════════════════════
// BURSAR QUERIES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Monthly revenue (payments) and expenses for the past N months.
 */
export async function getMonthlyFinancials(months = 12): Promise<FinancePoint[]> {
  const since = toISO(subMonths(new Date(), months))

  const [paymentsRes, expensesRes] = await Promise.allSettled([
    supabase
      .from('payments')
      .select('payment_date, amount')
      .gte('payment_date', since),

    supabase
      .from('expenses')
      .select('expense_date, amount')
      .gte('expense_date', since)
      .eq('status', 'paid'),
  ])

  type RawPayment = { payment_date: string | null; amount: unknown }
  type RawExpense = { expense_date: string | null; amount: unknown }
  const payments = (paymentsRes.status === 'fulfilled' ? (paymentsRes.value.data ?? []) : []) as RawPayment[]
  const expenses = (expensesRes.status === 'fulfilled' ? (expensesRes.value.data ?? []) : []) as RawExpense[]

  const buckets = lastNMonths(months)
  const rev: Record<string, number> = {}
  const exp: Record<string, number> = {}

  payments.forEach(p => {
    if (!p.payment_date) return
    const k = p.payment_date.slice(0, 7)
    rev[k] = (rev[k] ?? 0) + n(p.amount)
  })

  expenses.forEach(e => {
    if (!e.expense_date) return
    const k = e.expense_date.slice(0, 7)
    exp[k] = (exp[k] ?? 0) + n(e.amount)
  })

  return buckets.map(({ key, label }) => ({
    month:    label,
    revenue:  Math.round(rev[key] ?? 0),
    expenses: Math.round(exp[key] ?? 0),
  }))
}

/**
 * Top 10 classes by total outstanding balance.
 */
export async function getOutstandingByClass(): Promise<OutstandingByClass[]> {
  const { data } = await supabase
    .from('invoices')
    .select(`
      balance,
      student_id,
      student:students!inner(
        class:classes(name)
      )
    `)
    .in('status', ['unpaid', 'partial', 'overdue'])
    .is('deleted_at', null)
    .gt('balance', 0)

  if (!data?.length) return []

  const map: Record<string, { students: Set<string>; outstanding: number }> = {}

  type RawInvoice2 = { balance: unknown; student_id: unknown; student: unknown }
  ;((data ?? []) as RawInvoice2[]).forEach(inv => {
    const student   = inv.student as { class: { name: string } | null }
    const className = student?.class?.name
    if (!className) return
    if (!map[className]) map[className] = { students: new Set(), outstanding: 0 }
    map[className].students.add(inv.student_id as string)
    map[className].outstanding += n(inv.balance)
  })

  return Object.entries(map)
    .map(([className, { students, outstanding }]) => ({
      className,
      students: students.size,
      outstanding: Math.round(outstanding * 100) / 100,
    }))
    .sort((a, b) => b.outstanding - a.outstanding)
    .slice(0, 10)
}

/**
 * Payment method breakdown — count and total amount per method.
 */
export async function getPaymentMethodBreakdown(): Promise<PaymentMethodStat[]> {
  const since = toISO(subMonths(new Date(), 12))

  const { data } = await supabase
    .from('payments')
    .select('payment_method, amount')
    .gte('payment_date', since)

  if (!data?.length) return []

  const map: Record<string, { count: number; total: number }> = {}

  type RawMethod = { payment_method: string | null; amount: unknown }
  ;((data ?? []) as RawMethod[]).forEach(p => {
    const m = p.payment_method ?? 'other'
    if (!map[m]) map[m] = { count: 0, total: 0 }
    map[m].count++
    map[m].total += n(p.amount)
  })

  return Object.entries(map)
    .map(([method, { count, total }]) => ({
      method: method.replace(/_/g, ' '),
      count,
      total: Math.round(total * 100) / 100,
    }))
    .sort((a, b) => b.total - a.total)
}

/**
 * Bursar KPIs: total revenue (YTD), outstanding, total expenses.
 */
export async function getBursarStats() {
  const yearStart = `${new Date().getFullYear()}-01-01`

  const [revRes, outRes, expRes] = await Promise.allSettled([
    supabase
      .from('payments')
      .select('amount')
      .gte('payment_date', yearStart),

    supabase
      .from('invoices')
      .select('balance')
      .in('status', ['unpaid', 'partial', 'overdue'])
      .is('deleted_at', null),

    supabase
      .from('expenses')
      .select('amount')
      .eq('status', 'paid')
      .gte('expense_date', yearStart),
  ])

  type RawAmt     = { amount:  unknown }
  type RawBalance = { balance: unknown }
  const revenue     = ((revRes.status === 'fulfilled' ? revRes.value.data ?? [] : []) as RawAmt[])
                        .reduce((s, p) => s + n(p.amount), 0)
  const outstanding = ((outRes.status === 'fulfilled' ? outRes.value.data ?? [] : []) as RawBalance[])
                        .reduce((s, i) => s + n(i.balance), 0)
  const expenses    = ((expRes.status === 'fulfilled' ? expRes.value.data ?? [] : []) as RawAmt[])
                        .reduce((s, e) => s + n(e.amount), 0)

  return {
    totalRevenue:     Math.round(revenue     * 100) / 100,
    totalOutstanding: Math.round(outstanding * 100) / 100,
    totalExpenses:    Math.round(expenses    * 100) / 100,
    netPosition:      Math.round((revenue - expenses) * 100) / 100,
  }
}
