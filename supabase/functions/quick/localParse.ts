// Free, on-device parser for simple spoken commands (no AI, no internet):
//   «потратил 25 лари на продукты, такси 12 лари и вчера кофе 4 доллара»
//   «заработал 500 долларов фриланс», «получил зарплату 4200»
//   «сделал йогу и медитацию»
// Dependency-free: the Siri edge function bundles a copy of this file (scripts/sync-parser.mjs).
export interface Action { tool: string; input: Record<string, unknown> }
export interface ParseCtx { defaultCurrency: string; habits: { id: string; name: string }[]; /** when the command was spoken (default: now) */ now?: Date }
const pad = (n: number) => String(n).padStart(2, '0')
const dayKey = (d: Date = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const addDays = (d: Date, n: number) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x }

const INCOME = /заработ|получил|зарплат|оклад|доход|пришл[аио]|перевели мне|гонорар|фриланс|earned|got paid|salary|income|freelance|paid me/i
const DONE = /сделал|выполнил|отметь|закончил|прош[её]л|done|did|finished|completed/i
const CAT: [string, RegExp][] = [
  ['food', /продукт|еда|ед[уы]|кофе|кафе|ресторан|обед|ужин|завтрак|пицц|бургер|шаурм|доставк|супермаркет|grocer|food|coffee|lunch|dinner|breakfast|restaurant|cafe/i],
  ['transport', /такси|метро|бензин|топлив|автобус|транспорт|парковк|uber|bolt|yandex go|taxi|fuel|gas|bus|parking/i],
  ['housing', /аренд|квартир|коммунал|свет|интернет|rent|utilities|electricity/i],
  ['health', /аптек|врач|лекарств|стоматолог|анализ|pharmacy|doctor|medicine|dentist/i],
  ['sport', /спортзал|\bзал\b|абонемент|спорт|тренировк|gym|fitness/i],
  ['subscriptions', /подписк|netflix|spotify|youtube|icloud|chatgpt|subscription/i],
  ['shopping', /одежд|обув|покупк|техник|кроссовк|shopping|clothes|shoes/i],
  ['entertainment', /кино|бар\b|клуб|развлеч|концерт|игр|cinema|movie|bar|club|concert|game/i],
  ['travel', /билет|отел|гостиниц|поездк|самол[её]т|перел[её]т|flight|hotel|trip|ticket/i],
]

function currencyOf(t: string): 'USD' | 'GEL' | 'RUB' | null {
  if (/лари|лар\b|gel|₾/i.test(t)) return 'GEL'
  if (/доллар|бакс|usd|\$|dollar|buck/i.test(t)) return 'USD'
  if (/рубл|₽|rub/i.test(t)) return 'RUB'
  return null
}

function amountOf(t: string): number | null {
  const m = t.match(/(\d+(?:[.,]\d+)?)\s*(тыс(?:яч[аи]?)?|к\b|k\b)?/i)
  if (!m) return null
  let v = Number(m[1].replace(',', '.'))
  if (m[2]) v *= 1000
  return v > 0 ? v : null
}

function dateOf(t: string, now: Date): string {
  if (/позавчера|day before yesterday/i.test(t)) return dayKey(addDays(now, -2))
  if (/вчера|yesterday/i.test(t)) return dayKey(addDays(now, -1))
  return dayKey(now)
}

const W = '[a-zа-яё]*' // word tail (JS \\w is ASCII-only)
const STRIP = new RegExp(
  [
    '(\\d+(?:[.,]\\d+)?)\\s*(тыс' + W + '|к|k)?(?=\\s|$)',
    'лари', 'лар', 'gel', '₾', 'доллар' + W, 'бакс' + W, 'usd', '\\$', 'рубл' + W, '₽', 'rub',
    'потратил' + W, 'заплатил' + W, 'купил' + W, 'заработал' + W, 'получил' + W, 'вчера', 'позавчера', 'сегодня',
    'spent', 'paid', 'bought', 'earned',
  ].map((x) => `(?:^|\\s)${x}(?=\\s|$)`).join('|'),
  'gi',
)
const LEAD = /^(?:на|за|в|во|for|on)\s+/i

function noteOf(t: string) {
  let n = (' ' + t + ' ').replace(STRIP, ' ').replace(STRIP, ' ').replace(/\s+/g, ' ').trim()
  n = n.replace(LEAD, '').trim()
  return n ? n[0].toUpperCase() + n.slice(1, 40) : undefined
}

/** returns actions in the same shape the AI assistant produces, or [] if nothing was understood */
export function parseLocal(text: string, s: ParseCtx): Action[] {
  const out: Action[] = []
  const parts = text.split(/(?<!\d)[.,](?!\d)|[;!?\n]+|\s+(?:и|а ещё|а также|плюс|and|also)\s+/i).map((x) => x.trim()).filter(Boolean)
  const now = s.now ?? new Date()
  let lastDate = dayKey(now)
  for (const p of parts) {
    const date = /вчера|позавчера|yesterday/i.test(p) ? dateOf(p, now) : lastDate
    lastDate = date
    const amount = amountOf(p)
    if (amount) {
      const income = INCOME.test(p)
      const cur = currencyOf(p) || (income ? 'USD' : (s.defaultCurrency as 'USD' | 'GEL' | 'RUB'))
      const category = income ? (/зарплат|оклад|salary/i.test(p) ? 'fixed' : 'variable') : (CAT.find(([, re]) => re.test(p))?.[0] ?? 'other')
      out.push({ tool: 'add_transaction', input: { type: income ? 'income' : 'expense', amount, currency: cur, category, note: noteOf(p) ?? null, date } })
      continue
    }
    // habits: «сделал йогу», or just the habit name after a 'done' word earlier in the phrase
    if (DONE.test(p) || DONE.test(text)) {
      const low = p.toLowerCase()
      for (const h of s.habits) {
        const stem = h.name.toLowerCase().slice(0, Math.min(6, Math.max(3, h.name.length - 1)))
        if (low.includes(stem)) out.push({ tool: 'set_habit_done', input: { habit_id: h.id, date, done: true } })
      }
    }
  }
  return out
}

const CAT_RU: Record<string, string> = { food: 'Еда', housing: 'Жильё', transport: 'Транспорт', entertainment: 'Развлечения', health: 'Здоровье', sport: 'Спорт', subscriptions: 'Подписки', shopping: 'Покупки', travel: 'Путешествия', other: 'Прочее', fixed: 'Зарплата', variable: 'Доход' }
const SYM: Record<string, string> = { USD: '$', GEL: '₾', RUB: '₽' }
/** short human summary, e.g. "−12 ₾ · Еда · Кофе; ✓ Йога" (used for Siri's spoken reply) */
export function summarize(actions: Action[], habits: { id: string; name: string }[]) {
  return actions
    .map((a) => {
      const i = a.input
      if (a.tool === 'add_transaction') {
        const amt = `${i.type === 'income' ? '+' : '−'}${i.amount} ${SYM[String(i.currency)] || i.currency}`
        return [amt, CAT_RU[String(i.category)] || i.category, i.note].filter(Boolean).join(' · ')
      }
      if (a.tool === 'set_habit_done') return `✓ ${habits.find((h) => h.id === i.habit_id)?.name || ''}`
      return ''
    })
    .filter(Boolean)
    .join('; ')
}
