import { supabase } from './supabase'
import { useStore, EXPENSE_CATS } from '../store'
import type { Block, Currency, GoalKind, State, TxType, Unit, WorkoutType } from '../store'
import { dayKey, fmtWeekday, periodKey, weekKey } from './date'
import type { Period } from './date'
import { money } from './format'
import { createEvent } from './gcal'
import { uid } from './date'

export interface Action { tool: string; input: Record<string, unknown> }
export interface AskResult { reply: string; actions: Action[] }

/** compact snapshot of the user's data the model needs to resolve a command */
function context(s: State, calendar: boolean) {
  const now = new Date()
  const today = dayKey(now)
  const wk = s.growth[weekKey(now)]
  return {
    now: `${today} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    weekday: fmtWeekday(now, 'en', 'long'),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: s.lang,
    defaultExpenseCurrency: s.defaultCurrency,
    currencies: s.currencies,
    habits: s.habits.map((h) => ({ id: h.id, name: h.name, block: h.block, target: h.target ?? null, unit: h.unit ?? null, reminder: h.reminder ?? null, doneToday: (s.logs[today] || []).includes(h.id) })),
    goals: s.goals.map((g) => ({ id: g.id, title: g.title, period: g.period, kind: g.kind, target: g.target })),
    moneyGoals: s.finGoals.map((g) => ({ id: g.id, title: g.title, type: g.type, target: g.target, saved: g.saved })),
    thisWeekGrowth: { place: wk?.place ?? null, skill: wk?.skill ?? null, speechDone: wk?.speech ?? [], languageMinutes: wk?.lang ?? {} },
    expenseCategories: EXPENSE_CATS,
    googleCalendarConnected: calendar,
  }
}

export async function ask(text: string, calendar: boolean): Promise<AskResult> {
  const { data, error } = await supabase.functions.invoke('assistant', { body: { text, context: context(useStore.getState(), calendar) } })
  if (error) {
    // surface the function's own error message when there is one
    const body = await (error as { context?: Response }).context?.json?.().catch(() => null)
    throw new Error(body?.error || error.message)
  }
  if (data?.error) throw new Error(data.error)
  return { reply: data.reply || '', actions: (data.actions || []) as Action[] }
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')
const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : NaN)
const isDay = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
const isTime = (v: unknown) => typeof v === 'string' && /^\d{2}:\d{2}$/.test(v)

/** one-line human description of an action; null if the action is invalid */
export function describe(a: Action, t: (k: string, v?: Record<string, string | number>) => string, s: State): string | null {
  const i = a.input
  const habit = (id: unknown) => s.habits.find((h) => h.id === id)
  switch (a.tool) {
    case 'set_habit_done': {
      const h = habit(i.habit_id)
      if (!h || !isDay(i.date)) return null
      return `${i.done ? '✓' : '○'} ${h.name} · ${i.date === dayKey() ? t('cal.today') : i.date}`
    }
    case 'add_transaction': {
      const amt = num(i.amount)
      if (!(amt > 0) || !isDay(i.date)) return null
      const sign = i.type === 'income' ? '+' : '−'
      return `${sign}${money(amt, i.currency as Currency).replace('−', '')} · ${t(`cat.${str(i.category)}`)}${i.note ? ` · ${i.note}` : ''}${i.date !== dayKey() ? ` · ${i.date}` : ''}`
    }
    case 'add_workout':
      if (!(num(i.minutes) > 0) || !isDay(i.date)) return null
      return `${t(`wt.${str(i.type)}`)} · ${i.minutes} ${t('unit.min')}${i.date !== dayKey() ? ` · ${i.date}` : ''}`
    case 'set_daily_metrics':
      if (!isDay(i.date) || (i.sleep_hours == null && i.steps == null)) return null
      return [i.sleep_hours != null && `${t('sport.sleepH')}: ${i.sleep_hours}`, i.steps != null && `${t('sport.steps')}: ${i.steps}`].filter(Boolean).join(' · ')
    case 'set_body_weight':
      if (!(num(i.kg) > 0)) return null
      return `${t('sport.weight')}: ${i.kg} ${t('unit.kg')}`
    case 'set_growth_item':
      if (!str(i.title)) return null
      return `${t(i.field === 'place' ? 'growth.place' : 'growth.skill')}: ${i.title}${i.done ? ' ✓' : ''}`
    case 'set_speech_activity':
      return `${t('growth.speech')}: ${t(`speech.${str(i.activity)}`)}${i.done ? ' ✓' : ' ○'}`
    case 'add_language_minutes':
      if (!num(i.minutes)) return null
      return `${t(`lang.${str(i.lang)}`)}: ${num(i.minutes) > 0 ? '+' : ''}${i.minutes} ${t('unit.min')}`
    case 'add_habit':
      if (!str(i.name)) return null
      return `${t('habit.new')}: ${i.name}${i.target ? ` · ${i.target} ${i.unit ? t(`unit.${str(i.unit)}`) : ''}` : ''}${isTime(i.reminder) ? ` · ⏰ ${i.reminder}` : ''}`
    case 'update_habit': {
      const h = habit(i.habit_id)
      if (!h) return null
      const parts = [i.name && `«${i.name}»`, i.target != null && `${h.target ?? '—'} → ${i.target}`, i.reminder && (i.reminder === 'off' ? '⏰ off' : `⏰ ${i.reminder}`)].filter(Boolean)
      return `${h.name}: ${parts.join(' · ')}`
    }
    case 'add_goal':
      if (!str(i.title) || !(num(i.target) > 0)) return null
      return `${t('goal.new')} (${t(`period.${str(i.period)}`)}): ${i.title} · ${i.kind === 'custom' ? i.target : money(num(i.target))}`
    case 'set_goal_progress': {
      const g = s.goals.find((x) => x.id === i.goal_id)
      if (!g || isNaN(num(i.value))) return null
      return `${g.title}: ${i.value} / ${g.target}`
    }
    case 'add_to_money_goal': {
      const g = s.finGoals.find((x) => x.id === i.fin_goal_id)
      if (!g || !num(i.amount_usd)) return null
      return `${g.title}: ${num(i.amount_usd) > 0 ? '+' : ''}${money(num(i.amount_usd))}`
    }
    case 'create_calendar_event':
      if (!str(i.title) || !isDay(i.date) || !isTime(i.start_time)) return null
      return `📅 ${i.title} · ${i.date === dayKey() ? t('cal.today') : i.date} ${i.start_time} · ${i.duration_min || 30} ${t('unit.min')}${Array.isArray(i.guests) && i.guests.length ? ` · ✉ ${(i.guests as string[]).join(', ')}` : ''}`
  }
  return null
}

/** apply a confirmed action to the store (cloud sync takes it from there) */
export async function apply(a: Action) {
  const s = useStore.getState()
  const i = a.input
  switch (a.tool) {
    case 'set_habit_done': {
      const on = (s.logs[str(i.date)] || []).includes(str(i.habit_id))
      if (on !== !!i.done) s.toggleHabit(str(i.date), str(i.habit_id))
      return
    }
    case 'add_transaction':
      return s.addTx({ type: i.type as TxType, amount: num(i.amount), currency: (i.currency as Currency) || s.defaultCurrency, category: str(i.category) || 'other', note: str(i.note) || undefined, date: str(i.date) })
    case 'add_workout':
      return s.addWorkout({ type: i.type as WorkoutType, minutes: num(i.minutes), date: str(i.date) })
    case 'set_daily_metrics':
      return s.setDaily(str(i.date), {
        ...(i.sleep_hours != null ? { sleep: num(i.sleep_hours) } : {}),
        ...(i.steps != null ? { steps: Math.round(num(i.steps)) } : {}),
      })
    case 'set_body_weight':
      return s.set('weights', { ...s.weights, [str(i.month)]: num(i.kg) })
    case 'set_growth_item':
      return s.updateGrowth(weekKey(), { [str(i.field)]: { title: str(i.title), done: !!i.done } })
    case 'set_speech_activity': {
      const w = s.growth[weekKey()]?.speech || []
      const act = str(i.activity)
      return s.updateGrowth(weekKey(), { speech: i.done ? [...new Set([...w, act])] : w.filter((x) => x !== act) })
    }
    case 'add_language_minutes': {
      const lang = s.growth[weekKey()]?.lang || {}
      const l = str(i.lang)
      return s.updateGrowth(weekKey(), { lang: { ...lang, [l]: Math.max(0, (lang[l] || 0) + num(i.minutes)) } })
    }
    case 'add_habit':
      return s.upsertHabit({
        id: uid(), createdAt: dayKey(), name: str(i.name), block: (i.block as Block) || 'day',
        target: num(i.target) > 0 ? num(i.target) : undefined, unit: num(i.target) > 0 ? ((i.unit as Unit) || 'min') : undefined,
        reminder: isTime(i.reminder) ? str(i.reminder) : undefined,
      })
    case 'update_habit': {
      const h = s.habits.find((x) => x.id === i.habit_id)
      if (!h) return
      return s.upsertHabit({
        ...h,
        ...(str(i.name) ? { name: str(i.name), seed: undefined } : {}),
        ...(num(i.target) > 0 ? { target: num(i.target) } : {}),
        ...(i.reminder === 'off' ? { reminder: undefined } : isTime(i.reminder) ? { reminder: str(i.reminder) } : {}),
      })
    }
    case 'add_goal': {
      if (i.kind !== 'custom' && (i.period === 'month' || i.period === 'year')) {
        const fp = s.finPlan
        const now = new Date()
        if (i.period === 'month') return s.set('finPlan', { ...fp, monthOverrides: { ...fp.monthOverrides, [dayKey(now).slice(0, 7)]: num(i.target) } })
        return s.set('finPlan', { ...fp, yearOverrides: { ...fp.yearOverrides, [String(now.getFullYear())]: num(i.target) } })
      }
      return s.upsertGoal({ id: uid(), period: i.period as Period, kind: 'custom' as GoalKind, title: str(i.title), target: num(i.target) })
    }
    case 'set_goal_progress': {
      const g = s.goals.find((x) => x.id === i.goal_id)
      if (g) s.setGoalProgress(g.id, periodKey(g.period), num(i.value))
      return
    }
    case 'add_to_money_goal': {
      const g = s.finGoals.find((x) => x.id === i.fin_goal_id)
      if (g) s.upsertFinGoal({ ...g, saved: Math.max(0, g.saved + num(i.amount_usd)) })
      return
    }
    case 'create_calendar_event': {
      const [h, m] = str(i.start_time).split(':').map(Number)
      const [y, mo, d] = str(i.date).split('-').map(Number)
      const start = new Date(y, mo - 1, d, h, m)
      const guests = Array.isArray(i.guests) ? (i.guests as string[]) : []
      return createEvent({ title: str(i.title), start, end: new Date(start.getTime() + (num(i.duration_min) || 30) * 60000), guests, meet: guests.length > 0 })
    }
  }
}
