import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { addDays, dayKey, daysBetween, parseDay, uid } from './lib/date'
import type { Period } from './lib/date'

export type Lang = 'en' | 'ru'
export type Theme = 'dark' | 'light' | 'system'
export type Block = 'morning' | 'day' | 'evening'
export type Unit = 'min' | 'ml' | 'pages' | 'reps' | 'steps'
export type Currency = 'USD' | 'GEL' | 'RUB'
export const CURRENCIES: Currency[] = ['USD', 'GEL', 'RUB']

export interface Habit {
  id: string
  name: string
  block: Block
  target?: number
  unit?: Unit
  reminder?: string
  /** auto progression: +step every N days if done ≥80% of those days */
  prog?: { step: number; everyDays: number; max?: number }
  lastProgAt?: string
  createdAt: string
  /** seed id: name follows app language until the user renames it */
  seed?: string
}
export type GoalKind = 'income' | 'savings' | 'custom'
export interface Goal {
  id: string
  period: Period
  title: string
  kind: GoalKind
  target: number
  /** manual progress for custom goals, keyed by period key */
  progress?: Record<string, number>
  seed?: string
}
export type TxType = 'income' | 'expense'
export type IncomeKind = 'fixed' | 'variable'
export interface Tx {
  id: string
  type: TxType
  amount: number
  currency: Currency
  usd: number
  category: string
  note?: string
  date: string
}
export type FinGoalType = 'savings' | 'purchase' | 'debt'
export interface FinGoal { id: string; type: FinGoalType; title: string; target: number; saved: number; seed?: string }
export interface Recurring { id: string; title: string; amount: number; currency: Currency; category: string; day: number; paid: string[] }
export type WorkoutType = 'strength' | 'yoga' | 'stretch' | 'walk' | 'other'
export interface Workout { id: string; date: string; type: WorkoutType; minutes: number; note?: string }
export interface GrowthWeek {
  place?: { title: string; done: boolean }
  skill?: { title: string; done: boolean }
  speech: string[]
  lang: Record<string, number>
}
export interface DailyMetrics { sleep?: number; steps?: number }
export interface ProgNote { id: string; habitId: string; from: number; to: number; date: string }

export const EXPENSE_CATS = ['food', 'housing', 'transport', 'entertainment', 'health', 'sport', 'subscriptions', 'shopping', 'travel', 'other'] as const
export const SPEECH_ACTS = ['camera', 'retell', 'aloud', 'explain', 'diction'] as const
export const LANGS = ['en', 'fr', 'de'] as const

interface Data {
  lang: Lang
  theme: Theme
  currencies: Currency[]
  defaultCurrency: Currency
  rates: { GEL: number; RUB: number; updatedAt?: string }
  startBalance: number
  habits: Habit[]
  logs: Record<string, string[]>
  goals: Goal[]
  txs: Tx[]
  budgets: Record<string, number>
  finGoals: FinGoal[]
  recurring: Recurring[]
  workouts: Workout[]
  growth: Record<string, GrowthWeek>
  growthTargets: { speech: number; lang: Record<string, number> }
  daily: Record<string, DailyMetrics>
  weights: Record<string, number>
  progNotes: ProgNote[]
}

interface Actions {
  set: <K extends keyof Data>(k: K, v: Data[K]) => void
  setLang: (l: Lang) => void
  toggleHabit: (date: string, id: string) => void
  upsertHabit: (h: Habit) => void
  removeHabit: (id: string) => void
  upsertGoal: (g: Goal) => void
  removeGoal: (id: string) => void
  setGoalProgress: (id: string, pk: string, v: number) => void
  addTx: (t: Omit<Tx, 'id' | 'usd'>) => void
  removeTx: (id: string) => void
  upsertFinGoal: (g: FinGoal) => void
  removeFinGoal: (id: string) => void
  upsertRecurring: (r: Recurring) => void
  removeRecurring: (id: string) => void
  payRecurring: (id: string, month: string) => void
  addWorkout: (w: Omit<Workout, 'id'>) => void
  removeWorkout: (id: string) => void
  updateGrowth: (wk: string, patch: Partial<GrowthWeek>) => void
  setDaily: (date: string, m: DailyMetrics) => void
  dismissProg: (id: string) => void
  runProgression: () => void
  importData: (d: Partial<Data>) => void
}

