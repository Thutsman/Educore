import { Input } from '@/components/ui/input'

interface DateRangePickerProps {
  from: string | null
  to: string | null
  onChange: (value: { from: string | null; to: string | null }) => void
}

export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="date"
        className="w-40"
        value={from ?? ''}
        onChange={(e) => onChange({ from: e.target.value || null, to })}
      />
      <span className="text-xs text-muted-foreground">to</span>
      <Input
        type="date"
        className="w-40"
        value={to ?? ''}
        onChange={(e) => onChange({ from, to: e.target.value || null })}
      />
    </div>
  )
}

