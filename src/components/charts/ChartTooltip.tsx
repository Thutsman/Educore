import { cn } from '@/utils/cn'

interface TooltipPayloadItem {
  name: string
  value: number | string
  color?: string
  dataKey?: string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  formatter?: (value: number | string, name: string) => string
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
  if (!active || !payload?.length) return null

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
      <div className="space-y-1">
        {payload.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.name}:</span>
            <span className="font-medium text-foreground tabular-nums">
              {formatter
                ? formatter(item.value, item.name)
                : typeof item.value === 'number'
                  ? item.value.toLocaleString()
                  : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
