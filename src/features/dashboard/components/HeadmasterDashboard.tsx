import { useState, useEffect } from 'react'
import { GraduationCap, Banknote, ClipboardCheck, UserCog, AlertTriangle, CheckCircle2, Clock, TrendingUp, HelpCircle } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { EmptyState } from '@/components/common/EmptyState'
import { AppAreaChart } from '@/components/charts/AppAreaChart'
import { AppBarChart } from '@/components/charts/AppBarChart'
import { AppRadialChart } from '@/components/charts/AppRadialChart'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import {
  useSchoolStats,
  useEnrollmentTrend,
  useClassPerformance,
} from '@/features/dashboard/hooks/useHeadmasterDashboard'
import { HeadmasterHelp } from '@/features/dashboard/components/help/HeadmasterHelp'
import { formatCurrency, formatPercent } from '@/utils/format'

const ALERTS = [
  { id: '1', type: 'warning', message: 'Fee collection below 80% for 3 classes', icon: AlertTriangle, color: 'text-amber-500 bg-amber-500/10' },
  { id: '2', type: 'success', message: 'Term 1 report cards published to all parents', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10' },
  { id: '3', type: 'info',    message: '3 asset maintenance requests pending approval', icon: Clock, color: 'text-blue-500 bg-blue-500/10' },
]

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="space-y-3">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-16 animate-pulse rounded bg-muted" />
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      </div>
    </div>
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

  const { data: stats,    isLoading: statsLoading    } = useSchoolStats()
  const { data: enrolment, isLoading: enrolLoading   } = useEnrollmentTrend(12)
  const { data: classPerf, isLoading: classPerfLoading } = useClassPerformance()

  // ── First-login help tab logic ────────────────────────────────────────────
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        subtitle="School-wide overview and executive metrics"
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

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
          <TabsTrigger value="help" className="relative text-sm">
            Help Guide
            {!hasSeen && (
              <span className="ml-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Overview tab ── */}
        <TabsContent value="overview" className="mt-6 space-y-8">

          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            ) : (
              <>
                <StatCard
                  title="Total Students"
                  value={stats?.totalStudents.toLocaleString() ?? '—'}
                  subtitle={`${stats?.activeStudents ?? 0} active`}
                  icon={GraduationCap}
                  iconClassName="bg-blue-500/10 text-blue-500"
                  trend={{ value: 3.2, label: 'vs last year' }}
                />
                <StatCard
                  title="Fee Collection"
                  value={formatPercent(stats?.feeCollectionRate ?? 0)}
                  subtitle={`${formatCurrency(stats?.totalOutstanding ?? 0)} outstanding`}
                  icon={Banknote}
                  iconClassName="bg-emerald-500/10 text-emerald-500"
                  trend={{ value: stats?.feeCollectionRate ?? 0 >= 75 ? 2.1 : -1.4, label: 'vs last term' }}
                />
                <StatCard
                  title="Attendance Rate"
                  value={formatPercent(stats?.attendanceRate ?? 0)}
                  subtitle="This week average"
                  icon={ClipboardCheck}
                  iconClassName="bg-violet-500/10 text-violet-500"
                  trend={{ value: 0.8, label: 'vs last week' }}
                />
                <StatCard
                  title="Active Staff"
                  value={stats?.activeStaff.toLocaleString() ?? '—'}
                  subtitle="Teaching + non-teaching"
                  icon={UserCog}
                  iconClassName="bg-orange-500/10 text-orange-500"
                />
              </>
            )}
          </div>

          {/* Enrolment trend + Fee collection radial */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Enrolment Trend</h3>
                  <p className="text-xs text-muted-foreground">New students per month (last 12 months)</p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-500">
                  <TrendingUp className="h-3 w-3" /> Live
                </span>
              </div>
              <div className="mt-4">
                {enrolLoading ? (
                  <ChartSkeleton height={220} />
                ) : !enrolment?.length || enrolment.every(p => p.students === 0) ? (
                  <EmptyState
                    title="No enrolment data"
                    description="Student admissions will appear here once records are added."
                    className="py-10 border-0"
                  />
                ) : (
                  <AppAreaChart
                    data={enrolment}
                    xKey="month"
                    series={[{ key: 'students', label: 'New Students' }]}
                    height={220}
                    yTickFormatter={(v) => String(v)}
                  />
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-1 text-sm font-semibold">Fee Collection Rate</h3>
              <p className="mb-4 text-xs text-muted-foreground">Current academic year</p>
              <div className="flex flex-col items-center gap-4">
                {statsLoading ? (
                  <div className="h-44 w-44 animate-pulse rounded-full bg-muted" />
                ) : (
                  <AppRadialChart
                    value={stats?.feeCollectionRate ?? 0}
                    label="Collected"
                    color={
                      (stats?.feeCollectionRate ?? 0) >= 80
                        ? 'hsl(var(--chart-2))'
                        : (stats?.feeCollectionRate ?? 0) >= 60
                        ? 'hsl(var(--chart-3))'
                        : 'hsl(var(--destructive))'
                    }
                    size={160}
                  />
                )}
                <div className="w-full space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Collected</span>
                    <span className="font-medium tabular-nums">{formatCurrency(stats?.totalRevenue ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Outstanding</span>
                    <span className="font-medium text-amber-500 tabular-nums">{formatCurrency(stats?.totalOutstanding ?? 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Class performance + Alerts */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">Academic Performance by Class</h3>
                <p className="text-xs text-muted-foreground">Average grade percentage per class</p>
              </div>
              {classPerfLoading ? (
                <ChartSkeleton height={240} />
              ) : !classPerf?.length ? (
                <EmptyState
                  title="No grade data"
                  description="Class performance data will appear once grades are entered."
                  className="py-10 border-0"
                />
              ) : (
                <AppBarChart
                  data={classPerf.map(c => ({ ...c, className: c.className.length > 10 ? c.className.slice(0, 10) + '…' : c.className }))}
                  xKey="className"
                  series={[{ key: 'average', label: 'Average %', radius: 6 }]}
                  height={240}
                  yTickFormatter={(v) => `${v}%`}
                  tooltipFormatter={(v) => `${v}%`}
                  showLegend={false}
                  maxBarSize={32}
                />
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold">Alerts</h3>
              <div className="space-y-3">
                {ALERTS.map(alert => (
                  <div key={alert.id} className="flex items-start gap-3 rounded-lg bg-muted/40 p-3">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${alert.color}`}>
                      <alert.icon className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/80 pt-0.5">
                      {alert.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Help tab ── */}
        <TabsContent value="help" className="mt-6">
          <HeadmasterHelp />
        </TabsContent>
      </Tabs>
    </div>
  )
}
