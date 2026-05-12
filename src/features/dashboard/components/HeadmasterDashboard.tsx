import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  ClipboardCheck,
  HelpCircle,
  ArrowRight,
  ShoppingCart,
  Users,
  GraduationCap,
  UserCircle,
  Wallet,
  BookOpen,
  AlertTriangle,
  Anchor,
  Home,
  Percent,
  Activity,
  Banknote,
  TrendingUp,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { EmptyState } from '@/components/common/EmptyState'
import { AppBarChart } from '@/components/charts/AppBarChart'
import { AppPieChart } from '@/components/charts/AppPieChart'
import { AppAreaChart } from '@/components/charts/AppAreaChart'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useSchool } from '@/context/SchoolContext'
import {
  useSchemeBookApprovalStats,
  useHeadmasterAttendanceMonthly,
  useHeadmasterInvoiceFeeBreakdown,
  useHeadmasterCumulativeEnrollment,
  useHeadmasterClassPassRates,
  useHeadmasterWorkforceSlices,
  useHeadmasterWorkforcePresence,
  useHeadmasterKpiComparison,
  useHeadmasterSubjectPerformance,
  useHeadmasterDashboardAlerts,
} from '@/features/dashboard/hooks/useHeadmasterDashboard'
import { HeadmasterHelp } from '@/features/dashboard/components/help/HeadmasterHelp'
import {
  formatCurrency,
  formatPercent,
} from '@/utils/format'
import { cn } from '@/utils/cn'
import { usePendingHmProcurementCount } from '@/features/procurement/hooks/useProcurement'
import { useFinanceSummary } from '@/features/finance/hooks/useFinance'
import {
  buildHeadmasterKpiDeltaPercents,
} from '@/services/dashboard'
import { getFinancialHealth } from '@/features/finance/financeSelectors'

function CardSkeleton({ height }: { height?: number }) {
  return (
    <div
      className="rounded-xl border border-border bg-card animate-pulse"
      style={{ minHeight: height ?? 220 }}
    />
  )
}

function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div
      className="w-full animate-pulse rounded-lg bg-muted"
      style={{ height }}
    />
  )
}

