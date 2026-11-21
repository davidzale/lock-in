import type { Goal, GrowthWeek, State, Tx } from '../store'
import { addDays, dayKey, daysIn, inRange, periodKey, periodRange } from './date'
import type { Period } from './date'

export const DAY_OK = 0.8

export function dayPct(s: Pick<State, 'habits' | 'logs'>, key: string) {
  if (!s.habits.length) return 0
  const done = (s.logs[key] || []).filter((id) => s.habits.some((h) => h.id === id)).length
  return done / s.habits.length
}

export function streak(s: Pick<State, 'habits' | 'logs'>, from = new Date()) {
  let d = from
  if (dayPct(s, dayKey(d)) < DAY_OK) d = addDays(d, -1)
  let n = 0
  while (n < 3650 && dayPct(s, dayKey(d)) >= DAY_OK) {
    n++
    d = addDays(d, -1)
  }
  return n
}

export function bestStreak(s: Pick<State, 'habits' | 'logs'>, range: [Date, Date]) {
  let best = 0, cur = 0
  for (const k of daysIn(range)) {
    if (dayPct(s, k) >= DAY_OK) best = Math.max(best, ++cur)
    else cur = 0
  }
  return best
}

export function totals(txs: Tx[], range: [Date, Date]) {
  let income = 0, expense = 0, fixed = 0, variable = 0
  const byCat: Record<string, number> = {}
  for (const t of txs) {
    if (!inRange(t.date, range)) continue
    if (t.type === 'income') {
      income += t.usd
      if (t.category === 'fixed') fixed += t.usd
      else variable += t.usd
    } else {
      expense += t.usd
      byCat[t.category] = (byCat[t.category] || 0) + t.usd
    }
  }
  return { income, expense, net: income - expense, fixed, variable, byCat }
}

export function balance(s: Pick<State, 'txs' | 'startBalance'>) {
  return s.txs.reduce((a, t) => a + (t.type === 'income' ? t.usd : -t.usd), s.startBalance)
}

export function goalValue(s: Pick<State, 'txs'>, g: Goal, d = new Date()) {
  const range = periodRange(g.period, d)
  if (g.kind === 'income') return totals(s.txs, range).income
  if (g.kind === 'savings') return Math.max(0, totals(s.txs, range).net)
  return g.progress?.[periodKey(g.period, d)] || 0
}

export function growthScore(w: GrowthWeek | undefined, targets: State['growthTargets']) {
  const parts = {
    place: w?.place?.done ? 1 : 0,
    skill: w?.skill?.done ? 1 : 0,
    speech: Math.min(1, (w?.speech.length || 0) / Math.max(1, targets.speech)),
    lang: (() => {
      const ks = Object.keys(targets.lang).filter((k) => targets.lang[k] > 0)
      if (!ks.length) return 1
      return ks.reduce((a, k) => a + Math.min(1, (w?.lang[k] || 0) / targets.lang[k]), 0) / ks.length
    })(),
  }
  const done = (parts.place >= 1 ? 1 : 0) + (parts.skill >= 1 ? 1 : 0) + (parts.speech >= 1 ? 1 : 0) + (parts.lang >= 1 ? 1 : 0)
  const pct = (parts.place + parts.skill + parts.speech + parts.lang) / 4
  return { parts, done, pct }
}

export function sportTotals(s: Pick<State, 'workouts'>, range: [Date, Date]) {
  const byType: Record<string, { n: number; min: number }> = {}
  let minutes = 0, count = 0
  for (const w of s.workouts) {
    if (!inRange(w.date, range)) continue
    count++
    minutes += w.minutes
    const b = (byType[w.type] ||= { n: 0, min: 0 })
    b.n++
    b.min += w.minutes
  }
  return { byType, minutes, count }
}

export function avgMetric(s: Pick<State, 'daily'>, range: [Date, Date], k: 'sleep' | 'steps') {
  const vals = daysIn(range).map((d) => s.daily[d]?.[k]).filter((v): v is number => typeof v === 'number')
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}

export function habitAvg(s: Pick<State, 'habits' | 'logs'>, range: [Date, Date]) {
  const today = dayKey()
  const ks = daysIn(range).filter((k) => k <= today)
  if (!ks.length) return 0
  return ks.reduce((a, k) => a + dayPct(s, k), 0) / ks.length
}

export const periods: Period[] = ['week', 'month', 'year']
