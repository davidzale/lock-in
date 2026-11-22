// Free, on-device parser for simple spoken commands (no AI, no internet):
//   «потратил 25 лари на продукты, такси 12 лари и вчера кофе 4 доллара»
//   «заработал 500 долларов фриланс», «получил зарплату 4200»
//   «сделал йогу и медитацию»
// Dependency-free: the Siri edge function bundles a copy of this file (scripts/sync-parser.mjs).
export interface Action { tool: string; input: Record<string, unknown> }
export interface ParseCtx { defaultCurrency: string; habits: { id: string; name: string; seed?: string }[]; /** when the command was spoken (default: now) */ now?: Date }
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
  if (/лари|лар\b|lari|gel|₾/i.test(t)) return 'GEL'
  if (/доллар|бакс|usd|\$|dollar|buck/i.test(t)) return 'USD'
  if (/рубл|₽|rub|ruble|rouble/i.test(t)) return 'RUB'
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

/** words that mean a seeded habit, in RU and EN (so “did yoga” finds «Йога») */
const HABIT_ALIASES: Record<string, string[]> = {
  wake: ['просну', 'подъём', 'подъем', 'woke', 'wake'],
  face: ['лицо', 'лица', 'face', 'skincare', 'skin care'],
  teeth: ['зубы', 'teeth', 'brush'],
  water: ['вод', 'water'],
  yoga: ['йог', 'yoga'],
  meditation: ['медит', 'meditat'],
  work: ['работ', 'work'],
  walk: ['прогул', 'гулял', 'walk'],
  stretch: ['растяж', 'stretch'],
  night: ['умыл', 'умыв', 'wash'],
}

/** filler words dropped from the note */
const STOP = new Set(('я мы ты мой моя моё мое мои моем моём моей мою свой своя своё свое свои своей своем своём своего своих сегодня вчера позавчера также тоже ещё еще и а но на за в во с со по у от для до это так просто вот ну уже около примерно ' +
  'i me my mine we our on for the a an at from also today yesterday and to of in with by just about then plus').split(' '))
const VERB = /^(потратил|заплатил|купил|заработал|получил|отдал|перевели|сделал|выполнил|spent|spend|paid|pay|bought|buy|earned|earn|got|received|made|did|done)[а-яёa-z]*$/i
const CURW = /^(лари|лар|lari|laris|gel|₾|доллар[а-яё]*|dollars?|бакс[а-яё]*|bucks?|usd|\$|рубл[а-яё]*|rubles?|roubles?|₽|rub|тыс[а-яё]*|к|k)$/i

function noteOf(t: string, salary: boolean) {
  if (salary) return undefined // the category already says «Зарплата»
  const words = t
    .replace(/[^\p{L}\p{N}$₾₽\s-]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w && !/^\d/.test(w) && !CURW.test(w) && !VERB.test(w) && !STOP.has(w.toLowerCase()))
    .slice(0, 4)
  const n = words.join(' ')
  return n ? n[0].toUpperCase() + n.slice(1, 40) : undefined
}

const NUM = /(\d+(?:[.,]\d+)?)\s*(тыс[а-яё]*|к|k)?(?![\d:])/gi
const CUR_AFTER = /^\s*(лари|лар|lari|laris|gel|₾|доллар[а-яё]*|dollars?|бакс[а-яё]*|bucks?|usd|\$|рубл[а-яё]*|rubles?|roubles?|₽|rub)(?=[\s,.;!?]|$)/i
const SPLIT = /(?:^|[\s,.;!?])(также|тоже|ещё|еще|потом|плюс|и|а|потратил[а-яё]*|заплатил[а-яё]*|купил[а-яё]*|заработал[а-яё]*|получил[а-яё]*|also|and|then|plus|spent|paid|bought|earned|got)(?=\s|$)/gi
const EXPENSE = /потратил|заплатил|купил|расход|отдал|spent|paid|bought|cost/i

/** cut a run-on dictated sentence into one piece per amount (dictation has no commas) */
function moneySegments(text: string) {
  const t = text.replace(/\$\s*(\d)/g, '$1 $ ')
  const nums = [...t.matchAll(NUM)].filter((m) => !/^\d{1,2}[:.]\d{2}$/.test(m[0].trim()))
  if (!nums.length) return []
  const ends = nums.map((m) => {
    const e = m.index! + m[0].length
    const c = t.slice(e).match(CUR_AFTER)
    return e + (c ? c[0].length : 0)
  })
  const bounds = [0]
  for (let i = 1; i < nums.length; i++) {
    const region = t.slice(ends[i - 1], nums[i].index!)
    let cut = -1
    // 1) punctuation wins: «на продукты, такси 12»
    const punct = Math.max(region.lastIndexOf(','), region.lastIndexOf(';'), region.lastIndexOf('.'))
    if (punct >= 0) cut = punct + 1
    // 2) a joining word: «… и 50 лари», «… потратил 1000»
    if (cut < 0) for (const m of region.matchAll(SPLIT)) cut = m.index! + (m[0].length - m[1].length)
    // 3) «на/за/for X» right after the amount belongs to it: «25 лари на продукты такси 12»
    if (cut < 0) {
      const pm = region.match(/^\s*(?:на|за|в|во|for|on|at)\s+\S+/i)
      cut = pm ? pm[0].length : 0
    }
    bounds.push(ends[i - 1] + cut)
  }
  return nums.map((_, i) => {
    let seg = t.slice(bounds[i], i + 1 < nums.length ? bounds[i + 1] : t.length)
    // drop a trailing habit phrase: «… фриланс и сделал йогу»
    const d = seg.slice(ends[i] - bounds[i]).search(/(?:^|\s)(?:и\s+|and\s+)?(?:сделал|выполнил|отметь|did|done|finished)/i)
    if (d >= 0) seg = seg.slice(0, ends[i] - bounds[i] + d)
    return seg.trim()
  })
}