export function HeadmasterDashboard() {
  const { profile, user } = useAuth()
  const { currentSchool } = useSchool()

  const { data: kpis, isLoading: kpisLoading } = useHeadmasterKpiComparison()
  const deltas = useMemo(
    () =>
      kpis
        ? buildHeadmasterKpiDeltaPercents(kpis.current, kpis.prior)
        : null,
    [kpis],
  )

  const trendLabelSuffix = kpis?.termContext.usedFallbackWindows
    ? 'prior 90-day window'
    : (kpis?.termContext.prior?.label
      ? `prior term (${kpis.termContext.prior.label})`
      : 'prior term')

  const termFinanceFilters =
    kpis?.termContext.current
      ? {
          date_from: kpis.termContext.current.start,
          date_to: kpis.termContext.current.dateEnd,
        }
      : undefined
  const termFinance = useFinanceSummary(termFinanceFilters)
  const termFinancialHealth = getFinancialHealth({
    collectionRate: termFinance.collectionRate ?? 0,
    outstandingPercentage: termFinance.outstandingPercentage ?? 0,
    expenseRatio: termFinance.expenseRatio ?? 0,
  })

  const { data: attMonthly = [], isLoading: attMonthlyLoading } =
    useHeadmasterAttendanceMonthly(6)
  const { data: feeBreakdown, isLoading: feeLoading } =
    useHeadmasterInvoiceFeeBreakdown()
  const { data: enrolYear = [], isLoading: enrolLoading } =
    useHeadmasterCumulativeEnrollment(5)
  const { data: passByClass = [], isLoading: passLoading } =
    useHeadmasterClassPassRates()
  const { data: workforceSlices = [], isLoading: workforceLoading } =
    useHeadmasterWorkforceSlices()
  const { data: workforcePresence, isLoading: presenceLoading } =
    useHeadmasterWorkforcePresence()
  const { data: subjectPerf = [], isLoading: subjLoading } =
    useHeadmasterSubjectPerformance()
  const {
    data: schemeStats,
    isLoading: schemeLoading,
  } = useSchemeBookApprovalStats()

  const { data: pendingProcurement = 0, isLoading: procPendingLoading } =
    usePendingHmProcurementCount()

  const { data: alerts = [], isLoading: alertsLoading } =
    useHeadmasterDashboardAlerts(kpis?.termContext.current?.start ?? null)

  const [activeTab, setActiveTab] = useState('overview')
  const [hasSeen, setHasSeen] = useState(true)
  const [tabInitialized, setTabInitialized] = useState(false)

  useEffect(() => {
    if (!tabInitialized && user?.id) {
      const key = `educore_help_seen_${user.id}`
      const seen = !!localStorage.getItem(key)
      setHasSeen(seen)
      setActiveTab(seen ? 'overview' : 'help')
      setTabInitialized(true)
    }
  }, [user?.id, tabInitialized])

  const handleTabChange = (val: string) => {
    setActiveTab(val)
    if (val === 'help' && user?.id) {
      localStorage.setItem(`educore_help_seen_${user.id}`, 'true')
      setHasSeen(true)
    }
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Headmaster'
  const todayLine = format(new Date(), 'EEEE, d MMMM yyyy')

  const schemePieData = schemeStats
    ? [
        {
          name: 'Awaiting HOD',
          value: schemeStats.awaitingHod,
          color: 'hsl(var(--chart-4))',
        },
        {
          name: 'Awaiting executive approval',
          value: schemeStats.awaitingFinal,
          color: 'hsl(var(--chart-3))',
        },
        {
          name: 'Fully approved',
          value: schemeStats.fullyApproved,
          color: 'hsl(var(--chart-2))',
        },
      ].filter(d => d.value > 0)
    : []

  const feePieData = feeBreakdown
    ? [
        {
          name: 'Paid',
          value: feeBreakdown.paidFull,
          color: 'hsl(142 76% 36%)',
        },
        {
          name: 'Partially paid',
          value: feeBreakdown.partialCollected,
          color: 'hsl(32 95% 44%)',
        },
        {
          name: 'Outstanding',
          value: feeBreakdown.outstandingAmount,
          color: 'hsl(var(--destructive))',
        },
      ].filter(d => d.value > 0)
    : []

  const workforcePieData = workforceSlices
    .filter(s => s.count > 0)
    .map((s, i) => ({
      name: s.name,
      value: s.count,
      color: `hsl(var(--chart-${(i % 5) + 1}))`,
    }))

  const passBarData = passByClass.map(p => ({
    name: p.className,
    passRate: p.passRate,
  }))

  const subjectBars = subjectPerf.slice(0, 6).map((s) => ({
    subject: s.subject,
    average: s.average,
  }))

  const kpiTrendLabel = `vs ${trendLabelSuffix}`

  const alertItems = [
    ...(pendingProcurement > 0
      ? [{
          severity: 'admin' as const,
          title: `${pendingProcurement} procurement decision${pendingProcurement === 1 ? '' : 's'} awaiting you`,
          detail: 'Quotes need headmaster approval.',
          href: '/finance?tab=procurement&filter=pending_hm',
        }]
      : []),
    ...alerts,
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title={`${greeting()}, ${firstName}`}
          subtitle={`${currentSchool?.name ?? 'School'} dashboard${kpis?.termContext.current?.label ? ` · ${kpis.termContext.current.label}` : ''}`}
          actions={
            activeTab === 'overview' ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => handleTabChange('help')}
              >
                <HelpCircle className="h-4 w-4" />
                Help Guide
                {!hasSeen && (
                  <span className="ml-0.5 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                )}
              </Button>
            ) : null
          }
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Today:
        {' '}
        {todayLine}
      </p>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="text-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="help" className="relative text-sm">
            Help Guide
            {!hasSeen && (
              <span className="ml-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-8">
          {/* KPI strip — Workforce % is staffing status mix, not lesson attendance */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {kpisLoading || !kpis ? (
              Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} height={120} />)
            ) : (
              <>
                <StatCard
                  title="Total students"
                  value={kpis.current.activeEnrollment.toLocaleString()}
                  subtitle="Active enrolment · cohort at term end dates"
                  icon={Users}
                  iconClassName="bg-blue-500/10 text-blue-500"
                  trend={
                    deltas?.activeEnrollmentPct != null
                      ? { value: deltas.activeEnrollmentPct, label: kpiTrendLabel }
                      : undefined
                  }
                />
                <StatCard
                  title="Attendance (students)"
                  value={formatPercent(kpis.current.attendanceRate)}
                  subtitle="School-wide rate for current term dates"
                  icon={GraduationCap}
                  iconClassName="bg-violet-500/10 text-violet-500"
                  trend={
                    deltas?.attendancePct != null
                      ? { value: deltas.attendancePct, label: kpiTrendLabel }
                      : undefined
                  }
                />
                <StatCard
                  title="Workforce availability"
                  value={presenceLoading ? '—' : formatPercent(workforcePresence?.activePct ?? 0)}
                  subtitle={`${workforcePresence?.active ?? '—'} active of ${workforcePresence?.total ?? '—'} (teachers + staff)`}
                  icon={UserCircle}
                  iconClassName="bg-cyan-500/10 text-cyan-600"
                  loading={presenceLoading}
                />
                <StatCard
                  title="Fee collection rate"
                  value={formatPercent(kpis.current.collectionRate)}
                  subtitle="Collected ÷ invoiced (invoices dated in term)"
                  icon={Wallet}
                  iconClassName="bg-emerald-500/10 text-emerald-500"
                  trend={
                    deltas?.collectionPct != null
                      ? { value: deltas.collectionPct, label: kpiTrendLabel }
                      : undefined
                  }
                />
                <StatCard
                  title="Academic pass rate"
                  value={formatPercent(kpis.current.passRate)}
                  subtitle="Across classes · exams dated in term"
                  icon={BookOpen}
                  iconClassName="bg-orange-500/10 text-orange-600"
                  trend={
                    deltas?.passRatePct != null
                      ? { value: deltas.passRatePct, label: kpiTrendLabel }
                      : undefined
                  }
                />
                <StatCard
                  title="Discipline incidents"
                  value="—"
                  subtitle="No discipline log module yet · coming soon"
                  icon={Anchor}
                  iconClassName="bg-amber-500/10 text-amber-600"
                />
              </>
            )}
          </div>

          {/* Term finance pulse */}
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl border px-4 py-3',
              termFinancialHealth === 'healthy'
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : termFinancialHealth === 'warning'
                  ? 'border-amber-500/30 bg-amber-500/10'
                  : 'border-destructive/30 bg-destructive/10',
            )}
          >
            <Activity
              className={cn(
                'h-5 w-5 shrink-0',
                termFinancialHealth === 'healthy'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : termFinancialHealth === 'warning'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-destructive',
              )}
            />
            <div className="flex-1">
              <span className="font-medium">
                Financial health (
                {kpis?.termContext.current?.label ?? 'school'}
                ):
                {' '}
                {termFinancialHealth === 'healthy'
                  ? 'Healthy'
                  : termFinancialHealth === 'warning'
                    ? 'Warning'
                    : 'Critical'}
              </span>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Based on invoiced versus collected totals for invoices created during the highlighted term dates.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Term revenue recognised"
              value={formatCurrency(termFinance.totalPaid ?? 0)}
              subtitle="Payments received on invoices in scope"
              icon={TrendingUp}
              loading={termFinance.isLoading}
            />
            <Link
              to="/finance?tab=invoices&filter=outstanding"
              className="block cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <StatCard
                title="Outstanding (term-scope)"
                value={formatCurrency(termFinance.outstanding ?? 0)}
                subtitle="Unpaid balances on invoices in scope"
                icon={Banknote}
                className="h-full transition-opacity hover:opacity-95"
                loading={termFinance.isLoading}
              />
            </Link>
            <StatCard
              title="Collection rate (finance feed)"
              value={formatPercent((termFinance.collectionRate ?? 0) * 100)}
              subtitle="Matches KPI when filters align"
              icon={Percent}
              loading={termFinance.isLoading}
            />
            <StatCard
              title="Overdue (term-scope)"
              value={(termFinance.overdueCount ?? 0).toLocaleString()}
              subtitle="Counted on filtered invoices"
              icon={AlertTriangle}
              loading={termFinance.isLoading}
            />
          </div>

          {/* Trends row */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">Enrolment trend</h3>
                <p className="text-xs text-muted-foreground">
                  Active students with admission on or before each year-end (approximate cohort curve)
                </p>
              </div>
              {enrolLoading ? (
                <ChartSkeleton height={240} />
              ) : !enrolYear.length ? (
                <EmptyState
                  title="No enrolment data"
                  description="Students will populate this timeline once admissions are recorded."
                  className="border-0 py-10"
                />
              ) : (
                <AppAreaChart
                  data={enrolYear}
                  xKey="label"
                  series={[{
                    key: 'students',
                    label: 'Students',
                    color: 'hsl(var(--chart-1))',
                  }]}
                  gradient={false}
                  height={240}
                  showLegend={false}
                />
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">Student attendance trend</h3>
                <p className="text-xs text-muted-foreground">
                  Monthly percentage — present + late vs active enrolment × marked days
                </p>
              </div>
              {attMonthlyLoading ? (
                <ChartSkeleton height={240} />
              ) : !attMonthly.length ? (
                <EmptyState
                  title="No monthly attendance yet"
                  className="border-0 py-10"
                />
              ) : (
                <AppAreaChart
                  data={attMonthly}
                  xKey="month"
                  series={[{
                    key: 'rate',
                    label: 'Attendance %',
                    color: 'hsl(var(--chart-4))',
                  }]}
                  gradient={false}
                  height={240}
                  yTickFormatter={(v) => `${v}%`}
                  tooltipFormatter={(v) => `${v}%`}
                  showLegend={false}
                />
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">Fee collection overview</h3>
                <p className="text-xs text-muted-foreground">
                  All live invoices excluding void · draft · waived
                </p>
              </div>
              {feeLoading ? (
                <ChartSkeleton height={260} />
              ) : !feeBreakdown?.totalExpected ? (
                <EmptyState title="No invoice data yet" className="border-0 py-12" />
              ) : (
                <div className="relative mx-auto max-w-[280px]">
                  <AppPieChart
                    data={feePieData}
                    height={260}
                    showLegend
                    donut
                    tooltipFormatter={(v, name) =>
                      `${name}: ${formatCurrency(Number(v))}`
                    }
                  />
                  <div className="pointer-events-none absolute left-1/2 top-[42%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                    <span className="text-[10px] font-medium uppercase text-muted-foreground">
                      Expected
                    </span>
                    <span className="text-lg font-bold tabular-nums text-foreground">
                      {formatCurrency(feeBreakdown.totalExpected)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Academics + staffing */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-1">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">Academic pass rate by class</h3>
                <p className="text-xs text-muted-foreground">
                  % of recorded marks meeting each exam&apos;s pass mark
                </p>
              </div>
              {passLoading ? (
                <ChartSkeleton height={260} />
              ) : !passBarData.length ? (
                <EmptyState title="No graded exams yet" className="border-0 py-8" />
              ) : (
                <AppBarChart
                  horizontal
                  data={passBarData}
                  xKey="name"
                  series={[{
                    key: 'passRate',
                    label: 'Pass %',
                    color: 'hsl(var(--chart-2))',
                    radius: [0, 6, 6, 0] as const,
                  }]}
                  height={Math.max(220, Math.min(passBarData.length * 36, 400))}
                  yTickFormatter={(v) => `${v}%`}
                  tooltipFormatter={(v) => `${v}%`}
                  showLegend={false}
                  maxBarSize={28}
                />
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">Top-performing subjects</h3>
                <p className="text-xs text-muted-foreground">Average marks across graded entries</p>
              </div>
              {subjLoading ? (
                <ChartSkeleton />
              ) : !subjectBars.length ? (
                <EmptyState title="No subject averages yet" className="border-0 py-8" />
              ) : (
                <AppBarChart
                  data={subjectBars}
                  xKey="subject"
                  series={[{ key: 'average', label: 'Avg mark', radius: [4, 4, 0, 0] as const, color: 'hsl(var(--chart-3))' }]}
                  height={240}
                  showLegend={false}
                  maxBarSize={36}
                />
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">Workforce status mix</h3>
                <p className="text-xs text-muted-foreground">
                  Teachers and non-teaching staff by HR status · not equivalent to daily attendance
                </p>
              </div>
              {workforceLoading ? (
                <ChartSkeleton height={220} />
              ) : !workforcePieData.length ? (
                <EmptyState title="No staffing records yet" className="border-0 py-10" />
              ) : (
                <>
                  <AppPieChart
                    data={workforcePieData}
                    height={210}
                    showLegend
                  />
                  <div className="mt-4 text-center text-xs text-muted-foreground">
                    Total headcount:
                    {' '}
                    <span className="font-semibold text-foreground">
                      {workforceSlices.reduce((a, b) => a + b.count, 0).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Boarding placeholder + Alerts */}
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 lg:col-span-2">
              <div className="flex items-start gap-3">
                <Home className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-semibold">Boarding & welfare</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    There is no dedicated boarding enrolment entity in the database yet — this panel will summarise boarders & sick bay once those records exist.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-3">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold">Alerts & notices</h3>
                  <p className="text-xs text-muted-foreground">
                    Highlights from attendance, finance, procurement, and maintenance
                  </p>
                </div>
              </div>
              {alertsLoading && !alertItems.length ? (
                <div className="h-32 animate-pulse rounded-lg bg-muted" />
              ) : alertItems.length === 0 ? (
                <EmptyState title="Nothing urgent right now" className="border-0 py-6" />
              ) : (
                <ul className="space-y-3">
                  {alertItems.map((a, idx) => {
                    const tone =
                      a.severity === 'critical'
                        ? 'border-l-destructive'
                        : a.severity === 'financial'
                          ? 'border-l-amber-500'
                          : a.severity === 'maintenance'
                            ? 'border-l-sky-500'
                            : 'border-l-muted-foreground'
                    const cnBox = cn(
                      'rounded-lg border border-border border-l-4 bg-muted/40 p-3 text-sm transition-colors',
                      tone,
                      a.href && 'hover:bg-muted/60 block',
                      !a.href && 'block',
                    )
                    return (
                      <li key={`${a.title}-${idx}`}>
                        {a.href ? (
                          <Link
                            to={a.href}
                            className={cn(cnBox, 'cursor-pointer')}
                          >
                            <p className="font-medium text-foreground">{a.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{a.detail}</p>
                          </Link>
                        ) : (
                          <div className={cnBox}>
                            <p className="font-medium text-foreground">{a.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{a.detail}</p>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Ops: scheme books + procurement */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Scheme book pipeline</h3>
                  <p className="text-xs text-muted-foreground">Executive oversight checkpoints</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2 shrink-0" asChild>
                  <Link to="/scheme-book">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
              {schemeLoading ? (
                <ChartSkeleton height={140} />
              ) : !schemeStats?.total ? (
                <EmptyState title="No scheme books uploaded" className="border-0 py-8" />
              ) : (
                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-h-[140px]">
                    <AppPieChart data={schemePieData} height={160} showLegend />
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex justify-between gap-2 border-b border-border pb-2">
                      <span>HOD backlog</span>
                      <span className="font-medium tabular-nums text-foreground">
                        {schemeStats.awaitingHod.toLocaleString()}
                      </span>
                    </li>
                    <li className="flex justify-between gap-2 border-b border-border pb-2">
                      <span>Executive review</span>
                      <span className="font-medium tabular-nums text-foreground">
                        {schemeStats.awaitingFinal.toLocaleString()}
                      </span>
                    </li>
                    <li className="flex justify-between gap-2">
                      <span>Approved</span>
                      <span className="font-medium tabular-nums text-foreground">
                        {schemeStats.fullyApproved.toLocaleString()}
                      </span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <StatCard
                title="Procurement approvals"
                value={procPendingLoading ? '—' : pendingProcurement}
                subtitle={
                  <>
                    Quotes awaiting executive sign-off.&nbsp;
                    <Link
                      className="font-medium text-primary underline-offset-4 hover:underline"
                      to="/finance?tab=procurement&filter=pending_hm"
                    >
                      Review
                    </Link>
                  </>
                }
                icon={ShoppingCart}
                iconClassName="bg-orange-600/10 text-orange-700"
                loading={procPendingLoading}
              />
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Attendance KPIs honour active students × marked days rule
                </span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="help" className="mt-6">
          <HeadmasterHelp />
        </TabsContent>
      </Tabs>
    </div>
  )
}
