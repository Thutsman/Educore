import {
  format,
  subMonths,
  subDays,
  subWeeks,
  startOfWeek,
  endOfWeek,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  eachWeekOfInterval,
} from 'date-fns'
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
export interface MonthlyFinancialsResult {
  points: FinancePoint[]
  chartStart: string | null
  monthCount: number
}
export interface ClassPerfPoint  { className: string; average: number; students: number }

/** Headmaster: school-wide attendance using active students × days with any attendance recorded. */
export interface HeadmasterAttendanceOverview {
  rate: number
  activeStudents: number
  uniqueDaysRecorded: number
  lookbackDays: number
}

export interface HeadmasterWeeklyAttendancePoint {
  weekLabel: string
  rate: number
}

/** Headmaster: scheme book counts by HOD / executive approval stage. */
export interface SchemeBookApprovalStats {
  total: number
  awaitingHod: number
  awaitingFinal: number
  fullyApproved: number
}
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
export async function getSchoolStats(schoolId: string): Promise<SchoolStats> {
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
      .eq('school_id', schoolId)
      .is('deleted_at', null),

    supabase
      .from('invoices')
      .select('amount, amount_paid, balance, status')
      .eq('school_id', schoolId)
      .is('deleted_at', null)
      .not('status', 'eq', 'void')
      .not('status', 'eq', 'draft'),

    supabase
      .from('attendance_records')
      .select('status, date')
      .eq('school_id', schoolId)
      .gte('date', weekStart)
      .lte('date', weekEnd),

    supabase
      .from('teachers')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('status', 'active')
      .is('deleted_at', null),

    supabase
      .from('staff')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('status', 'active')
      .is('deleted_at', null),
  ])

  type RawStudent    = { status: string }
  type RawInvoice    = { amount: unknown; amount_paid: unknown; balance: unknown; status: string }
  type RawAttendance = { status: string; date: string }

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

  const presentCount   = attendance.filter(a => a.status === 'present' || a.status === 'late').length
  const uniqueDays     = new Set(attendance.map(a => a.date)).size
  const expectedTotal  = activeStudents * uniqueDays
  const attendanceRate = expectedTotal > 0 ? (presentCount / expectedTotal) * 100 : 0

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
export async function getEnrollmentTrend(schoolId: string, months = 12): Promise<EnrollmentPoint[]> {
  const since = toISO(subMonths(new Date(), months))

  const { data } = await supabase
    .from('students')
    .select('admission_date')
    .eq('school_id', schoolId)
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
export async function getClassPerformance(schoolId: string): Promise<ClassPerfPoint[]> {
  const { data } = await supabase
    .from('grades')
    .select(`
      marks_obtained,
      student:students!inner(
        class:classes(name)
      )
    `)
    .eq('school_id', schoolId)
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

/**
 * School-wide attendance rate for the headmaster overview.
 * Formula: (present + late) / (activeStudents × uniqueDaysRecorded) × 100
 */
export async function getHeadmasterAttendanceOverview(
  schoolId: string,
  lookbackDays = 30,
): Promise<HeadmasterAttendanceOverview> {
  const end = new Date()
  const start = subDays(end, lookbackDays)
  const rangeStart = toISO(start)
  const rangeEnd = toISO(end)

  const [studentsRes, attRes] = await Promise.all([
    supabase
      .from('students')
      .select('id')
      .eq('school_id', schoolId)
      .eq('status', 'active')
      .is('deleted_at', null),
    supabase
      .from('attendance_records')
      .select('date, status')
      .eq('school_id', schoolId)
      .gte('date', rangeStart)
      .lte('date', rangeEnd),
  ])

  const activeStudents = studentsRes.data?.length ?? 0
  const rows = (attRes.data ?? []) as { date: string; status: string }[]
  const uniqueDaysRecorded = new Set(rows.map(r => r.date)).size
  const presentOrLate = rows.filter(r => r.status === 'present' || r.status === 'late').length
  const denom = activeStudents * uniqueDaysRecorded
  const rate = denom > 0 ? Math.round((presentOrLate / denom) * 1000) / 10 : 0

  return { rate, activeStudents, uniqueDaysRecorded, lookbackDays }
}

/** Weekly headmaster attendance series (same rate definition as overview, per ISO week). */
export async function getHeadmasterAttendanceWeekly(
  schoolId: string,
  weeks = 8,
): Promise<HeadmasterWeeklyAttendancePoint[]> {
  const intervalEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
  const intervalStart = startOfWeek(subWeeks(intervalEnd, weeks - 1), { weekStartsOn: 1 })

  const [studentsRes, attRes] = await Promise.all([
    supabase
      .from('students')
      .select('id')
      .eq('school_id', schoolId)
      .eq('status', 'active')
      .is('deleted_at', null),
    supabase
      .from('attendance_records')
      .select('date, status')
      .eq('school_id', schoolId)
      .gte('date', toISO(intervalStart))
      .lte('date', toISO(intervalEnd)),
  ])

  const activeStudents = studentsRes.data?.length ?? 0
  const rows = (attRes.data ?? []) as { date: string; status: string }[]

  const weekStarts = eachWeekOfInterval(
    { start: intervalStart, end: intervalEnd },
    { weekStartsOn: 1 },
  )

  return weekStarts.map((wStart) => {
    const wEnd = endOfWeek(wStart, { weekStartsOn: 1 })
    const a = toISO(wStart)
    const b = toISO(wEnd)
    const inWeek = rows.filter(r => r.date >= a && r.date <= b)
    const uniqueDays = new Set(inWeek.map(r => r.date)).size
    const present = inWeek.filter(r => r.status === 'present' || r.status === 'late').length
    const denom = activeStudents * uniqueDays
    const rate = denom > 0 ? Math.round((present / denom) * 1000) / 10 : 0
    return { weekLabel: format(wStart, "d MMM ''yy"), rate }
  })
}

export async function getSchemeBookApprovalStats(schoolId: string): Promise<SchemeBookApprovalStats> {
  const { data, error } = await supabase
    .from('scheme_books')
    .select('hod_approved_at, approved_at')
    .eq('school_id', schoolId)

  if (error || !data) {
    return { total: 0, awaitingHod: 0, awaitingFinal: 0, fullyApproved: 0 }
  }

  const rows = data as { hod_approved_at: string | null; approved_at: string | null }[]
  let awaitingHod = 0
  let awaitingFinal = 0
  let fullyApproved = 0
  for (const r of rows) {
    if (r.approved_at) fullyApproved++
    else if (r.hod_approved_at) awaitingFinal++
    else awaitingHod++
  }
  return { total: rows.length, awaitingHod, awaitingFinal, fullyApproved }
}

/**
 * Extended headmaster dashboard data sources (aligned with docs / product mapping):
 *
 * KPIs — students: active count at period end (`students.admission_date` + `status`); approximation if status changed historically.
 * Attendance — `attendance_records` with denominator active_students × unique days (CLAUDE dashboard rule).
 * Fee collection — `invoices`; excludes void/draft/waived for breakdown and term filtered KPIs (`created_at` window).
 * Pass rate — `grades` vs `exams.pass_mark`; exam_date constrained when term windows resolve.
 *
 * Workforce donut — aggregated `teachers.status` + `staff.status`; not daily attendance (that data does not exist).
 * Discipline / boarding / sick bay — no backing tables yet; omitted or placeholder in UI only.
 */

export interface HeadmasterMonthlyAttendancePoint {
  month: string
  rate: number
}

/** Fee donut segments (Paid = fully paid invoices; Partial = amounts paid toward partial invoices; Outstanding = unpaid balances). */
export interface InvoiceFeeBreakdown {
  totalExpected: number
  paidFull: number
  partialCollected: number
  outstandingAmount: number
}

export interface CumulativeEnrollmentYearPoint {
  label: string
  students: number
}

export interface ClassPassRatePoint {
  className: string
  passRate: number
}

export interface WorkforceSlice {
  name: string
  count: number
}

export interface HeadmasterTermRange {
  id: string
  label: string
  start: string
  dateEnd: string
}

export interface HeadmasterTermComparisonContext {
  current: HeadmasterTermRange | null
  prior: HeadmasterTermRange | null
  /** True when calendar terms are missing — windows are rolling 90-day periods. */
  usedFallbackWindows: boolean
}

export interface HeadmasterKpiSnapshot {
  /** Active students with admission_date ≤ range end date. */
  activeEnrollment: number
  attendanceRate: number
  /** amount_paid / amount on invoices issued (created_at) within [start, dateEnd]. */
  collectionRate: number
  passRate: number
}

export interface HeadmasterKpiComparisonRow {
  current: HeadmasterKpiSnapshot
  prior: HeadmasterKpiSnapshot | null
  termContext: HeadmasterTermComparisonContext
}

export interface HeadmasterAlertItem {
  severity: 'critical' | 'financial' | 'maintenance' | 'admin'
  title: string
  detail: string
  href?: string
}

function pctDelta(now: number, prev: number): number | null {
  if (prev <= 0 && now <= 0) return null
  if (prev <= 0) return null
  return Math.round(((now - prev) / prev) * 1000) / 10
}

function countEnrollmentAsOf(rows: Array<{ admission_date: string | null; status: string }>, isoEnd: string): number {
  return rows.filter(
    r => r.status === 'active' && r.admission_date && r.admission_date <= isoEnd,
  ).length
}

/** Shared headmaster attendance rate inside [rangeStart, rangeEnd]. */
async function computeHeadmasterAttendanceRateInRange(
  schoolId: string,
  rangeStart: string,
  rangeEnd: string,
): Promise<{ rate: number; activeStudents: number; uniqueDaysRecorded: number }> {
  const [studentsRes, attRes] = await Promise.all([
    supabase
      .from('students')
      .select('id')
      .eq('school_id', schoolId)
      .eq('status', 'active')
      .is('deleted_at', null),
    supabase
      .from('attendance_records')
      .select('date, status')
      .eq('school_id', schoolId)
      .gte('date', rangeStart)
      .lte('date', rangeEnd),
  ])
  const activeStudents = studentsRes.data?.length ?? 0
  const attRows = (attRes.data ?? []) as { date: string; status: string }[]
  const uniqueDaysRecorded = new Set(attRows.map(r => r.date)).size
  const presentOrLate = attRows.filter(r => r.status === 'present' || r.status === 'late').length
  const denom = activeStudents * uniqueDaysRecorded
  const rate = denom > 0 ? Math.round((presentOrLate / denom) * 1000) / 10 : 0
  return { rate, activeStudents, uniqueDaysRecorded }
}

export async function getHeadmasterAttendanceMonthly(
  schoolId: string,
  monthsBack = 6,
): Promise<HeadmasterMonthlyAttendancePoint[]> {
  const now = new Date()
  const firstMonth = startOfMonth(subMonths(now, monthsBack - 1))
  const monthStarts = eachMonthOfInterval({ start: firstMonth, end: startOfMonth(now) })

  const rangeStart = toISO(firstMonth)
  const rangeEnd = toISO(now)

  const [studentsRes, attRes] = await Promise.all([
    supabase
      .from('students')
      .select('id')
      .eq('school_id', schoolId)
      .eq('status', 'active')
      .is('deleted_at', null),
    supabase
      .from('attendance_records')
      .select('date, status')
      .eq('school_id', schoolId)
      .gte('date', rangeStart)
      .lte('date', rangeEnd),
  ])

  const activeStudents = studentsRes.data?.length ?? 0
  const allRows = (attRes.data ?? []) as { date: string; status: string }[]

  return monthStarts.map((mStart) => {
    const mEnd = endOfMonth(mStart)
    const a = toISO(mStart)
    const b = toISO(mEnd > now ? now : mEnd)
    const inMonth = allRows.filter(r => r.date >= a && r.date <= b)
    const uniqueDays = new Set(inMonth.map(r => r.date)).size
    const presentOrLate = inMonth.filter(r => r.status === 'present' || r.status === 'late').length
    const denom = activeStudents * uniqueDays
    const rate = denom > 0 ? Math.round((presentOrLate / denom) * 1000) / 10 : 0
    return {
      month: format(mStart, 'MMM yyyy'),
      rate,
    }
  })
}

/** All billed invoices excluding void/draft/waived; sums for donut chart. */
export async function getInvoiceFeeBreakdown(schoolId: string): Promise<InvoiceFeeBreakdown> {
  const { data } = await supabase
    .from('invoices')
    .select('amount, amount_paid, balance, status')
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .not('status', 'eq', 'void')
    .not('status', 'eq', 'draft')
    .not('status', 'eq', 'waived')

  type Row = { amount: unknown; amount_paid: unknown; balance: unknown; status: string }
  const rows = (data ?? []) as Row[]

  let paidFull = 0
  let partialCollected = 0
  let outstandingAmount = 0
  let totalExpected = 0

  for (const r of rows) {
    const amt = n(r.amount)
    const ap = n(r.amount_paid)
    totalExpected += amt
    switch (r.status) {
      case 'paid':
        paidFull += amt
        break
      case 'partial':
        partialCollected += ap
        outstandingAmount += n(r.balance)
        break
      case 'unpaid':
      case 'overdue':
        outstandingAmount += n(r.balance)
        break
      default:
        outstandingAmount += n(r.balance)
    }
  }

  return {
    totalExpected: Math.round(totalExpected * 100) / 100,
    paidFull: Math.round(paidFull * 100) / 100,
    partialCollected: Math.round(partialCollected * 100) / 100,
    outstandingAmount: Math.round(outstandingAmount * 100) / 100,
  }
}

/** Cumulative active enrollment at December 31 of each school year bracket (shown as YYYY/YY+1 labels). */
export async function getCumulativeEnrollmentTrend(
  schoolId: string,
  yearCount = 5,
): Promise<CumulativeEnrollmentYearPoint[]> {
  const { data } = await supabase
    .from('students')
    .select('admission_date, status')
    .eq('school_id', schoolId)
    .is('deleted_at', null)

  type S = { admission_date: string | null; status: string }
  const rows = (data ?? []) as S[]
  const currYear = new Date().getFullYear()
  const points: CumulativeEnrollmentYearPoint[] = []
  for (let i = yearCount - 1; i >= 0; i--) {
    const y = currYear - i
    const isoEnd = `${y}-12-31`
    const label = `${y}/${String(y + 1).slice(-2)}`
    points.push({ label, students: countEnrollmentAsOf(rows, isoEnd) })
  }
  return points
}

export async function getClassPassRatesForSchool(
  schoolId: string,
  examRange?: { from: string; to: string },
): Promise<ClassPassRatePoint[]> {
  const { data } = await supabase
    .from('grades')
    .select(`
      marks_obtained,
      is_absent,
      exam:exams!inner(
        pass_mark,
        total_marks,
        exam_date,
        class:classes(name)
      )
    `)
    .eq('school_id', schoolId)
    .not('marks_obtained', 'is', null)

  type Row = {
    marks_obtained: unknown
    is_absent: boolean | null
    exam: unknown
  }
  const raw = (data ?? []) as Row[]

  const byClass: Record<string, { pass: number; total: number }> = {}

  for (const g of raw) {
    const ex = g.exam as {
      pass_mark: number | null
      total_marks: number | null
      exam_date: string | null
      class: { name: string } | null
    } | null
    const className = ex?.class?.name
    if (!className || !ex?.pass_mark) continue
    if (examRange && ex.exam_date) {
      if (ex.exam_date < examRange.from || ex.exam_date > examRange.to) continue
    }
    if (g.is_absent) continue
    const marks = n(g.marks_obtained)
    if (!byClass[className]) byClass[className] = { pass: 0, total: 0 }
    byClass[className].total++
    const pm = Number(ex.pass_mark)
    if (!isNaN(pm) && marks >= pm) byClass[className].pass++
  }

  return Object.entries(byClass)
    .map(([className, { pass, total }]) => ({
      className,
      passRate: total > 0 ? Math.round((pass / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.passRate - a.passRate)
}

/** Head counts for KPI; % active excludes inactive (estimated “available workforce”). */
export async function getWorkforcePresenceSummary(schoolId: string): Promise<{
  total: number
  active: number
  onLeave: number
  inactive: number
  activePct: number
}> {
  const [tRes, sRes] = await Promise.all([
    supabase.from('teachers').select('status').eq('school_id', schoolId).is('deleted_at', null),
    supabase.from('staff').select('status').eq('school_id', schoolId).is('deleted_at', null),
  ])
  type R = { status: string | null }
  const rows = [...(((tRes.data ?? []) as R[])), ...(((sRes.data ?? []) as R[]))]
  let active = 0
  let onLeave = 0
  let inactive = 0
  for (const row of rows) {
    switch (row.status) {
      case 'active':
        active++
        break
      case 'on_leave':
        onLeave++
        break
      default:
        inactive++
    }
  }
  const total = rows.length
  const activePct =
    total > 0 ? Math.round((active / total) * 1000) / 10 : 0
  return { total, active, onLeave, inactive, activePct }
}

export async function getWorkforceStatusBreakdown(schoolId: string): Promise<WorkforceSlice[]> {
  const [tRes, sRes] = await Promise.all([
    supabase.from('teachers').select('status').eq('school_id', schoolId).is('deleted_at', null),
    supabase.from('staff').select('status').eq('school_id', schoolId).is('deleted_at', null),
  ])

  type R = { status: string | null }
  const acc: Record<string, number> = {}
  ;((tRes.data ?? []) as R[]).forEach(row => {
    const k = `Teaching · ${row.status ?? 'unknown'}`
    acc[k] = (acc[k] ?? 0) + 1
  })
  ;((sRes.data ?? []) as R[]).forEach(row => {
    const k = `Non-teaching · ${row.status ?? 'unknown'}`
    acc[k] = (acc[k] ?? 0) + 1
  })

  return Object.entries(acc)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

export async function resolveHeadmasterTermWindows(schoolId: string): Promise<HeadmasterTermComparisonContext> {
  const now = new Date()
  const todayISO = toISO(now)

  const { data: years } = await supabase.from('academic_years').select('id').eq('school_id', schoolId)
  type Y = { id: string }
  const yearIds = ((years ?? []) as Y[]).map(y => y.id)
  if (!yearIds.length) {
    const end = now
    const start = subDays(end, 89)
    const pEnd = subDays(start, 1)
    const pStart = subDays(pEnd, 89)
    return {
      current: {
        id: 'fallback-c',
        label: 'Last 90 days',
        start: toISO(start),
        dateEnd: toISO(end),
      },
      prior: {
        id: 'fallback-p',
        label: 'Prior 90 days',
        start: toISO(pStart),
        dateEnd: toISO(pEnd),
      },
      usedFallbackWindows: true,
    }
  }

  const { data: termRows } = await supabase
    .from('terms')
    .select('id, name, start_date, end_date, academic_year_id')
    .in('academic_year_id', yearIds)
    .order('start_date', { ascending: true })

  type TRow = { id: string; name: string; start_date: string; end_date: string }
  const terms = (termRows ?? []) as TRow[]
  if (!terms.length) {
    const end = now
    const start = subDays(end, 89)
    const pEnd = subDays(start, 1)
    const pStart = subDays(pEnd, 89)
    return {
      current: {
        id: 'fallback-c',
        label: 'Last 90 days',
        start: toISO(start),
        dateEnd: toISO(end),
      },
      prior: {
        id: 'fallback-p',
        label: 'Prior 90 days',
        start: toISO(pStart),
        dateEnd: toISO(pEnd),
      },
      usedFallbackWindows: true,
    }
  }

  let idx = terms.findIndex(t => todayISO >= t.start_date && todayISO <= t.end_date)
  if (idx < 0) {
    const past = terms.filter(t => t.end_date < todayISO)
    if (past.length > 0) idx = terms.indexOf(past[past.length - 1])
    else idx = terms.length - 1
  }

  const current = terms[idx]
  const prior = idx > 0 ? terms[idx - 1] : null

  return {
    current: current
      ? {
          id: current.id,
          label: current.name,
          start: current.start_date,
          dateEnd: current.end_date,
        }
      : null,
    prior: prior
      ? {
          id: prior.id,
          label: prior.name,
          start: prior.start_date,
          dateEnd: prior.end_date,
        }
      : null,
    usedFallbackWindows: false,
  }
}

async function invoiceCollectionMetricsInCreatedRange(
  schoolId: string,
  isoStart: string,
  isoEnd: string,
): Promise<{ rate: number; totalInvoiced: number }> {
  const startBoundary = `${isoStart}T00:00:00.000Z`
  const endBoundary = `${isoEnd}T23:59:59.999Z`

  const { data } = await supabase
    .from('invoices')
    .select('amount, amount_paid')
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .not('status', 'eq', 'void')
    .not('status', 'eq', 'draft')
    .gte('created_at', startBoundary)
    .lte('created_at', endBoundary)

  type Row = { amount: unknown; amount_paid: unknown }
  const rows = (data ?? []) as Row[]
  let totalInvoiced = 0
  let totalPaidOnIssued = 0
  for (const r of rows) {
    totalInvoiced += n(r.amount)
    totalPaidOnIssued += n(r.amount_paid)
  }
  const rate = totalInvoiced > 0 ? Math.round((totalPaidOnIssued / totalInvoiced) * 1000) / 10 : 0
  return { rate, totalInvoiced }
}

async function snapshotKpisForRange(
  schoolId: string,
  range: HeadmasterTermRange,
): Promise<HeadmasterKpiSnapshot> {
  const { data: studs } = await supabase
    .from('students')
    .select('admission_date, status')
    .eq('school_id', schoolId)
    .is('deleted_at', null)

  type S = { admission_date: string | null; status: string }
  const studentRows = (studs ?? []) as S[]
  const activeEnrollment = countEnrollmentAsOf(studentRows, range.dateEnd)

  const { rate: attendanceRate } = await computeHeadmasterAttendanceRateInRange(
    schoolId,
    range.start,
    range.dateEnd,
  )

  const { rate: collectionRate } = await invoiceCollectionMetricsInCreatedRange(
    schoolId,
    range.start,
    range.dateEnd,
  )

  const passRates = await getClassPassRatesForSchool(schoolId, { from: range.start, to: range.dateEnd })
  const passRate =
    passRates.length > 0
      ? Math.round(
          (passRates.reduce((s, p) => s + p.passRate, 0) / passRates.length) * 10,
        ) / 10
      : 0

  return {
    activeEnrollment,
    attendanceRate,
    collectionRate,
    passRate,
  }
}

export async function getHeadmasterKpiComparison(schoolId: string): Promise<HeadmasterKpiComparisonRow> {
  const termContext = await resolveHeadmasterTermWindows(schoolId)
  if (!termContext.current) {
    return {
      current: {
        activeEnrollment: 0,
        attendanceRate: 0,
        collectionRate: 0,
        passRate: 0,
      },
      prior: null,
      termContext,
    }
  }

  const current = await snapshotKpisForRange(schoolId, termContext.current)
  const prior = termContext.prior ? await snapshotKpisForRange(schoolId, termContext.prior) : null
  return { current, prior, termContext }
}

export function buildHeadmasterKpiDeltaPercents(
  current: HeadmasterKpiSnapshot,
  prior: HeadmasterKpiSnapshot | null,
): {
  activeEnrollmentPct: number | null
  attendancePct: number | null
  collectionPct: number | null
  passRatePct: number | null
} {
  return {
    activeEnrollmentPct:
      prior !== null ? pctDelta(current.activeEnrollment, prior.activeEnrollment) : null,
    attendancePct: prior !== null ? pctDelta(current.attendanceRate, prior.attendanceRate) : null,
    collectionPct: prior !== null ? pctDelta(current.collectionRate, prior.collectionRate) : null,
    passRatePct: prior !== null ? pctDelta(current.passRate, prior.passRate) : null,
  }
}

/** Rules-based alerts drawn from attendance, invoices, maintenance, procurement is counted in UI separately. */
export async function getHeadmasterAlerts(schoolId: string, termStartFallback?: string): Promise<HeadmasterAlertItem[]> {
  const alerts: HeadmasterAlertItem[] = []

  const since = termStartFallback ?? toISO(subDays(new Date(), 45))

  const { data: absRows } = await supabase
    .from('attendance_records')
    .select('student_id')
    .eq('school_id', schoolId)
    .eq('status', 'absent')
    .gte('date', since)

  const absByStudent: Record<string, number> = {}
  ;((absRows ?? []) as { student_id: string }[]).forEach((r) => {
    absByStudent[r.student_id] = (absByStudent[r.student_id] ?? 0) + 1
  })
  const chronic = Object.values(absByStudent).filter((c) => c > 10).length
  if (chronic > 0) {
    alerts.push({
      severity: 'critical',
      title: `${chronic} students with sustained absenteeism`,
      detail: 'More than 10 absent marks in the selected period — review students and follow up with class teachers.',
      href: '/students',
    })
  }

  const { data: invRows } = await supabase
    .from('invoices')
    .select(
      `
      balance,
      student_id,
      student:students!inner(
        guardian_id,
        guardian2_id
      )
    `,
    )
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .in('status', ['unpaid', 'partial', 'overdue'])
    .gt('balance', 0)

  type Inv = {
    balance: unknown
    student_id: string
    student: { guardian_id: string | null; guardian2_id: string | null } | null
  }
  const guardians = new Set<string>()
  const studentsWithBalance = new Set<string>()
  ;((invRows ?? []) as unknown as Inv[]).forEach((row) => {
    if (n(row.balance) <= 0) return
    studentsWithBalance.add(row.student_id)
    const st = row.student
    if (st?.guardian_id) guardians.add(st.guardian_id)
    if (st?.guardian2_id) guardians.add(st.guardian2_id)
  })

  if (guardians.size > 0 || studentsWithBalance.size > 0) {
    alerts.push({
      severity: 'financial',
      title: `Fee collection (${guardians.size} linked guardians; ${studentsWithBalance.size} student accounts with balance)`,
      detail: 'Review outstanding invoices and follow up.',
      href: '/finance?tab=invoices&filter=outstanding',
    })
  }

  const { count: pendMaint } = await supabase
    .from('maintenance_logs')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('status', 'pending')

  if (pendMaint && pendMaint > 0) {
    alerts.push({
      severity: 'maintenance',
      title: `${pendMaint} maintenance request${pendMaint === 1 ? '' : 's'} pending`,
      detail: 'Open Assets & Maintenance to assign or approve work.',
      href: '/assets',
    })
  }

  return alerts
}

// ════════════════════════════════════════════════════════════════════════════
// DEPUTY QUERIES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Daily attendance rate for the last 30 days.
 */
export async function getAttendanceTrend(schoolId: string, days = 30): Promise<AttendancePoint[]> {
  const since = toISO(subMonths(new Date(), 1))

  const { data } = await supabase
    .from('attendance_records')
    .select('date, status')
    .eq('school_id', schoolId)
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
export async function getSubjectPerformance(schoolId: string): Promise<SubjectPerfPoint[]> {
  const { data } = await supabase
    .from('grades')
    .select(`
      marks_obtained,
      exam:exams!inner(
        subject:subjects(name)
      )
    `)
    .eq('school_id', schoolId)
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
export async function getTeacherPerformance(schoolId: string): Promise<TeacherPerfRow[]> {
  const { data } = await supabase
    .from('teachers')
    .select(`
      employee_no,
      profile:profiles(full_name),
      teacher_subjects(subject_id, class_id)
    `)
    .eq('school_id', schoolId)
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
 * Earliest payment or paid expense date for the school.
 */
export async function getBursarChartStartDate(schoolId: string): Promise<string | null> {
  const [payRes, expRes] = await Promise.all([
    supabase
      .from('payments')
      .select('payment_date')
      .eq('school_id', schoolId)
      .order('payment_date', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('expenses')
      .select('expense_date')
      .eq('school_id', schoolId)
      .eq('status', 'paid')
      .order('expense_date', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])
  type PayMin = { payment_date: string }
  type ExpMin = { expense_date: string }
  const p = (payRes.data as PayMin | null)?.payment_date
  const e = (expRes.data as ExpMin | null)?.expense_date
  if (!p && !e) return null
  if (!p) return e ?? null
  if (!e) return p
  return p < e ? p : e
}

/**
 * Monthly revenue (payments) and expenses from first data month through current month.
 */
export async function getMonthlyFinancials(schoolId: string): Promise<MonthlyFinancialsResult> {
  const now = new Date()
  const chartStartRaw = await getBursarChartStartDate(schoolId)

  let rangeStart: Date
  let chartStartOut: string | null = chartStartRaw

  if (!chartStartRaw) {
    rangeStart = startOfMonth(subMonths(now, 11))
    chartStartOut = format(rangeStart, 'yyyy-MM-dd')
  } else {
    rangeStart = startOfMonth(parseISO(chartStartRaw))
  }

  const currentMonthStart = startOfMonth(now)
  if (format(rangeStart, 'yyyy-MM') === format(currentMonthStart, 'yyyy-MM')) {
    rangeStart = subMonths(rangeStart, 1)
  }

  let monthStarts = eachMonthOfInterval({ start: rangeStart, end: currentMonthStart })
  if (monthStarts.length < 2) {
    monthStarts = [subMonths(monthStarts[0] ?? currentMonthStart, 1), monthStarts[0] ?? currentMonthStart]
  }

  const since = toISO(rangeStart)

  const [paymentsRes, expensesRes] = await Promise.allSettled([
    supabase
      .from('payments')
      .select('payment_date, amount')
      .eq('school_id', schoolId)
      .gte('payment_date', since),

    supabase
      .from('expenses')
      .select('expense_date, amount')
      .eq('school_id', schoolId)
      .eq('status', 'paid')
      .gte('expense_date', since),
  ])

  type RawPayment = { payment_date: string | null; amount: unknown }
  type RawExpense = { expense_date: string | null; amount: unknown }
  const payments = (paymentsRes.status === 'fulfilled' ? (paymentsRes.value.data ?? []) : []) as RawPayment[]
  const expenses = (expensesRes.status === 'fulfilled' ? (expensesRes.value.data ?? []) : []) as RawExpense[]

  const buckets = monthStarts.map((d) => ({ key: monthKey(d), label: monthLabel(d) }))
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

  const points = buckets.map(({ key, label }) => ({
    month: label,
    revenue: Math.round(rev[key] ?? 0),
    expenses: Math.round(exp[key] ?? 0),
  }))

  return {
    points,
    chartStart: chartStartOut,
    monthCount: buckets.length,
  }
}

/**
 * Top 10 classes by total outstanding balance.
 */
export async function getOutstandingByClass(schoolId: string): Promise<OutstandingByClass[]> {
  const { data } = await supabase
    .from('invoices')
    .select(`
      balance,
      student_id,
      student:students!inner(
        class:classes(name)
      )
    `)
    .eq('school_id', schoolId)
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
export async function getPaymentMethodBreakdown(schoolId: string): Promise<PaymentMethodStat[]> {
  const since = toISO(subMonths(new Date(), 12))

  const { data } = await supabase
    .from('payments')
    .select('payment_method, amount')
    .eq('school_id', schoolId)
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
export async function getBursarStats(schoolId: string) {
  const yearStart = `${new Date().getFullYear()}-01-01`

  const [revRes, outRes, expRes] = await Promise.allSettled([
    supabase
      .from('payments')
      .select('amount')
      .eq('school_id', schoolId)
      .gte('payment_date', yearStart),

    supabase
      .from('invoices')
      .select('balance')
      .eq('school_id', schoolId)
      .in('status', ['unpaid', 'partial', 'overdue'])
      .is('deleted_at', null),

    supabase
      .from('expenses')
      .select('amount')
      .eq('school_id', schoolId)
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