/** returns actions in the same shape the AI assistant produces, or [] if nothing was understood */
export function parseLocal(text: string, s: ParseCtx): Action[] {
  const out: Action[] = []
  const now = s.now ?? new Date()
  let date = dayKey(now)
  let lastType: 'income' | 'expense' = 'expense'

  // money: one record per amount
  for (const seg of moneySegments(text)) {
    if (/вчера|позавчера|yesterday/i.test(seg)) date = dateOf(seg, now)
    const amount = amountOf(seg)
    if (!amount) continue
    const type: 'income' | 'expense' = INCOME.test(seg) ? 'income' : EXPENSE.test(seg) ? 'expense' : lastType
    lastType = type
    const salary = type === 'income' && /зарплат|оклад|salary|paycheck/i.test(seg)
    const cur = currencyOf(seg) || (type === 'income' ? 'USD' : (s.defaultCurrency as 'USD' | 'GEL' | 'RUB'))
    const category = type === 'income' ? (salary ? 'fixed' : 'variable') : (CAT.find(([, re]) => re.test(seg))?.[0] ?? 'other')
    out.push({ tool: 'add_transaction', input: { type, amount, currency: cur, category, note: noteOf(seg, salary) ?? null, date } })
  }

  // habits: only in the parts without amounts («сделал йогу и медитацию»)
  if (DONE.test(text)) {
    const parts = text.split(/(?<!\d)[.,](?!\d)|[;!?\n]+|\s+(?:и|а|а ещё|а также|плюс|and|also)\s+/i).map((x) => x.trim()).filter((x) => x && !/\d/.test(x))
    const seen = new Set<string>()
    for (const p of parts) {
      const low = p.toLowerCase()
      const d = /вчера|позавчера|yesterday/i.test(p) ? dateOf(p, now) : dayKey(now)
      for (const h of s.habits) {
        if (seen.has(h.id)) continue
        const stem = h.name.toLowerCase().slice(0, Math.min(6, Math.max(3, h.name.length - 1)))
        const aliases = (h.seed && HABIT_ALIASES[h.seed]) || []
        if (low.includes(stem) || aliases.some((a) => low.includes(a))) {
          seen.add(h.id)
          out.push({ tool: 'set_habit_done', input: { habit_id: h.id, date: d, done: true } })
        }
      }
    }
  }
  return out
}

const CAT_RU: Record<string, string> = { food: 'Еда', housing: 'Жильё', transport: 'Транспорт', entertainment: 'Развлечения', health: 'Здоровье', sport: 'Спорт', subscriptions: 'Подписки', shopping: 'Покупки', travel: 'Путешествия', other: 'Прочее', fixed: 'Зарплата', variable: 'Доход' }
const CAT_EN: Record<string, string> = { food: 'Food', housing: 'Housing', transport: 'Transport', entertainment: 'Fun', health: 'Health', sport: 'Sport', subscriptions: 'Subscriptions', shopping: 'Shopping', travel: 'Travel', other: 'Other', fixed: 'Salary', variable: 'Income' }
const SYM: Record<string, string> = { USD: '$', GEL: '₾', RUB: '₽' }
/** short human summary, e.g. "−12 ₾ · Еда · Кофе; ✓ Йога" (used for Siri's spoken reply) */
export function summarize(actions: Action[], habits: { id: string; name: string }[], en = false) {
  return actions
    .map((a) => {
      const i = a.input
      if (a.tool === 'add_transaction') {
        const amt = `${i.type === 'income' ? '+' : '−'}${i.amount} ${SYM[String(i.currency)] || i.currency}`
        return [amt, (en ? CAT_EN : CAT_RU)[String(i.category)] || i.category, i.note].filter(Boolean).join(' · ')
      }
      if (a.tool === 'set_habit_done') return `✓ ${habits.find((h) => h.id === i.habit_id)?.name || ''}`
      return ''
    })
    .filter(Boolean)
    .join('; ')
}
