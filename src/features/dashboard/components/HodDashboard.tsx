import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  ClipboardCheck,
  AlertTriangle,
  BookOpen,
  UserCog,
  LineChart,
  HelpCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { EmptyState } from '@/components/common/EmptyState'
import { DataTable, type Column } from '@/components/common/DataTable'
import { AppAreaChart } from '@/components/charts/AppAreaChart'
import { AppBarChart } from '@/components/charts/AppBarChart'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import {
  useHodTeacher,
  useDepartmentStats,
  useDepartmentSubjectPerformance,
  useDepartmentAttendanceTrend,
  useDepartmentTeacherWorkload,
  useDepartmentClassesOverview,
} from '@/features/dashboard/hooks/useHodDashboard'
import type { DepartmentTeacherRow, DepartmentClassRow } from '@/services/hod-dashboard'
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
  return <div className="w-full animate-pulse rounded-lg bg-muted" style={{ height }} />
}

const TEACHER_COLUMNS: Column<DepartmentTeacherRow>[] = [
  { key: 'teacherName', header: 'Teacher', sortable: true },
  {
    key: 'employeeNo',
    header: 'Emp. No.',
    className: 'text-muted-foreground tabular-nums',
  },
  {
    key: 'classCount',
    header: 'Classes',
    sortable: true,
    cell: row => (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {row.classCount}
      </span>
    ),
  },
  {
    key: 'subjectCount',
    header: 'Subjects',
    sortable: true,
    cell: row => (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/10 text-xs font-semibold text-violet-500">
        {row.subjectCount}
      </span>
    ),
  },
]

const CLASS_COLUMNS: Column<DepartmentClassRow>[] = [
  { key: 'className', header: 'Class', sortable: true },
  {
    key: 'gradeLevel',
    header: 'Form/Grade',
    className: 'text-muted-foreground tabular-nums',
  },
  {
    key: 'studentCount',
    header: 'Students',
    sortable: true,
    className: 'tabular-nums',
  },
  {
    key: 'average',
    header: 'Avg. %',
    sortable: true,
    className: 'tabular-nums',
  },
  {
    key: 'attendanceRate',
    header: 'Attendance (7d)',
    sortable: true,
    cell: row => <span className="tabular-nums">{formatPercent(row.attendanceRate)}</span>,
  },
]

const HOD_QUICK_LINKS = [
  { to: '/class-analytics', label: 'Class Analytics', icon: LineChart },
  { to: '/reports', label: 'Term Reports', icon: ClipboardCheck },
  { to: '/assessments', label: 'Assessments', icon: BookOpen },
  { to: '/attendance', label: 'Attendance', icon: Users },
]

