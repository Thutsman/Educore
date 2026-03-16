import { Link } from 'react-router-dom'
import { Clock, Calendar } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTeacherRecord } from '@/features/dashboard/hooks/useTeacherDashboard'
import { useAcademicYears } from '@/features/academics/hooks/useAcademics'
import { useTimetableEntries } from '../hooks/useTimetable'

export function TeacherTimetableCard() {
  const { user } = useAuth()
  const { data: teacher } = useTeacherRecord(user?.id)
  const { data: years = [] } = useAcademicYears()
  const currentYearId = years.find((y) => y.is_current)?.id ?? years[0]?.id
  const { data: entries = [], isLoading } = useTimetableEntries({
    teacherId: teacher?.id,
    academicYearId: currentYearId,
  })

  const today = new Date().getDay()
  const schoolDayIndex = today >= 1 && today <= 5 ? today : 1
  const todayEntries = entries.filter((e) => e.day_of_week === schoolDayIndex).sort((a, b) => a.period_start.localeCompare(b.period_start))

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">My Timetable</h3>
        <Link
          to="/timetable"
          className="text-xs font-medium text-primary hover:underline"
        >
          View full timetable
        </Link>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : todayEntries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Calendar className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No lessons scheduled today</p>
          <p className="text-xs text-muted-foreground">Your timetable will appear here once admin adds entries.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {todayEntries.slice(0, 5).map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2"
            >
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.subject_name}</p>
                <p className="text-xs text-muted-foreground">{(e.period_start ?? '').slice(0, 5)} · {e.class_name}{e.room ? ` · ${e.room}` : ''}</p>
              </div>
            </div>
          ))}
          {todayEntries.length > 5 && (
            <Link to="/timetable" className="block text-center text-xs text-muted-foreground hover:text-foreground">
              +{todayEntries.length - 5} more
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
