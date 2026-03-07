import { PageHeader } from '@/components/common/PageHeader'
import { useTeacherRecord } from '@/features/dashboard/hooks/useTeacherDashboard'
import { useAuth } from '@/hooks/useAuth'
import {
  useHomeroomClass,
  useClassAttendanceTrend,
} from '@/features/dashboard/hooks/useTeacherDashboard'
import { useClassAssessmentAverages } from '@/features/assessments/hooks/useAssessments'
import { AppAreaChart } from '@/components/charts/AppAreaChart'
import { AppBarChart } from '@/components/charts/AppBarChart'

export function ClassAnalyticsPage() {
  const { user } = useAuth()
  const { data: teacher } = useTeacherRecord(user?.id)
  const { data: homeroom } = useHomeroomClass(teacher?.id)
  const { data: attTrend = [] } = useClassAttendanceTrend(homeroom?.id, 30)
  const { data: assessmentAverages = [] } = useClassAssessmentAverages(homeroom?.id ?? null)

  const attendanceChartData = attTrend.map((p) => ({
    date: p.date,
    rate: p.rate,
  }))

  const assessmentChartData = assessmentAverages.slice(0, 10).map((a) => ({
    name: a.title.length > 10 ? a.title.slice(0, 10) + '…' : a.title,
    average: Math.round(a.average * 10) / 10,
  }))

  if (!teacher) {
    return (
      <div className="space-y-6">
        <PageHeader title="Class Analytics" subtitle="Performance overview for your class" />
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          Your account is not linked to a teacher record. Ask your administrator to assign you as a class teacher.
        </div>
      </div>
    )
  }

  if (!homeroom) {
    return (
      <div className="space-y-6">
        <PageHeader title="Class Analytics" subtitle="Performance overview for your class" />
        <div className="rounded-xl border border-muted bg-muted/30 p-4 text-sm text-muted-foreground">
          You are not assigned as a class teacher. Class analytics are available when you have a homeroom class.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Class Analytics"
        subtitle={`Performance overview for ${homeroom.name}`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold">Attendance trend (last 30 days)</h3>
          {attendanceChartData.length > 0 ? (
            <AppAreaChart
              data={attendanceChartData}
              xKey="date"
              series={[{ key: 'rate', label: 'Attendance %' }]}
              height={220}
              yTickFormatter={(v) => `${v}%`}
              tooltipFormatter={(v) => `${v}%`}
            />
          ) : (
            <p className="text-muted-foreground text-sm">No attendance data for this period.</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold">Assessment averages</h3>
          {assessmentChartData.length > 0 ? (
            <AppBarChart
              data={assessmentChartData}
              xKey="name"
              series={[{ key: 'average', label: 'Average' }]}
              height={220}
              colorByBar
            />
          ) : (
            <p className="text-muted-foreground text-sm">No assessment data yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">Class summary</h3>
        <dl className="grid gap-2 sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground text-xs">Class</dt>
            <dd className="font-medium">{homeroom.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Students</dt>
            <dd className="font-medium">{homeroom.student_count}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Room</dt>
            <dd className="font-medium">{homeroom.room ?? '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
