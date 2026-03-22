import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import { cn } from '@/utils/cn'

interface AppRadialChartProps {
  /** 0 – 100 */
  value: number
  label?: string
  sublabel?: string
  color?: string
  size?: number
  className?: string
}

/**
 * Single-value radial/gauge chart.
 * Used for fee collection rate, attendance rate, etc.
 */
export function AppRadialChart({
  value,
  label,
  sublabel,
  color = 'hsl(var(--chart-1))',
  size = 180,
  className,
}: AppRadialChartProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const s = Math.max(size, 80)

  const chartData = [
    { value: clamped, fill: color },
  ]

  return (
    <div
      className={cn('relative flex min-h-0 min-w-0 items-center justify-center', className)}
      style={{ width: s, height: s }}
    >
      <ResponsiveContainer width="100%" height={s}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="100%"
          barSize={10}
          data={chartData}
          startAngle={90}
          endAngle={-270}
        >
          {/* Background track */}
          <RadialBar
            dataKey="value"
            cornerRadius={6}
            background={{ fill: 'hsl(var(--muted))' }}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold tabular-nums text-foreground">
          {clamped.toFixed(0)}%
        </span>
        {label && (
          <span className="mt-0.5 text-xs font-medium text-foreground/70">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-[10px] text-muted-foreground">{sublabel}</span>
        )}
      </div>
    </div>
  )
}
