import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { CHART_COLORS } from './AppAreaChart'
import { cn } from '@/utils/cn'

interface PieDataItem {
  name: string
  value: number
  color?: string
}

interface AppPieChartProps {
  data: PieDataItem[]
  height?: number
  donut?: boolean             // inner radius for donut effect
  tooltipFormatter?: (v: number | string | null, name: string) => string
  showLegend?: boolean
  className?: string
}

export function AppPieChart({
  data,
  height = 220,
  donut = true,
  tooltipFormatter,
  showLegend = true,
  className,
}: AppPieChartProps) {
  const h = Math.max(height, 120)
  const outerRadius = h * 0.32
  const innerRadius = donut ? outerRadius * 0.6 : 0

  return (
    <div className={cn('w-full min-w-0', className)} style={{ height: h }}>
      <ResponsiveContainer width="100%" height={h}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={donut ? 3 : 0}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={entry.color ?? CHART_COLORS[i % CHART_COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip
            content={<ChartTooltip formatter={tooltipFormatter} />}
          />

          {showLegend && (
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
