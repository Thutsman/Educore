import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { CHART_COLORS } from './AppAreaChart'
import { cn } from '@/utils/cn'

interface BarSeries {
  key: string
  label: string
  color?: string
  radius?: number
}

interface AppBarChartProps {
  data: unknown[]
  xKey: string
  series: BarSeries[]
  height?: number
  horizontal?: boolean
  stacked?: boolean
  yTickFormatter?: (v: number) => string
  tooltipFormatter?: (v: number | string, name: string) => string
  showLegend?: boolean
  colorByBar?: boolean        // each bar gets its own chart color
  maxBarSize?: number
  className?: string
}

export function AppBarChart({
  data,
  xKey,
  series,
  height = 220,
  horizontal = false,
  stacked = false,
  yTickFormatter,
  tooltipFormatter,
  showLegend = true,
  colorByBar = false,
  maxBarSize = 40,
  className,
}: AppBarChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 5, right: 5, left: horizontal ? 80 : -10, bottom: 0 }}
          barCategoryGap="30%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            horizontal={!horizontal}
            vertical={horizontal}
          />

          {horizontal ? (
            <>
              <XAxis
                type="number"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={yTickFormatter}
              />
              <YAxis
                type="category"
                dataKey={xKey}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={76}
              />
            </>
          ) : (
            <>
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
            </>
          )}

          <Tooltip
            content={<ChartTooltip formatter={tooltipFormatter} />}
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
          />

          {showLegend && series.length > 1 && (
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}
            />
          )}

          {series.map((s, i) => {
            const color = s.color ?? CHART_COLORS[i % CHART_COLORS.length]
            return (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={color}
                stackId={stacked ? 'stack' : undefined}
                radius={s.radius ?? [4, 4, 0, 0]}
                maxBarSize={maxBarSize}
              >
                {colorByBar &&
                  data.map((_, di) => (
                    <Cell
                      key={di}
                      fill={CHART_COLORS[di % CHART_COLORS.length]}
                    />
                  ))}
              </Bar>
            )
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
