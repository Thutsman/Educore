import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { cn } from '@/utils/cn'

export const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

interface AreaSeries {
  key: string
  label: string
  color?: string
  stackId?: string
}

interface AppAreaChartProps {
  data: unknown[]
  xKey: string
  series: AreaSeries[]
  height?: number
  yTickFormatter?: (v: number) => string
  tooltipFormatter?: (v: number | string, name: string) => string
  showLegend?: boolean
  className?: string
  gradient?: boolean
}

/**
 * Responsive area chart with design-system colours and custom tooltip.
 */
export function AppAreaChart({
  data,
  xKey,
  series,
  height = 220,
  yTickFormatter,
  tooltipFormatter,
  showLegend = true,
  className,
  gradient = true,
}: AppAreaChartProps) {
  const h = Math.max(height, 120)
  return (
    <div className={cn('w-full min-w-0', className)} style={{ height: h }}>
      <ResponsiveContainer width="100%" height={h}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <defs>
            {series.map((s, i) => {
              const color = s.color ?? CHART_COLORS[i % CHART_COLORS.length]
              return (
                <linearGradient
                  key={s.key}
                  id={`gradient-${s.key}`}
                  x1="0" y1="0" x2="0" y2="1"
                >
                  <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              )
            })}
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />

          <XAxis
            dataKey={xKey}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />

          <YAxis
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={yTickFormatter}
          />

          <Tooltip
            content={
              <ChartTooltip formatter={tooltipFormatter} />
            }
            cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
          />

          {showLegend && (
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}
            />
          )}

          {series.map((s, i) => {
            const color = s.color ?? CHART_COLORS[i % CHART_COLORS.length]
            return (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={color}
                strokeWidth={2}
                fill={gradient ? `url(#gradient-${s.key})` : color}
                fillOpacity={gradient ? 1 : 0.1}
                stackId={s.stackId}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            )
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
