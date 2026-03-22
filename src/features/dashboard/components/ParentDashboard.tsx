import { type RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  Users,
  Wallet,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { useAuth }    from '@/hooks/useAuth'
import { useSchool } from '@/context/SchoolContext'
import { getChildAssignmentStatus, getChildAttendanceBreakdown } from '@/services/parent-dashboard'
import {
  useChildAssignmentStatus,
  useChildAttendanceBreakdown,
  useChildRecentResults,
  useChildSubjectPerformance,
  useCurrentTermId,
  useGuardianChildren,
  useGuardianInvoices,
  useGuardianOutstandingBalance,
  useGuardianRecord,
} from '../hooks/useParentDashboard'

// ── Skeleton helpers ──────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="space-y-3">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-20 animate-pulse rounded bg-muted" />
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}

function RowSkeleton() {
  return (
    <tr>
      <td className="px-4 py-3" colSpan={4}>
        <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
      </td>
    </tr>
  )
}

function AssignmentStatusBadge({ status }: { status: 'submitted' | 'overdue' | 'pending' }) {
  const styles = {
    submitted: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    overdue: 'bg-red-500/10 text-red-700 dark:text-red-400',
    pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  } as const
  const labels = { submitted: 'Submitted', overdue: 'Overdue', pending: 'Pending' } as const
  return <Badge variant="secondary" className={styles[status]}>{labels[status]}</Badge>
}

function InvoiceStatusBadge({ status }: { status: 'Paid' | 'Overdue' | 'Pending' }) {
  const styles = {
    Paid: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    Overdue: 'bg-red-500/10 text-red-700 dark:text-red-400',
    Pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  } as const
  return <Badge variant="secondary" className={styles[status]}>{status}</Badge>
}

