import type { ReactNode, ElementType } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/utils/cn'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ElementType
  iconClassName?: string
  trend?: {
    value: number        // e.g. 4.5 means +4.5%
    label?: string       // e.g. "vs last term"
  }
  loading?: boolean
  className?: string
  children?: ReactNode  // optional chart or sparkline slot
}

/**
 * Standard metric card for dashboards.
 *
 * Usage:
 *   <StatCard
 *     title="Total Students"
 *     value={1243}
 *     icon={GraduationCap}
 *     trend={{ value: 3.2, label: 'vs last year' }}
 *   />
 */
export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClassName,
  trend,
  loading = false,
  className,
  children,
}: StatCardProps) {
  const trendPositive = trend && trend.value > 0
  const trendNegative = trend && trend.value < 0
  const TrendIcon = trendPositive ? TrendingUp : trendNegative ? TrendingDown : Minus

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-sm font-medium text-muted-foreground">
            {title}
          </p>

          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
          ) : (
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {value}
            </p>
          )}

          {subtitle && !loading && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}

          {trend && !loading && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                trendPositive && 'text-emerald-600 dark:text-emerald-400',
                trendNegative && 'text-destructive',
                !trendPositive && !trendNegative && 'text-muted-foreground'
              )}
            >
              <TrendIcon className="h-3 w-3" />
              <span>
                {trendPositive ? '+' : ''}{trend.value.toFixed(1)}%
              </span>
              {trend.label && (
                <span className="text-muted-foreground font-normal">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
              iconClassName ?? 'bg-primary/10 text-primary'
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Optional bottom slot for sparkline / mini chart */}
      {children && (
        <div className="mt-4">{children}</div>
      )}
    </div>
  )
}
