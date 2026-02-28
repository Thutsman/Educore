import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/utils/cn'

// Maps path segments to human-readable labels
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  headmaster: 'Headmaster',
  deputy: 'Deputy',
  bursar: 'Bursar',
  hod: 'HOD',
  teacher: 'Teacher',
  staff: 'Staff',
  parent: 'Parent',
  student: 'Student',
  students: 'Students',
  academics: 'Academics',
  attendance: 'Attendance',
  finance: 'Finance',
  communication: 'Communication',
  assets: 'Assets',
  analytics: 'Analytics',
  users: 'User Management',
  settings: 'Settings',
  new: 'New',
  edit: 'Edit',
  profile: 'Profile',
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ')
}

function getLabel(segment: string): string {
  return SEGMENT_LABELS[segment] ?? capitalize(segment)
}

export function Breadcrumbs({ className }: { className?: string }) {
  const location = useLocation()

  const segments = location.pathname
    .split('/')
    .filter(Boolean)

  // Don't render breadcrumbs for a single-level path (e.g. /dashboard)
  if (segments.length <= 1) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <span className="text-sm font-medium text-foreground">
          {segments[0] ? getLabel(segments[0]) : 'Home'}
        </span>
      </div>
    )
  }

  const crumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const isLast = index === segments.length - 1
    const label = getLabel(segment)
    return { href, label, isLast }
  })

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1', className)}
    >
      <Link
        to="/dashboard"
        className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {crumbs.map(({ href, label, isLast }) => (
        <span key={href} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          {isLast ? (
            <span className="text-sm font-medium text-foreground">{label}</span>
          ) : (
            <Link
              to={href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
