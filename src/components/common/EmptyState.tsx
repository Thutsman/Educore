import type { ReactNode, ElementType } from 'react'
import { FolderOpen } from 'lucide-react'
import { cn } from '@/utils/cn'

interface EmptyStateProps {
  icon?: ElementType
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

/**
 * Standard empty state for tables, lists, and data panels.
 *
 * Usage:
 *   <EmptyState
 *     icon={GraduationCap}
 *     title="No students found"
 *     description="Get started by adding a new student."
 *     action={<Button>Add Student</Button>}
 *   />
 */
export function EmptyState({
  icon: Icon = FolderOpen,
  title = 'No data found',
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center',
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
