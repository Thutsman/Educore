import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardCheck,
  BookMarked,
  Clock,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ShoppingCart,
  Activity,
  TrendingDown,
  TrendingUp,
  Scale,
  Percent,
  AlertTriangle,
  Banknote,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { EmptyState } from '@/components/common/EmptyState'
import { AppBarChart } from '@/components/charts/AppBarChart'
import { AppPieChart } from '@/components/charts/AppPieChart'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import {
  useHeadmasterAttendanceOverview,
  useHeadmasterAttendanceWeekly,
  useSchemeBookApprovalStats,
} from '@/features/dashboard/hooks/useHeadmasterDashboard'
import { HeadmasterHelp } from '@/features/dashboard/components/help/HeadmasterHelp'
import { formatCurrency, formatPercent } from '@/utils/format'
import { usePendingHmProcurementCount } from '@/features/procurement/hooks/useProcurement'
import { useFinancialHealth } from '@/features/finance/hooks/useFinance'

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

  const { data: attOverview, isLoading: attOverviewLoading } = useHeadmasterAttendanceOverview(30)
  const { data: attWeekly = [], isLoading: attWeeklyLoading } = useHeadmasterAttendanceWeekly(8)
  const { data: schemeStats, isLoading: schemeLoading } = useSchemeBookApprovalStats()
  const finance = useFinancialHealth()

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

  const { data: pendingProcurement = 0, isLoading: procPendingLoading } = usePendingHmProcurementCount()

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

  const kpiLoading = attOverviewLoading || schemeLoading

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        subtitle="School-wide attendance and scheme book oversight"
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

        <TabsContent value="overview" className="mt-6 space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpiLoading ? (
              Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            ) : (
              <>
                <StatCard
                  title="Overall attendance"
                  value={formatPercent(attOverview?.rate ?? 0)}
                  subtitle={
                    attOverview?.uniqueDaysRecorded
                      ? `${attOverview.uniqueDaysRecorded} school days with marks · last ${attOverview.lookbackDays} days`
                      : 'No attendance marks in this period'
                  }
                  icon={ClipboardCheck}
                  iconClassName="bg-violet-500/10 text-violet-500"
                />
                <StatCard
                  title="Scheme books uploaded"
                  value={schemeStats?.total.toLocaleString() ?? '—'}
                  subtitle="Entries across all classes and subjects"
                  icon={BookMarked}
                  iconClassName="bg-blue-500/10 text-blue-500"
                />
                <StatCard
                  title="Awaiting HOD review"
                  value={schemeStats?.awaitingHod.toLocaleString() ?? '—'}
                  subtitle="Uploaded, not yet approved by a HOD"
                  icon={Clock}
                  iconClassName="bg-amber-500/10 text-amber-600"
                />
                <StatCard
                  title="Awaiting your approval"
                  value={schemeStats?.awaitingFinal.toLocaleString() ?? '—'}
                  subtitle="HOD approved — pending head / deputy sign-off"
                  icon={CheckCircle2}
                  iconClassName="bg-emerald-500/10 text-emerald-600"
                />
              </>
            )}
          </div>

          {procPendingLoading ? (
            <CardSkeleton />
          ) : (
            <StatCard
              title="Procurement approvals"
              value={pendingProcurement}
              subtitle={
                <>
                  Supplier quotes awaiting your decision.{' '}
                  <Link
                    className="font-medium text-primary underline-offset-4 hover:underline"
                    to="/finance?tab=procurement&filter=pending_hm"
                  >
                    Review in Finance →
                  </Link>
                </>
              }
              icon={ShoppingCart}
              iconClassName="bg-orange-600/10 text-orange-700"
            />
          )}

          {/* ── Finance snapshot (Headmaster needs finance visibility) ── */}
          <div className="space-y-4">
            <div
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                finance.health === 'healthy'
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : finance.health === 'warning'
                    ? 'border-amber-500/30 bg-amber-500/10'
                    : 'border-destructive/30 bg-destructive/10'
              }`}
            >
              <Activity
                className={`h-5 w-5 shrink-0 ${
                  finance.health === 'healthy'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : finance.health === 'warning'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-destructive'
                }`}
              />
              <div className="flex-1">
                <span className="font-medium">
                  Financial health:{' '}
                  {finance.health === 'healthy' ? 'Healthy' : finance.health === 'warning' ? 'Warning' : 'Critical'}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {finance.health === 'healthy'
                    ? 'Collection rate ≥85%, outstanding ≤15%, expenses under control'
                    : finance.health === 'warning'
                      ? 'Review collection, outstanding balances, or expense ratio'
                      : 'Immediate action needed — low collection, high outstanding, or expenses exceed revenue'}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Revenue (YTD)"
                value={formatCurrency(finance.totalPaid ?? 0)}
                subtitle="Total payments received"
                icon={TrendingUp}
                iconClassName="bg-emerald-500/10 text-emerald-500"
                loading={finance.isLoading}
              />
              <Link
                to="/finance?tab=invoices&filter=outstanding"
                className="block cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <StatCard
                  title="Outstanding Balance"
                  value={formatCurrency(finance.outstanding ?? 0)}
                  subtitle="Unpaid + partial + overdue (selected period)"
                  icon={Banknote}
                  iconClassName="bg-amber-500/10 text-amber-500"
                  loading={finance.isLoading}
                  className="h-full transition-opacity hover:opacity-95"
                />
              </Link>
              <StatCard
                title="Total Expenses (YTD)"
                value={formatCurrency(finance.totalExpenses ?? 0)}
                subtitle="Paid expenses only"
                icon={TrendingDown}
                iconClassName="bg-rose-500/10 text-rose-500"
                loading={finance.isLoading}
              />
              <StatCard
                title="Net Cash Position"
                value={formatCurrency(finance.netCashPosition ?? 0)}
                subtitle={(finance.netCashPosition ?? 0) >= 0 ? 'Surplus (payments - expenses)' : 'Deficit (payments - expenses)'}
                icon={Scale}
                iconClassName={(finance.netCashPosition ?? 0) >= 0 ? 'bg-blue-500/10 text-blue-500' : 'bg-destructive/10 text-destructive'}
                loading={finance.isLoading}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Expected Position"
                value={formatCurrency(finance.expectedPosition ?? 0)}
                subtitle="Invoiced fees - expenses"
                icon={Scale}
                iconClassName="bg-violet-500/10 text-violet-500"
                loading={finance.isLoading}
              />
              <StatCard
                title="Collection Rate"
                value={formatPercent((finance.collectionRate ?? 0) * 100)}
                subtitle="Total received / invoiced"
                icon={Percent}
                iconClassName="bg-emerald-500/10 text-emerald-500"
                loading={finance.isLoading}
              />
              <StatCard
                title="Outstanding %"
                value={formatPercent((finance.outstandingPercentage ?? 0) * 100)}
                subtitle="Outstanding / invoiced"
                icon={AlertTriangle}
                iconClassName="bg-amber-500/10 text-amber-500"
                loading={finance.isLoading}
              />
              <Link
                to="/finance?tab=invoices&filter=overdue"
                className="block cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <StatCard
                  title="Overdue Invoices"
                  value={(finance.overdueCount ?? 0).toLocaleString()}
                  subtitle="Past due & unpaid"
                  icon={Banknote}
                  iconClassName="bg-destructive/10 text-destructive"
                  loading={finance.isLoading}
                  className="h-full transition-opacity hover:opacity-95"
                />
              </Link>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-1">
                <h3 className="text-sm font-semibold">Attendance trend</h3>
                <p className="text-xs text-muted-foreground">
                  Weekly rate: (present + late) ÷ (active students × days marked that week)
                </p>
              </div>
              <div className="mt-4">
                {attWeeklyLoading ? (
                  <ChartSkeleton height={240} />
                ) : !attWeekly.length || attWeekly.every(p => p.rate === 0) ? (
                  <EmptyState
                    title="No attendance trend yet"
                    description="Rates will appear once teachers record attendance."
                    className="border-0 py-10"
                  />
                ) : (
                  <AppBarChart
                    data={attWeekly}
                    xKey="weekLabel"
                    series={[{ key: 'rate', label: 'Attendance %', radius: 6 }]}
                    height={240}
                    yTickFormatter={(v) => `${v}%`}
                    tooltipFormatter={(v) => `${v}%`}
                    showLegend={false}
                    maxBarSize={36}
                  />
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-1 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold">Scheme book approvals</h3>
                  <p className="text-xs text-muted-foreground">Pipeline by HOD and executive stages</p>
                </div>
              </div>
              {schemeLoading ? (
                <div className="mt-6 h-48 animate-pulse rounded-lg bg-muted" />
              ) : !schemeStats?.total ? (
                <EmptyState
                  title="No scheme books yet"
                  description="Teachers can upload scheme books from the Scheme Book module."
                  className="border-0 py-8"
                />
              ) : (
                <>
                  <div className="mt-2">
                    <AppPieChart
                      data={schemePieData}
                      height={200}
                      showLegend
                      tooltipFormatter={(v) => `${v} entries`}
                    />
                  </div>
                  <ul className="mt-4 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                    <li className="flex justify-between gap-2">
                      <span>Fully approved</span>
                      <span className="font-medium tabular-nums text-foreground">
                        {schemeStats.fullyApproved.toLocaleString()}
                      </span>
                    </li>
                    <li className="flex justify-between gap-2">
                      <span>Awaiting executive approval</span>
                      <span className="font-medium tabular-nums text-foreground">
                        {schemeStats.awaitingFinal.toLocaleString()}
                      </span>
                    </li>
                    <li className="flex justify-between gap-2">
                      <span>Awaiting HOD</span>
                      <span className="font-medium tabular-nums text-foreground">
                        {schemeStats.awaitingHod.toLocaleString()}
                      </span>
                    </li>
                  </ul>
                  <Button variant="outline" size="sm" className="mt-4 w-full gap-2" asChild>
                    <Link to="/scheme-book">
                      Open Scheme Book <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </>
              )}
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