function scoreColor(score: number): string {
  if (score >= 50) return '#10b981'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

function textScoreColor(score: number): string {
  return score >= 50
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400'
}

interface KpiCardProps {
  title: string
  value: string
  subtitle: string
  icon: typeof Users
  valueClassName?: string
  warning?: boolean
  onClick?: () => void
}

function KpiCard({ title, value, subtitle, icon: Icon, valueClassName, warning, onClick }: KpiCardProps) {
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`rounded-xl border border-border bg-card p-6 text-left transition-shadow hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-center gap-2">
            <p className={`text-3xl font-bold tracking-tight ${valueClassName ?? ''}`}>{value}</p>
            {warning && <AlertTriangle className="h-4 w-4 text-red-500" />}
          </div>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Wrapper>
  )
}

// ── Inline warning banner (no shadcn Alert needed) ────────────────────────────

function WarningBanner({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div>
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{title}</p>
        <p className="text-xs text-amber-700 dark:text-amber-400">{description}</p>
      </div>
    </div>
  )
}

// ── Currency formatter ────────────────────────────────────────────────────────

function fmt(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(amount)
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ParentDashboard() {
  const { profile, user } = useAuth()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  const profileId = user?.id

  const { data: guardian,      isLoading: guardianLoading  } = useGuardianRecord(profileId)
  const { data: children = [], isLoading: childrenLoading } = useGuardianChildren(profileId)
  const { data: currentTermId } = useCurrentTermId()
  const { data: totalOutstanding = 0, isLoading: balanceLoading } = useGuardianOutstandingBalance(guardian?.id)
  const { data: invoices = [], isLoading: invoicesLoading } = useGuardianInvoices(guardian?.id)

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const invoiceSectionRef = useRef<HTMLElement | null>(null)
  const assignmentsSectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!children.length) {
      setSelectedChildId(null)
      return
    }
    if (!selectedChildId || !children.some((child) => child.student_id === selectedChildId)) {
      setSelectedChildId(children[0].student_id)
    }
  }, [children, selectedChildId])

  const selectedChild = useMemo(
    () => children.find((child) => child.student_id === selectedChildId) ?? null,
    [children, selectedChildId]
  )

  const studentIds = children.map((child) => child.student_id)

  const attendanceAggQueries = useQueries({
    queries: studentIds.map((studentId) => ({
      queryKey: ['parent-dash', 'attendance-breakdown', schoolId, studentId, currentTermId],
      queryFn: () => getChildAttendanceBreakdown(schoolId, studentId, currentTermId ?? undefined),
      enabled: !!schoolId && !!currentTermId,
      staleTime: 5 * 60 * 1000,
    })),
  })

  const assignmentAggQueries = useQueries({
    queries: children
      .filter((child) => !!child.class_id)
      .map((child) => ({
        queryKey: ['parent-dash', 'assignments', schoolId, child.student_id, child.class_id],
        queryFn: () => getChildAssignmentStatus(schoolId, child.student_id, child.class_id!),
        enabled: !!schoolId,
        staleTime: 5 * 60 * 1000,
      })),
  })

  const {
    data: subjectPerformance = [],
    isLoading: subjectPerformanceLoading,
  } = useChildSubjectPerformance(selectedChild?.student_id)
  const {
    data: recentResults = [],
    isLoading: recentResultsLoading,
  } = useChildRecentResults(selectedChild?.student_id)
  const {
    data: assignmentStatus = [],
    isLoading: assignmentStatusLoading,
  } = useChildAssignmentStatus(selectedChild?.student_id, selectedChild?.class_id ?? undefined)
  const {
    data: attendanceBreakdown,
    isLoading: attendanceBreakdownLoading,
  } = useChildAttendanceBreakdown(selectedChild?.student_id, currentTermId ?? undefined)

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Parent'
  const isLoading = guardianLoading || childrenLoading

  const attendanceAggregateLoading =
    attendanceAggQueries.some((query) => query.isLoading) ||
    attendanceAggQueries.some((query) => query.isFetching)

  const assignmentAggregateLoading =
    assignmentAggQueries.some((query) => query.isLoading) ||
    assignmentAggQueries.some((query) => query.isFetching)

  const avgAttendanceThisTerm = useMemo(() => {
    if (!children.length) return 0
    const rows = attendanceAggQueries
      .map((query) => query.data)
      .filter((row): row is NonNullable<typeof row> => !!row)
    if (!rows.length) return 0
    const totalPresentLate = rows.reduce((sum, row) => sum + row.present + row.late, 0)
    const uniqueDaysRecorded = rows.reduce((max, row) => Math.max(max, row.uniqueDaysRecorded), 0)
    if (!uniqueDaysRecorded) return 0
    return Math.round((totalPresentLate / (children.length * uniqueDaysRecorded)) * 100)
  }, [attendanceAggQueries, children.length])

  const pendingAssignmentsCount = useMemo(() => {
    const rows = assignmentAggQueries.flatMap((query) => query.data ?? [])
    return rows.filter((row) => row.status === 'pending' || row.status === 'overdue').length
  }, [assignmentAggQueries])

  const outstandingInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status !== 'Paid' && invoice.balance > 0),
    [invoices]
  )

  const scrollToSection = (ref: RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <PageHeader
        title={`Welcome, ${firstName}`}
        subtitle="Parent Portal — here's how your children are doing"
      />

      {/* ── Alerts ── */}
      {!guardianLoading && !guardian && (
        <WarningBanner
          title="Guardian profile not found"
          description="Your account has not been linked to a guardian record yet. Contact the school administrator."
        />
      )}
      {!isLoading && guardian && children.length === 0 && (
        <WarningBanner
          title="No children linked"
          description="No active students are linked to your guardian profile. Contact the school administrator."
        />
      )}

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              title="My Children"
              value={`${children.length}`}
              subtitle={`Active student${children.length !== 1 ? 's' : ''} enrolled`}
              icon={Users}
            />
            <KpiCard
              title="Outstanding Balance"
              value={balanceLoading ? '...' : totalOutstanding > 0 ? fmt(totalOutstanding) : 'All fees cleared'}
              subtitle={totalOutstanding > 0 ? 'Tap to view invoice details' : 'No unpaid balances'}
              icon={Wallet}
              valueClassName={totalOutstanding > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}
              onClick={() => scrollToSection(invoiceSectionRef)}
            />
            <KpiCard
              title="Avg Attendance (This Term)"
              value={attendanceAggregateLoading ? '...' : `${avgAttendanceThisTerm}%`}
              subtitle="Across all linked children"
              icon={CalendarClock}
              valueClassName={avgAttendanceThisTerm < 80 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}
              warning={avgAttendanceThisTerm < 80}
            />
            <KpiCard
              title="Pending Assignments"
              value={assignmentAggregateLoading ? '...' : `${pendingAssignmentsCount}`}
              subtitle="Due or overdue"
              icon={ClipboardList}
              onClick={() => scrollToSection(assignmentsSectionRef)}
            />
          </>
        )}
      </div>

      {guardian && children.length > 0 && (
        <>
          {children.length > 1 && (
            <Tabs value={selectedChildId ?? undefined} onValueChange={setSelectedChildId}>
              <TabsList>
                {children.map((child) => (
                  <TabsTrigger key={child.student_id} value={child.student_id}>
                    {child.first_name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {children.map((child) => (
                <TabsContent key={child.student_id} value={child.student_id} />
              ))}
            </Tabs>
          )}

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="flex flex-col overflow-hidden lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Subject Performance</CardTitle>
                <p className="text-xs text-muted-foreground">Latest published results per subject</p>
              </CardHeader>
              <CardContent className="min-h-72">
                {subjectPerformanceLoading ? (
                  <div className="h-64 animate-pulse rounded-xl bg-muted" />
                ) : subjectPerformance.length === 0 ? (
                  <EmptyState
                    icon={BookOpen}
                    title="No results published yet"
                    description="Published subject results will appear once assessments are released."
                    className="border-0 py-12"
                  />
                ) : (
                  <div className="h-64 min-h-64 w-full min-w-0">
                    <ResponsiveContainer width="100%" height={256}>
                      <BarChart data={subjectPerformance} layout="vertical" margin={{ left: 24, right: 8, top: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
                        <YAxis type="category" dataKey="subject" width={120} />
                        <Bar dataKey="average" radius={[0, 4, 4, 0]}>
                          {subjectPerformance.map((entry) => (
                            <Cell key={entry.subject} fill={scoreColor(entry.average)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="flex flex-col overflow-hidden lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Recent Results</CardTitle>
                <p className="text-xs text-muted-foreground">Tests and coursework · Published only</p>
              </CardHeader>
              <CardContent className="p-0">
                {recentResultsLoading ? (
                  <table className="w-full">
                    <tbody>
                      {Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}
                    </tbody>
                  </table>
                ) : recentResults.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No published results yet for this term"
                    description="Published assessment scores will appear here."
                    className="border-0 py-10"
                  />
                ) : (
                  <div className="max-h-72 overflow-auto">
                    <div className="space-y-2 p-4">
                      {recentResults.map((result) => (
                        <div key={result.id} className="rounded-lg border border-border p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{result.subject}</p>
                              <p className="truncate text-xs text-muted-foreground">{result.assessment_title}</p>
                            </div>
                            <p className={`text-sm font-semibold ${textScoreColor(result.score)}`}>{result.score}%</p>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {result.date ? format(parseISO(result.date), 'dd MMM yyyy') : '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <section ref={assignmentsSectionRef}>
            <Card className="flex flex-col overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">Assignments</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Current term · {selectedChild ? `${selectedChild.first_name}'s class` : 'Selected child'}
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {assignmentStatusLoading ? (
                  <table className="w-full">
                    <tbody>
                      {Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}
                    </tbody>
                  </table>
                ) : assignmentStatus.length === 0 ? (
                  <EmptyState
                    icon={ClipboardList}
                    title="No assignments have been set yet"
                    description="Assignments for this class will appear once posted."
                    className="border-0 py-10"
                  />
                ) : (
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Subject</th>
                          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Assignment Title</th>
                          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Due Date</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {assignmentStatus.map((row) => (
                          <tr key={row.assignment_id}>
                            <td className="px-4 py-3">{row.subject}</td>
                            <td className="px-4 py-3">{row.title}</td>
                            <td className="px-4 py-3">{format(parseISO(row.due_date), 'dd MMM yyyy')}</td>
                            <td className="px-4 py-3 text-right">
                              <AssignmentStatusBadge status={row.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section ref={invoiceSectionRef}>
          <Card className="flex h-full flex-col overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Outstanding Invoices</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {invoicesLoading || isLoading ? (
                <table className="w-full">
                  <tbody>
                    {Array.from({ length: 3 }).map((_, i) => <RowSkeleton key={i} />)}
                  </tbody>
                </table>
              ) : outstandingInvoices.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="No outstanding invoices — all fees are up to date"
                    description="All fees are cleared."
                    className="border-0 py-10"
                  />
                ) : (
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Description</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Amount</th>
                          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Due Date</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {outstandingInvoices.map((inv) => (
                          <tr
                            key={inv.id}
                            className={`hover:bg-muted/20 ${inv.status === 'Overdue' ? 'bg-red-500/5' : ''}`}
                          >
                            <td className="px-4 py-3">
                              <p className="font-medium">{inv.description}</p>
                              <p className="text-xs text-muted-foreground">{inv.student_name}</p>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">
                              {fmt(inv.balance)}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {inv.due_date ? format(parseISO(inv.due_date), 'dd MMM yyyy') : '—'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <InvoiceStatusBadge status={inv.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
          </CardContent>
          </Card>
        </section>

        <Card className="flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Attendance Breakdown</CardTitle>
            <p className="text-xs text-muted-foreground">
              Current term · {selectedChild ? selectedChild.first_name : 'Selected child'}
            </p>
          </CardHeader>
          <CardContent>
            {attendanceBreakdownLoading || isLoading ? (
              <div className="space-y-3">
                <div className="h-6 w-full animate-pulse rounded bg-muted" />
                <div className="h-6 w-full animate-pulse rounded bg-muted" />
                <div className="h-6 w-full animate-pulse rounded bg-muted" />
                <div className="h-6 w-full animate-pulse rounded bg-muted" />
              </div>
            ) : !selectedChild || !attendanceBreakdown ? (
              <EmptyState
                icon={CalendarClock}
                title="No attendance data"
                description="Attendance records for this term will appear once marked."
                className="border-0 py-10"
              />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Present</p>
                    <p className="text-lg font-semibold">{attendanceBreakdown.present} days</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Late</p>
                    <p className="text-lg font-semibold">{attendanceBreakdown.late} days</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Absent</p>
                    <p className="text-lg font-semibold">{attendanceBreakdown.absent} days</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Attendance rate</p>
                    <p className={`text-lg font-semibold ${attendanceBreakdown.rate < 80 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {attendanceBreakdown.rate}%
                    </p>
                  </div>
                </div>
                {attendanceBreakdown.unreasonedAbsences > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                    {attendanceBreakdown.unreasonedAbsences} absence(s) have no recorded reason — contact the class teacher
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
