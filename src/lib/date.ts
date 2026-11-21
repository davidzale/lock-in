export type Period = 'week' | 'month' | 'year'

export const pad = (n: number) => String(n).padStart(2, '0')
export const dayKey = (d: Date = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseDay = (k: string) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}
export const addDays = (d: Date, n: number) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() + n)
  return x
}
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
/** Monday-based week start */
export const weekStart = (d: Date = new Date()) => addDays(d, -((d.getDay() + 6) % 7))
export const weekKey = (d: Date = new Date()) => dayKey(weekStart(d))
export const monthKey = (d: Date = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
export const daysBetween = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000)

export function isoWeek(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return Math.ceil(((t.getTime() - y0.getTime()) / 86400000 + 1) / 7)
}

/** [start inclusive, end exclusive] */
export function periodRange(p: Period, d: Date = new Date()): [Date, Date] {
  if (p === 'week') {
    const s = weekStart(d)
    return [s, addDays(s, 7)]
  }
  if (p === 'month') return [new Date(d.getFullYear(), d.getMonth(), 1), new Date(d.getFullYear(), d.getMonth() + 1, 1)]
  return [new Date(d.getFullYear(), 0, 1), new Date(d.getFullYear() + 1, 0, 1)]
}
export const periodKey = (p: Period, d: Date = new Date()) =>
  p === 'week' ? weekKey(d) : p === 'month' ? monthKey(d) : String(d.getFullYear())

export const inRange = (k: string, [s, e]: [Date, Date]) => {
  const x = parseDay(k)
  return x >= s && x < e
}
export function daysIn([s, e]: [Date, Date]) {
  const out: string[] = []
  for (let d = s; d < e; d = addDays(d, 1)) out.push(dayKey(d))
  return out
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const locale = (lang: string) => (lang === 'ru' ? 'ru-RU' : 'en-US')
export const fmtWeekday = (d: Date, lang: string, style: 'short' | 'long' = 'short') =>
  d.toLocaleDateString(locale(lang), { weekday: style })
export const fmtDate = (d: Date, lang: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }) =>
  d.toLocaleDateString(locale(lang), opts)
