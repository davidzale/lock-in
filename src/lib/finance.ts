import type { Recurring, State } from '../store'

/** the latest entry whose key (YYYY-MM or YYYY) is at or before `key` */
function carry<T>(map: Record<string, T>, key: string): T | undefined {
  const k = Object.keys(map).filter((x) => x <= key).sort().pop()
  return k ? map[k] : undefined
}
export const monthTarget = (s: Pick<State, 'finPlan'>, mk: string) => carry(s.finPlan.monthOverrides, mk) ?? s.finPlan.incomeMonth
export const yearTarget = (s: Pick<State, 'finPlan'>, y: string) => s.finPlan.yearOverrides[y] ?? s.finPlan.incomeYear
export const budgetsFor = (s: Pick<State, 'budgets' | 'budgetsHist'>, mk: string) => carry(s.budgetsHist || {}, mk) ?? s.budgets

export const recurringActive = (r: Recurring, mk: string) => !r.start || r.start <= mk
export function recurringAmount(r: Recurring, mk: string) {
  const a = (r.amounts || []).filter((x) => x.from <= mk).sort((x, y) => (x.from < y.from ? -1 : 1)).pop()
  return a ? a.amount : r.amount
}
