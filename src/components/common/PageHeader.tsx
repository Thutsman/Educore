import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

/**
 * Consistent page-level header used at the top of every module page.
 *
 * Usage:
 *   <PageHeader
 *     title="Students"
 *     subtitle="Manage student records and enrolments"
 *     actions={<Button>Add Student</Button>}
 *   />
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="space-y-0.5">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
