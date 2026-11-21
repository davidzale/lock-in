import type { Habit, SessionKind, SportData } from '../store'
import { dayKey, daysBetween, parseDay } from './date'
import { PROGRAM_WEEKS } from './program'

export const STRENGTH_DAYS = [1, 3, 5] // Mon, Wed, Fri

/** 1-based program week (keeps counting after 12 — the plan repeats its last phase) */
export function programWeek(sp: SportData, d = new Date()) {
  if (!sp.start) return 1
  return Math.max(1, Math.floor(daysBetween(parseDay(sp.start), d) / 7) + 1)
}
export const weekForPlan = (w: number) => Math.min(w, PROGRAM_WEEKS)

/** alternate A / B by how many strength sessions are done */
export function nextDay(sp: SportData): 'A' | 'B' {
  const n = sp.sessions.filter((s) => s.kind === 'A' || s.kind === 'B').length
  return n % 2 === 0 ? 'A' : 'B'
}

export const doneOn = (sp: SportData, date: string, kinds: SessionKind[]) => sp.sessions.find((s) => s.date === date && kinds.includes(s.kind))
export const doneToday = (sp: SportData, kinds: SessionKind[]) => doneOn(sp, dayKey(), kinds)

export function flowMinutes(habits: Habit[], kind: 'yoga' | 'stretch') {
  const h = habits.find((x) => x.seed === kind) || habits.find((x) => x.name.toLowerCase().includes(kind === 'yoga' ? 'йог' : 'растяж') || x.name.toLowerCase().includes(kind === 'yoga' ? 'yoga' : 'stretch'))
  return h?.target && h.unit === 'min' ? h.target : 20
}
