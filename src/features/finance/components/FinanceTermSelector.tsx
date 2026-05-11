import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/utils/cn'
import { getBillingYearOptions } from '@/features/finance/billingPeriod'

/** Inputs/selects on Finance grey page — elevated surface so controls read as interactive vs page `--background`. */
export const financeToolbarControlClassName =
  'bg-card border-2 border-border shadow-md text-foreground placeholder:text-muted-foreground ring-1 ring-black/[0.04] dark:ring-white/[0.06]'

const BP_ALL = '__bp_all__'

/** Toolbar filters for invoice lists and bursar finance views — no Academics dependency. */
export interface FinanceInvoiceListSelection {
  billing_year: string
  billing_term: string
  date_from: string | undefined
  date_to: string | undefined
}

interface FinanceInvoiceListToolbarProps {
  value: FinanceInvoiceListSelection
  onChange: (v: FinanceInvoiceListSelection) => void
  className?: string
}

export function BillingPeriodYearTermControls({
  billing_year,
  billing_term,
  onBillingYearChange,
  onBillingTermChange,
  includeAllOption,
  optionalClearPair,
  className,
}: {
  billing_year: string
  billing_term: string
  onBillingYearChange: (y: string) => void
  onBillingTermChange: (t: string) => void
  includeAllOption: boolean
  /** When true, choosing “All” on year or term clears both (optional billing period on a single invoice). */
  optionalClearPair?: boolean
  className?: string
}) {
  const years = getBillingYearOptions()
  const yearValue = includeAllOption ? (billing_year || BP_ALL) : billing_year
  const termValue = includeAllOption ? (billing_term || BP_ALL) : billing_term

  const handleYear = (v: string) => {
    if (optionalClearPair && v === BP_ALL) {
      onBillingYearChange('')
      onBillingTermChange('')
      return
    }
    const next = v === BP_ALL ? '' : v
    onBillingYearChange(next)
  }
  const handleTerm = (v: string) => {
    if (optionalClearPair && v === BP_ALL) {
      onBillingYearChange('')
      onBillingTermChange('')
      return
    }
    const next = v === BP_ALL ? '' : v
    onBillingTermChange(next)
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Select value={yearValue} onValueChange={handleYear}>
        <SelectTrigger
          className={cn('h-9 w-[112px] sm:h-10', financeToolbarControlClassName)}
          aria-label="Billing calendar year"
        >
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {includeAllOption && <SelectItem value={BP_ALL}>All years</SelectItem>}
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={termValue} onValueChange={handleTerm}>
        <SelectTrigger
          className={cn('h-9 w-[116px] sm:h-10', financeToolbarControlClassName)}
          aria-label="Billing term"
        >
          <SelectValue placeholder="Term" />
        </SelectTrigger>
        <SelectContent>
          {includeAllOption && <SelectItem value={BP_ALL}>All terms</SelectItem>}
          {[1, 2, 3].map((t) => (
            <SelectItem key={t} value={String(t)}>
              Term {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/** Required year + term — use when empty strings should show placeholders (e.g. Issue class drafts). */
export function BillingPeriodYearTermRequiredControls({
  billing_year,
  billing_term,
  onBillingYearChange,
  onBillingTermChange,
  className,
}: {
  billing_year: string
  billing_term: string
  onBillingYearChange: (y: string) => void
  onBillingTermChange: (t: string) => void
  className?: string
}) {
  const years = getBillingYearOptions()
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Select
        value={billing_year === '' ? undefined : billing_year}
        onValueChange={onBillingYearChange}
      >
        <SelectTrigger
          className={cn('h-9 w-[112px] sm:h-10', financeToolbarControlClassName)}
          aria-label="Billing calendar year"
        >
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={billing_term === '' ? undefined : billing_term}
        onValueChange={onBillingTermChange}
      >
        <SelectTrigger
          className={cn('h-9 w-[116px] sm:h-10', financeToolbarControlClassName)}
          aria-label="Billing term"
        >
          <SelectValue placeholder="Term" />
        </SelectTrigger>
        <SelectContent>
          {[1, 2, 3].map((t) => (
            <SelectItem key={t} value={String(t)}>
              Term {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function FinanceInvoiceListToolbar({ value, onChange, className }: FinanceInvoiceListToolbarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <BillingPeriodYearTermControls
        billing_year={value.billing_year}
        billing_term={value.billing_term}
        onBillingYearChange={(billing_year) => onChange({ ...value, billing_year })}
        onBillingTermChange={(billing_term) => onChange({ ...value, billing_term })}
        includeAllOption
      />
      <Input
        type="date"
        className={cn('h-9 w-[140px] sm:h-10', financeToolbarControlClassName)}
        value={value.date_from ?? ''}
        onChange={(e) => onChange({ ...value, date_from: e.target.value || undefined })}
        aria-label="Invoices from date"
      />
      <span className="text-muted-foreground text-sm">–</span>
      <Input
        type="date"
        className={cn('h-9 w-[140px] sm:h-10', financeToolbarControlClassName)}
        value={value.date_to ?? ''}
        onChange={(e) => onChange({ ...value, date_to: e.target.value || undefined })}
        aria-label="Invoices to date"
      />
    </div>
  )
}
