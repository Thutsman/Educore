import { format, parseISO } from 'date-fns'
import { AlertTriangle, BookOpen, GraduationCap, Users, Wallet } from 'lucide-react'
import { Badge }      from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard }   from '@/components/common/StatCard'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { useAuth }    from '@/hooks/useAuth'
import {
  useGuardianRecord,
  useChildren,
  useChildrenAttendance,
  useChildrenFeeStatus,
  useOutstandingInvoices,
  useRecentGrades,
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

// ── Small badge helpers ───────────────────────────────────────────────────────

function AttendanceBadge({ rate }: { rate: number }) {
  const cls =
    rate >= 80 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
    rate >= 60 ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400' :
                 'bg-red-500/10 text-red-700 dark:text-red-400'
  return <Badge variant="secondary" className={cls}>{rate}%</Badge>
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    unpaid:  'bg-red-500/10 text-red-700 dark:text-red-400',
    partial: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    overdue: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
  }
  return (
    <Badge variant="secondary" className={cls[status] ?? ''}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

function GradeBadge({ letter }: { letter: string | null }) {
  if (!letter) return <span className="text-muted-foreground">—</span>
  const cls: Record<string, string> = {
    A: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    B: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    C: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    D: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
    E: 'bg-red-500/10 text-red-700 dark:text-red-400',
    F: 'bg-red-500/10 text-red-700 dark:text-red-400',
  }
  return (
    <Badge variant="secondary" className={cls[letter[0].toUpperCase()] ?? ''}>
      {letter}
    </Badge>
  )
}

const EXAM_TYPE_STYLES: Record<string, string> = {
  test:        'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  mid_term:    'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  end_of_term: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  mock:        'bg-rose-500/10 text-rose-700 dark:text-rose-400',
  assignment:  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  practical:   'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
  quiz:        'bg-amber-500/10 text-amber-700 dark:text-amber-400',
}

function ExamTypeBadge({ type }: { type: string }) {
  const label = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return (
    <Badge variant="secondary" className={EXAM_TYPE_STYLES[type] ?? ''}>
      {label}
    </Badge>
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
  const profileId = user?.id

  const { data: guardian,      isLoading: guardianLoading  } = useGuardianRecord(profileId)
  const { data: children = [], isLoading: childrenLoading  } = useChildren(guardian?.id)

  const studentIds = children.map(c => c.id)

  const { data: attendance = [],  isLoading: attendanceLoading } = useChildrenAttendance(studentIds)
  const { data: feeStatuses = [], isLoading: feesLoading       } = useChildrenFeeStatus(studentIds)
  const { data: invoices = [],    isLoading: invoicesLoading   } = useOutstandingInvoices(studentIds)
  const { data: grades = [],      isLoading: gradesLoading     } = useRecentGrades(studentIds)

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Parent'

  // Aggregated KPIs
  const totalOutstanding = feeStatuses.reduce((sum, f) => sum + f.outstanding, 0)
  const avgAttendance    = attendance.length > 0
    ? Math.round(attendance.reduce((sum, a) => sum + a.rate, 0) / attendance.length)
    : 0

  // Lookup maps for child cards
  const attendanceMap = Object.fromEntries(attendance.map(a => [a.student_id, a]))
  const feeMap        = Object.fromEntries(feeStatuses.map(f => [f.student_id, f]))

  const isLoading = guardianLoading || childrenLoading

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
            <StatCard
              title="My Children"
              value={children.length}
              subtitle={`Active student${children.length !== 1 ? 's' : ''} enrolled`}
              icon={Users}
              iconClassName="bg-blue-500/10 text-blue-500"
            />
            <StatCard
              title="Outstanding Balance"
              value={feesLoading ? '…' : fmt(totalOutstanding)}
              subtitle={
                feesLoading ? undefined :
                totalOutstanding > 0
                  ? `${invoices.length} open invoice${invoices.length !== 1 ? 's' : ''}`
                  : 'All fees cleared'
              }
              icon={Wallet}
              iconClassName={totalOutstanding > 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}
            />
            <StatCard
              title="Avg Attendance"
              value={attendanceLoading ? '…' : `${avgAttendance}%`}
              subtitle="Last 30 days across all children"
              icon={GraduationCap}
              iconClassName="bg-violet-500/10 text-violet-500"
            />
            <StatCard
              title="Recent Results"
              value={gradesLoading ? '…' : grades.length}
              subtitle="Exam results available"
              icon={BookOpen}
              iconClassName="bg-amber-500/10 text-amber-500"
            />
          </>
        )}
      </div>

      {/* ── Children Cards ── */}
      {(isLoading || children.length > 0) && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">My Children</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
                ))
              : children.map(child => {
                  const att = attendanceMap[child.id]
                  const fee = feeMap[child.id]
                  return (
                    <Card key={child.id}>
                      <CardContent className="pt-5">
                        {/* Child identity */}
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                            {child.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">{child.full_name}</p>
                            <p className="text-xs text-muted-foreground">{child.admission_no}</p>
                            {child.class_name && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {child.class_name}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Quick metrics */}
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-lg bg-muted/50 px-3 py-2">
                            <p className="text-xs text-muted-foreground">Attendance</p>
                            <div className="mt-1">
                              {attendanceLoading
                                ? <div className="h-5 w-12 animate-pulse rounded bg-muted" />
                                : att
                                  ? <AttendanceBadge rate={att.rate} />
                                  : <span className="text-xs text-muted-foreground">No data</span>}
                            </div>
                          </div>
                          <div className="rounded-lg bg-muted/50 px-3 py-2">
                            <p className="text-xs text-muted-foreground">Outstanding</p>
                            <div className="mt-1">
                              {feesLoading
                                ? <div className="h-5 w-16 animate-pulse rounded bg-muted" />
                                : fee
                                  ? <span className={`text-sm font-semibold ${fee.outstanding > 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                      {fmt(fee.outstanding)}
                                    </span>
                                  : <span className="text-xs text-muted-foreground">—</span>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
          </div>
        </section>
      )}

      {/* ── Two-column: Invoices + Grades ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Outstanding Invoices */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Outstanding Invoices</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {invoicesLoading || isLoading
              ? (
                <table className="w-full">
                  <tbody>
                    {Array.from({ length: 3 }).map((_, i) => <RowSkeleton key={i} />)}
                  </tbody>
                </table>
              )
              : invoices.length === 0
                ? (
                  <EmptyState
                    icon={Wallet}
                    title="No outstanding invoices"
                    description="All fees are up to date"
                    className="border-0 py-10"
                  />
                )
                : (
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Invoice</th>
                          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Student</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Balance</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {invoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-muted/20">
                            <td className="px-4 py-3">
                              <p className="font-mono text-xs">{inv.invoice_no}</p>
                              {inv.fee_name && (
                                <p className="max-w-[140px] truncate text-xs text-muted-foreground">
                                  {inv.fee_name}
                                </p>
                              )}
                              {inv.due_date && (
                                <p className="text-xs text-muted-foreground">
                                  Due: {format(parseISO(inv.due_date), 'dd MMM yyyy')}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs">{inv.student_name}</td>
                            <td className="px-4 py-3 text-right font-semibold text-destructive">
                              {fmt(inv.balance)}
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

        {/* Recent Exam Results */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Recent Exam Results</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {gradesLoading || isLoading
              ? (
                <table className="w-full">
                  <tbody>
                    {Array.from({ length: 3 }).map((_, i) => <RowSkeleton key={i} />)}
                  </tbody>
                </table>
              )
              : grades.length === 0
                ? (
                  <EmptyState
                    icon={BookOpen}
                    title="No results yet"
                    description="Exam results will appear here once published"
                    className="border-0 py-10"
                  />
                )
                : (
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Exam</th>
                          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Student</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Score</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {grades.map(g => (
                          <tr key={g.id} className="hover:bg-muted/20">
                            <td className="px-4 py-3">
                              <p className="max-w-[160px] truncate font-medium">{g.exam_name}</p>
                              <p className="text-xs text-muted-foreground">{g.subject_name}</p>
                              <div className="mt-0.5">
                                <ExamTypeBadge type={g.exam_type} />
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs">{g.student_name}</td>
                            <td className="px-4 py-3 text-right">
                              {g.marks_obtained !== null
                                ? <span className="font-semibold">
                                    {g.marks_obtained}
                                    <span className="text-xs font-normal text-muted-foreground">
                                      /{g.total_marks}
                                    </span>
                                  </span>
                                : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <GradeBadge letter={g.grade_letter} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