export type State = Data & Actions

export const toUSD = (amount: number, cur: Currency, rates: Data['rates']) =>
  cur === 'USD' ? amount : amount / (rates[cur] || 1)

export const SEED_NAMES: Record<string, [string, string]> = {
  wake: ['Wake up', 'Проснуться'],
  face: ['Face routine', 'Уход за лицом'],
  teeth: ['Brush teeth', 'Почистить зубы'],
  water: ['Drink water', 'Выпить воды'],
  yoga: ['Yoga', 'Йога'],
  meditation: ['Meditation', 'Медитация'],
  work: ['Work', 'Работа'],
  walk: ['Walk', 'Прогулка'],
  stretch: ['Stretching', 'Растяжка'],
  night: ['Teeth + face wash', 'Зубы + умывание'],
  earn: ['Earn', 'Заработать'],
  save: ['Save', 'Отложить'],
  piggy: ['Savings', 'Копилка'],
  debts: ['Debts', 'Долги'],
}
const seedName = (seed: string, lang: Lang) => SEED_NAMES[seed]?.[lang === 'ru' ? 1 : 0] ?? seed

function seedHabits(lang: Lang): Habit[] {
  const today = dayKey()
  const h = (seed: string, block: Block, extra: Partial<Habit> = {}): Habit => ({ id: uid(), name: seedName(seed, lang), seed, block, createdAt: today, ...extra })
  return [
    h('wake', 'morning'),
    h('face', 'morning'),
    h('teeth', 'morning'),
    h('water', 'morning', { target: 500, unit: 'ml' }),
    h('yoga', 'morning', { target: 20, unit: 'min', prog: { step: 5, everyDays: 14, max: 45 } }),
    h('meditation', 'morning', { target: 10, unit: 'min', prog: { step: 5, everyDays: 14, max: 30 } }),
    h('work', 'day'),
    h('walk', 'day', { target: 60, unit: 'min' }),
    h('stretch', 'evening', { target: 20, unit: 'min', prog: { step: 5, everyDays: 14, max: 40 } }),
    h('night', 'evening'),
  ]
}
function seedGoals(lang: Lang): Goal[] {
  return [
    { id: uid(), period: 'week', title: seedName('earn', lang), seed: 'earn', kind: 'income', target: 1000 },
    { id: uid(), period: 'month', title: seedName('earn', lang), seed: 'earn', kind: 'income', target: 5000 },
    { id: uid(), period: 'year', title: seedName('earn', lang), seed: 'earn', kind: 'income', target: 100000 },
    { id: uid(), period: 'year', title: seedName('save', lang), seed: 'save', kind: 'savings', target: 50000 },
  ]
}

const detectLang = (): Lang => (typeof navigator !== 'undefined' && navigator.language?.startsWith('ru') ? 'ru' : 'en')

function initial(): Data {
  const lang = detectLang()
  return {
    lang,
    theme: 'dark',
    currencies: ['USD', 'GEL'],
    defaultCurrency: 'GEL',
    rates: { GEL: 2.7, RUB: 80 },
    startBalance: 0,
    habits: seedHabits(lang),
    logs: {},
    goals: seedGoals(lang),
    txs: [],
    budgets: {},
    finGoals: [
      { id: uid(), type: 'savings', title: seedName('piggy', lang), seed: 'piggy', target: 50000, saved: 0 },
      { id: uid(), type: 'debt', title: seedName('debts', lang), seed: 'debts', target: 0, saved: 0 },
    ],
    recurring: [],
    workouts: [],
    growth: {},
    growthTargets: { speech: 3, lang: { en: 150, fr: 60, de: 60 } },
    daily: {},
    weights: {},
    progNotes: [],
  }
}

