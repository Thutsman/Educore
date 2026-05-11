/** Canonical storage format for invoices — avoids user typo drift (e.g. "T2" vs "Term 2"). */

export const BILLING_TERM_NUMBERS = [1, 2, 3] as const

export type BillingTermNumber = (typeof BILLING_TERM_NUMBERS)[number]

export function buildBillingPeriodKey(year: number, term: number): string {
  return `${year} Term ${term}`
}

/** Years shown in Finance billing dropdowns (calendar year; widen window as needed). */
export function getBillingYearOptions(referenceYear = new Date().getFullYear()): number[] {
  const out: number[] = []
  for (let y = referenceYear - 4; y <= referenceYear + 5; y++) out.push(y)
  return out
}

/** Returns canonical key only when both year and term are set (matches stored `billing_period_key`). */
export function billingPeriodKeyFromYearTermStrings(year: string, term: string): string | undefined {
  const y = year.trim()
  const t = term.trim()
  if (!y || !t) return undefined
  const yi = Number(y)
  const ti = Number(t)
  if (!Number.isFinite(yi) || !Number.isFinite(ti)) return undefined
  if (!BILLING_TERM_NUMBERS.includes(ti as BillingTermNumber)) return undefined
  return buildBillingPeriodKey(yi, ti)
}