export function HodDashboard() {
  const { profile, user } = useAuth()
  const { teacher, isLoading: teacherLoading } = useHodTeacher()
  const departmentId = teacher?.department_id ?? null

  const {
    data: stats,
    isLoading: statsLoading,
  } = useDepartmentStats(departmentId)
  const {
    data: subjects,
    isLoading: subjLoading,
  } = useDepartmentSubjectPerformance(departmentId)
  const {
    data: attendance,
    isLoading: attLoading,
  } = useDepartmentAttendanceTrend(departmentId, 30)
  const {
    data: teachers,
    isLoading: teacherRowsLoading,
  } = useDepartmentTeacherWorkload(departmentId)
  const {
    data: classes,
    isLoading: classRowsLoading,
  } = useDepartmentClassesOverview(departmentId, 7)

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

  const firstName = profile?.full_name?.split(' ')[0] ?? 'HOD'

  const passRate = stats?.passRate ?? 0

  const isDeptMissing = !teacherLoading && !departmentId

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        subtitle="Department-level academic and staff overview"
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
          {isDeptMissing && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-400">No department set</p>
                <p className="mt-1 text-amber-700 dark:text-amber-500">
                  Your user account is not yet linked to a department as HOD. Ask your school
                  administrator to assign you as the head of a department.
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            ) : !stats ? (
              <>
                <StatCard
                  title="Dept Students"
                  value="—"
                  subtitle="No data available"
                  icon={Users}
                  iconClassName="bg-blue-500/10 text-blue-500"
                />
                <StatCard
                  title="Dept Attendance"
                  value="—"
                  subtitle="No data available"
                  icon={ClipboardCheck}
                  iconClassName="bg-violet-500/10 text-violet-500"
                />
                <StatCard
                  title="Dept Pass Rate"
                  value="—"
                  subtitle="No assessment data"
                  icon={BookOpen}
                  iconClassName="bg-emerald-500/10 text-emerald-500"
                />
                <StatCard
                  title="At-risk Learners"
                  value="—"
                  subtitle="No assessment data"
                  icon={AlertTriangle}
                  iconClassName="bg-red-500/10 text-red-500"
                />
              </>
            ) : (
              <>
                <StatCard
                  title="Dept Students"
                  value={stats.totalStudents.toLocaleString()}
                  subtitle={`${stats.activeStudents} active`}
                  icon={Users}
                  iconClassName="bg-blue-500/10 text-blue-500"
                />
                <StatCard
                  title="Dept Attendance"
                  value={formatPercent(stats.attendanceRate)}
                  subtitle="This week average"
                  icon={ClipboardCheck}
                  iconClassName="bg-violet-500/10 text-violet-500"
                />
                <StatCard
                  title="Dept Pass Rate"
                  value={formatPercent(passRate)}
                  subtitle="Latest assessment window"
                  icon={BookOpen}
                  iconClassName="bg-emerald-500/10 text-emerald-500"
                />
                <StatCard
                  title="At-risk Learners"
                  value={stats.atRiskCount.toLocaleString()}
                  subtitle="Below pass threshold"
                  icon={AlertTriangle}
                  iconClassName="bg-red-500/10 text-red-500"
                />
              </>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">Attendance Trend</h3>
                <p className="text-xs text-muted-foreground">Daily rate for department classes</p>
              </div>
              {attLoading ? (
                <ChartSkeleton />
              ) : !attendance?.length ? (
                <EmptyState
                  title="No attendance data"
                  description="Attendance records for your department will appear here once captured."
                  className="py-8 border-0"
                />
              ) : (
                <AppAreaChart
                  data={attendance}
                  xKey="date"
                  series={[{ key: 'rate', label: 'Attendance %', color: 'hsl(var(--chart-4))' }]}
                  height={220}
                  yTickFormatter={v => `${v}%`}
                  tooltipFormatter={v => `${v}%`}
                  showLegend={false}
                />
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">Subject Performance</h3>
                <p className="text-xs text-muted-foreground">
                  Average grade per subject in your department
                </p>
              </div>
              {subjLoading ? (
                <ChartSkeleton />
              ) : !subjects?.length ? (
                <EmptyState
                  title="No grade data"
                  description="Subject performance will appear once grades are entered."
                  className="py-8 border-0"
                />
              ) : (
                <AppBarChart
                  data={subjects}
                  xKey="subject"
                  series={[{ key: 'average', label: 'Average %', radius: 6 }]}
                  height={220}
                  horizontal
                  yTickFormatter={v => `${v}%`}
                  tooltipFormatter={v => `${v}%`}
                  showLegend={false}
                />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Classes Overview</h3>
                <p className="text-xs text-muted-foreground">
                  Student counts, performance and attendance for department classes
                </p>
              </div>
            </div>
            <DataTable<DepartmentClassRow>
              columns={CLASS_COLUMNS}
              data={classes ?? []}
              keyExtractor={r => r.classId}
              loading={classRowsLoading}
              sortKey="className"
              sortDir="asc"
              emptyState={
                <EmptyState
                  icon={Users}
                  title="No classes found"
                  description="Once classes are linked to your department, they will appear here."
                  className="py-12 border-0 rounded-none"
                />
              }
              className="border-0"
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-0 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="text-sm font-semibold">Teacher Coverage & Workload</h3>
                <p className="text-xs text-muted-foreground">
                  Classes and subjects per teacher in your department
                </p>
              </div>
            </div>
            <DataTable<DepartmentTeacherRow>
              columns={TEACHER_COLUMNS}
              data={teachers ?? []}
              keyExtractor={r => r.employeeNo}
              loading={teacherRowsLoading}
              sortKey="teacherName"
              sortDir="asc"
              emptyState={
                <EmptyState
                  icon={UserCog}
                  title="No teachers found"
                  description="Teacher assignments in your department will appear here once added."
                  className="py-12 border-0 rounded-none"
                />
              }
              className="border-0"
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold">Quick actions</h3>
            <div className="flex flex-wrap gap-3">
              {HOD_QUICK_LINKS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/60"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="help" className="mt-6">
          <div className="space-y-4 rounded-xl border border-border bg-card p-6 text-sm">
            <h2 className="text-base font-semibold">How to use the HOD Dashboard</h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                Use the <span className="font-medium">KPI cards</span> to monitor overall learner
                numbers, attendance and pass rates for your department.
              </li>
              <li>
                The <span className="font-medium">Attendance Trend</span> and{' '}
                <span className="font-medium">Subject Performance</span> charts help you spot
                patterns over time and identify subjects or weeks that need attention.
              </li>
              <li>
                The <span className="font-medium">Classes Overview</span> highlights large classes,
                low averages or weak attendance so you can prioritise support.
              </li>
              <li>
                The <span className="font-medium">Teacher Coverage & Workload</span> table shows how
                teaching is distributed across your department, helping you balance loads and find
                gaps.
              </li>
              <li>
                Use the <span className="font-medium">Quick actions</span> to jump directly into
                analytics, reports, assessments or attendance modules.
              </li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