const emptyWeek = (): GrowthWeek => ({ speech: [], lang: {} })

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial(),
      set: (k, v) => set({ [k]: v } as Partial<State>),
      setLang: (l) =>
        set((s) => {
          // seeded items follow the language unless the user renamed them
          const tr = <T extends { seed?: string }>(x: T, key: 'name' | 'title'): T => {
            const cur = (x as Record<string, unknown>)[key]
            return x.seed && cur === seedName(x.seed, s.lang) ? { ...x, [key]: seedName(x.seed, l) } : x
          }
          return {
            lang: l,
            habits: s.habits.map((h) => tr(h, 'name')),
            goals: s.goals.map((g) => tr(g, 'title')),
            finGoals: s.finGoals.map((g) => tr(g, 'title')),
          }
        }),
      toggleHabit: (date, id) =>
        set((s) => {
          const cur = s.logs[date] || []
          const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
          return { logs: { ...s.logs, [date]: next } }
        }),
      upsertHabit: (h) => set((s) => ({ habits: s.habits.some((x) => x.id === h.id) ? s.habits.map((x) => (x.id === h.id ? h : x)) : [...s.habits, h] })),
      removeHabit: (id) => set((s) => ({ habits: s.habits.filter((x) => x.id !== id) })),
      upsertGoal: (g) => set((s) => ({ goals: s.goals.some((x) => x.id === g.id) ? s.goals.map((x) => (x.id === g.id ? g : x)) : [...s.goals, g] })),
      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((x) => x.id !== id) })),
      setGoalProgress: (id, pk, v) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, progress: { ...g.progress, [pk]: Math.max(0, v) } } : g)) })),
      addTx: (t) => set((s) => ({ txs: [{ ...t, id: uid(), usd: toUSD(t.amount, t.currency, s.rates) }, ...s.txs] })),
      removeTx: (id) => set((s) => ({ txs: s.txs.filter((x) => x.id !== id) })),
      upsertFinGoal: (g) => set((s) => ({ finGoals: s.finGoals.some((x) => x.id === g.id) ? s.finGoals.map((x) => (x.id === g.id ? g : x)) : [...s.finGoals, g] })),
      removeFinGoal: (id) => set((s) => ({ finGoals: s.finGoals.filter((x) => x.id !== id) })),
      upsertRecurring: (r) => set((s) => ({ recurring: s.recurring.some((x) => x.id === r.id) ? s.recurring.map((x) => (x.id === r.id ? r : x)) : [...s.recurring, r] })),
      removeRecurring: (id) => set((s) => ({ recurring: s.recurring.filter((x) => x.id !== id) })),
      payRecurring: (id, month) => {
        const r = get().recurring.find((x) => x.id === id)
        if (!r || r.paid.includes(month)) return
        get().addTx({ type: 'expense', amount: r.amount, currency: r.currency, category: r.category, note: r.title, date: dayKey() })
        set((s) => ({ recurring: s.recurring.map((x) => (x.id === id ? { ...x, paid: [...x.paid, month] } : x)) }))
      },
      addWorkout: (w) => set((s) => ({ workouts: [{ ...w, id: uid() }, ...s.workouts] })),
      removeWorkout: (id) => set((s) => ({ workouts: s.workouts.filter((x) => x.id !== id) })),
      updateGrowth: (wk, patch) => set((s) => ({ growth: { ...s.growth, [wk]: { ...emptyWeek(), ...s.growth[wk], ...patch } } })),
      setDaily: (date, m) => set((s) => ({ daily: { ...s.daily, [date]: { ...s.daily[date], ...m } } })),
      dismissProg: (id) => set((s) => ({ progNotes: s.progNotes.filter((n) => n.id !== id) })),
      runProgression: () => {
        const s = get()
        const today = new Date()
        const notes: ProgNote[] = []
        const habits = s.habits.map((h) => {
          if (!h.prog || h.target == null) return h
          if (h.prog.max != null && h.target >= h.prog.max) return h
          const since = parseDay(h.lastProgAt || h.createdAt)
          const n = h.prog.everyDays
          if (daysBetween(since, today) < n) return h
          let done = 0
          for (let i = 1; i <= n; i++) if (s.logs[dayKey(addDays(today, -i))]?.includes(h.id)) done++
          if (done / n < 0.8) return h
          const to = Math.min(h.target + h.prog.step, h.prog.max ?? Infinity)
          notes.push({ id: uid(), habitId: h.id, from: h.target, to, date: dayKey(today) })
          return { ...h, target: to, lastProgAt: dayKey(today) }
        })
        if (notes.length) set({ habits, progNotes: [...notes, ...s.progNotes] })
      },
      importData: (d) => set(d as Partial<State>),
    }),
    { name: 'lockin-v1', version: 1 },
  ),
)

export const emptyGrowthWeek = emptyWeek
