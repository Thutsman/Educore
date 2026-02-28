import { BookOpen, ClipboardCheck, UserCog, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { EmptyState } from '@/components/common/EmptyState'
import { DataTable, type Column } from '@/components/common/DataTable'
import { AppAreaChart } from '@/components/charts/AppAreaChart'
import { AppBarChart } from '@/components/charts/AppBarChart'
import { useAuth } from '@/hooks/useAuth'
import {
  useAttendanceTrend,
  useSubjectPerformance,
  useTeacherPerformance,
  useDeputyClassPerformance,
} from '@/features/dashboard/hooks/useDeputyDashboard'
import type { TeacherPerfRow } from '@/services/dashboard'

function ChartSkeleton({ height = 220 }: { height?: number }) {
  return <div className="w-full animate-pulse rounded-lg bg-muted" style={{ height }} />
}

const TEACHER_COLUMNS: Column<TeacherPerfRow>[] = [
  { key: 'teacherName',  header: 'Teacher',    sortable: true },
  { key: 'employeeNo',   header: 'Emp. No.',   className: 'text-muted-foreground tabular-nums' },
  {
    key: 'classCount',
    header: 'Classes',
    sortable: true,
    cell: (row) => (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {row.classCount}
      </span>
    ),
  },
  {
    key: 'subjectCount',
    header: 'Subjects',
    sortable: true,
    cell: (row) => (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/10 text-xs font-semibold text-violet-500">
        {row.subjectCount}
      </span>
    ),
  },
]

export function DeputyDashboard() {
  const { profile } = useAuth()

  const { data: attendance, isLoading: attLoading     } = useAttendanceTrend(30)
  const { data: subjects,   isLoading: subjLoading    } = useSubjectPerformance()
  const { data: teachers,   isLoading: teacherLoading } = useTeacherPerformance()
  const { data: classes,    isLoading: classLoading   } = useDeputyClassPerformance()

  const avgAttendance = attendance?.length
    ? Math.round(attendance.reduce((s, p) => s + p.rate, 0) / attendance.length)
    : 0

  const topSubject = subjects?.[0]

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome, ${profile?.full_name?.split(' ')[0] ?? 'Deputy'}`}
        subtitle="Academic performance and staff oversight"
      />

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Avg. Attendance (30d)"
          value={`${avgAttendance}%`}
          icon={ClipboardCheck}
          iconClassName="bg-violet-500/10 text-violet-500"
          trend={{ value: 1.2, label: 'vs prior period' }}
          loading={attLoading}
        />
        <StatCard
          title="Top Subject"
          value={topSubject ? `${topSubject.average}%` : '—'}
          subtitle={topSubject?.subject ?? 'No data yet'}
          icon={BookOpen}
          iconClassName="bg-emerald-500/10 text-emerald-500"
          loading={subjLoading}
        />
        <StatCard
          title="Active Teachers"
          value={teachers?.length ?? '—'}
          subtitle="Assigned this year"
          icon={UserCog}
          iconClassName="bg-orange-500/10 text-orange-500"
          loading={teacherLoading}
        />
      </div>

      {/* ── Charts row ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Attendance trend */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Attendance Trend</h3>
              <p className="text-xs text-muted-foreground">Daily rate — last 30 days</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-500">
              <TrendingUp className="h-3 w-3" /> Live
            </span>
          </div>

          {attLoading ? (
            <ChartSkeleton />
          ) : !attendance?.length ? (
            <EmptyState title="No attendance data" className="py-8 border-0" />
          ) : (
            <AppAreaChart
              data={attendance}
              xKey="date"
              series={[{ key: 'rate', label: 'Attendance %', color: 'hsl(var(--chart-4))' }]}
              height={220}
              yTickFormatter={(v) => `${v}%`}
              tooltipFormatter={(v) => `${v}%`}
              showLegend={false}
            />
          )}
        </div>

        {/* Subject performance */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Subject Performance</h3>
            <p className="text-xs text-muted-foreground">Average grade per subject</p>
          </div>

          {subjLoading ? (
            <ChartSkeleton />
          ) : !subjects?.length ? (
            <EmptyState title="No grade data" className="py-8 border-0" />
          ) : (
            <AppBarChart
              data={subjects}
              xKey="subject"
              series={[{ key: 'average', label: 'Average %', radius: 6, color: 'hsl(var(--chart-2))' }]}
              height={220}
              horizontal
              yTickFormatter={(v) => `${v}%`}
              tooltipFormatter={(v) => `${v}%`}
              showLegend={false}
            />
          )}
        </div>
      </div>

      {/* ── Class performance bar ── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">Class Performance Comparison</h3>
          <p className="text-xs text-muted-foreground">Average grade per class — current term</p>
        </div>

        {classLoading ? (
          <ChartSkeleton height={200} />
        ) : !classes?.length ? (
          <EmptyState title="No class performance data" className="py-8 border-0" />
        ) : (
          <AppBarChart
            data={classes}
            xKey="className"
            series={[{ key: 'average', label: 'Average %', radius: 6 }]}
            height={200}
            yTickFormatter={(v) => `${v}%`}
            tooltipFormatter={(v) => `${v}%`}
            showLegend={false}
            colorByBar
          />
        )}
      </div>

      {/* ── Teacher table ── */}
      <div className="rounded-xl border border-border bg-card p-0 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold">Teacher Workload</h3>
            <p className="text-xs text-muted-foreground">Classes and subjects per teacher</p>
          </div>
        </div>

        <DataTable<TeacherPerfRow>
          columns={TEACHER_COLUMNS}
          data={teachers ?? []}
          keyExtractor={(r) => r.employeeNo}
          loading={teacherLoading}
          sortKey="teacherName"
          sortDir="asc"
          emptyState={
            <EmptyState
              icon={UserCog}
              title="No teachers found"
              description="Teacher assignments will appear here once added."
              className="py-12 border-0 rounded-none"
            />
          }
          className="border-0"
        />
      </div>
    </div>
  )
}
