import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { AppAreaChart } from '@/components/charts/AppAreaChart'
import { AppBarChart } from '@/components/charts/AppBarChart'
import { AppPieChart } from '@/components/charts/AppPieChart'
import {
  useSchoolStats, useEnrollmentTrend, useClassPerformance,
} from '@/features/dashboard/hooks/useHeadmasterDashboard'
import {
  useMonthlyFinancials, usePaymentMethodBreakdown,
} from '@/features/dashboard/hooks/useBursarDashboard'
import {
  useAttendanceTrend, useSubjectPerformance,
} from '@/features/dashboard/hooks/useDeputyDashboard'
import { Users, GraduationCap, TrendingUp, BarChart2 } from 'lucide-react'
import { formatNumber } from '@/utils/format'

export function AnalyticsPage() {
  const { data: stats, isLoading: statsLoading } = useSchoolStats()
  const { data: enrollment = [] } = useEnrollmentTrend(12)
  const { data: classPerf = [] } = useClassPerformance()
  const { data: attendance = [] } = useAttendanceTrend(60)
  const { data: subjectPerf = [] } = useSubjectPerformance()
  const { data: financials = [] } = useMonthlyFinancials(12)
  const { data: paymentMethods = [] } = usePaymentMethodBreakdown()

  return (
    <div className="space-y-8">
      <PageHeader title="Analytics" subtitle="School-wide performance and financial insights" />

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Students" value={stats ? formatNumber(stats.totalStudents) : '—'} icon={Users} loading={statsLoading} />
        <StatCard title="Active Staff" value={stats ? formatNumber(stats.activeStaff) : '—'} icon={Users} iconClassName="bg-blue-500/10 text-blue-600" loading={statsLoading} />
        <StatCard title="Avg. Attendance" value={stats ? `${stats.attendanceRate}%` : '—'} icon={TrendingUp} iconClassName="bg-emerald-500/10 text-emerald-600" loading={statsLoading} />
        <StatCard title="Fee Collection" value={stats ? `${stats.feeCollectionRate}%` : '—'} icon={GraduationCap} iconClassName="bg-amber-500/10 text-amber-600" loading={statsLoading} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <BarChart2 className="h-4 w-4 text-primary" />
            Student Enrollment (12 months)
          </h3>
          <AppAreaChart
            data={enrollment}
            series={[{ key: 'students', label: 'New Enrollments', color: 'hsl(var(--chart-1))' }]}
            xKey="month"
            height={220}
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">Attendance Rate (60 days)</h3>
          <AppAreaChart
            data={attendance}
            series={[{ key: 'rate', label: 'Attendance %', color: 'hsl(var(--chart-2))' }]}
            xKey="date"
            height={220}
          />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">Revenue vs Expenses (12 months)</h3>
          <AppAreaChart
            data={financials}
            series={[
              { key: 'revenue',  label: 'Revenue',  color: 'hsl(var(--chart-1))' },
              { key: 'expenses', label: 'Expenses', color: 'hsl(var(--chart-4))' },
            ]}
            xKey="month"
            height={220}
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">Payment Methods</h3>
          <AppPieChart
            data={paymentMethods.map(p => ({ name: p.method.replace('_', ' '), value: p.total }))}
            height={220}
          />
        </div>
      </div>

      {/* Charts row 3 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">Average Grade by Subject</h3>
          <AppBarChart
            data={subjectPerf}
            xKey="subject"
            series={[{ key: 'average', label: 'Avg. Grade', color: 'hsl(var(--chart-3))' }]}
            horizontal
            height={Math.max(220, subjectPerf.length * 36)}
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">Class Performance</h3>
          <AppBarChart
            data={classPerf}
            xKey="className"
            series={[{ key: 'average', label: 'Avg. Grade', color: 'hsl(var(--chart-5))' }]}
            colorByBar
            height={220}
          />
        </div>
      </div>
    </div>
  )
}
