import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardCheck,
  BookMarked,
  Clock,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
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
import { formatPercent } from '@/utils/format'

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
