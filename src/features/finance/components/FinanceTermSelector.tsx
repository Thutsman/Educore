import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAcademicYears, useTerms } from '@/features/academics/hooks/useAcademics'

export interface FinanceTermSelection {
  academic_year_id: string | undefined
  term_id: string | undefined
  date_from: string | undefined
  date_to: string | undefined
}

interface FinanceTermSelectorProps {
  value: FinanceTermSelection
  onChange: (v: FinanceTermSelection) => void
  className?: string
}

export function FinanceTermSelector({ value, onChange, className }: FinanceTermSelectorProps) {
  const { data: years = [] } = useAcademicYears()
  const { data: terms = [] } = useTerms(value.academic_year_id)

  const handleYearChange = (yearId: string) => {
    if (yearId === '__all__') {
      onChange({
        academic_year_id: undefined,
        term_id: undefined,
        date_from: undefined,
        date_to: undefined,
      })
      return
    }
    const year = years.find((y) => y.id === yearId)
    onChange({
      academic_year_id: yearId,
      term_id: undefined,
      date_from: year?.start_date,
      date_to: year?.end_date,
    })
  }

  const handleTermChange = (termId: string) => {
    if (termId === '__all__') {
      const year = years.find((y) => y.id === value.academic_year_id)
      onChange({
        academic_year_id: value.academic_year_id,
        term_id: undefined,
        date_from: year?.start_date,
        date_to: year?.end_date,
      })
      return
    }
    const term = terms.find((t) => t.id === termId)
    onChange({
      academic_year_id: value.academic_year_id,
      term_id: termId,
      date_from: term?.start_date,
      date_to: term?.end_date,
    })
  }

  const effectiveYearId = value.academic_year_id ?? '__all__'
  const effectiveTermId = value.term_id ?? '__all__'

  return (
    <div className={className}>
      <Select
        value={effectiveYearId}
        onValueChange={handleYearChange}
      >
        <SelectTrigger className="w-[140px] sm:w-[160px] h-9 sm:h-10">
          <SelectValue placeholder="Academic Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All years</SelectItem>
          {years.map((y) => (
            <SelectItem key={y.id} value={y.id}>
              {y.name || y.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={effectiveTermId}
        onValueChange={handleTermChange}
      >
        <SelectTrigger className="w-[120px] sm:w-[140px] h-9 sm:h-10 ml-2">
          <SelectValue placeholder="Term" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All terms</SelectItem>
          {terms.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
