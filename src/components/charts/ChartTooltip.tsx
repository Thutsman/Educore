import { cn } from '@/utils/cn'
import { parseISO, isValid } from 'date-fns'

interface TooltipPayloadItem {
  name: string
  value: number | string | null
  color?: string
  dataKey?: string
  payload?: unknown
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  formatter?: (value: number | string | null, name: string) => string
  labelFormatter?: (label: string) => string
  className?: string
}

/**
 * Shared tooltip used across all chart types.
 * Styled to match the app design system.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  className,
}: ChartTooltipProps) {
  if (!active) return null

  const firstItem = payload?.[0]
  const record = firstItem?.payload as
    | { marked?: boolean; dayType?: 'weekday' | 'weekend' }
    | undefined

  const hasValues = !!payload?.length
  const marked = record?.marked

  const isoLabel = typeof label === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(label)
  const derivedDayType: 'weekday' | 'weekend' | undefined = (() => {
    if (record?.dayType) return record.dayType
    if (!isoLabel) return undefined
    const d = parseISO(label!)
    if (!isValid(d)) return undefined
    const dow = d.getDay()
    return dow === 0 || dow === 6 ? 'weekend' : 'weekday'
  })()

  const missingMessage =
    derivedDayType === 'weekend'
      ? 'Weekend / holiday — register not marked'
      : derivedDayType === 'weekday'
        ? 'Register not marked'
        : 'No data available'

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-popover px-3 py-2.5 shadow-lg text-sm',
        className
      )}
    >
      {label && (
        <p className="mb-1.5 font-medium text-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      {hasValues ? (
        <div className="space-y-1">
          {payload.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">{item.name}:</span>
              <span className="font-medium text-foreground tabular-nums">
                {formatter
                  ? formatter(item.value, item.name)
                  : typeof item.value === 'number'
                    ? item.value.toLocaleString()
                    : item.value ?? '—'}
              </span>
            </div>
          ))}
          {marked === false && <p className="mt-2 text-xs text-muted-foreground">{missingMessage}</p>}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{missingMessage}</p>
      )}
    </div>
  )
}
