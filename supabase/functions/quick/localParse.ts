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

const INCOME = /заработ|зарплат|оклад|аванс|преми|бонус|доход|гонорар|фриланс|кэшб[эе]к|кешб[эе]к|дивиденд|процент[ыо]?в? по вклад|продал|возврат|пришл[аио]|получил[аи]?(?!\s+(?:посылк|заказ))|(?:перевели|скинули|заплатил[аи]?|оплатил[аи]?|отправил[аи]?)\s+мне|мне\s+(?:перевели|скинули|заплатил[аи]?|оплатил[аи]?|пришл[аио])|клиент\S*\s+(?:заплатил|оплатил|перевел)|earned|got paid|paid me|sent me|salary|paycheck|income|freelance|bonus|cashback|refund|dividend|received|sold/i
const EXPENSE = /потратил|заплатил|оплатил|купил|отдал|расход|списал|spent|paid|bought|cost/i
const DONE = /сделал|выполнил|отметь|закончил|прош[её]л|done|did|finished|completed/i

/** category stems (substring match — survives merged dictation like «наресторан»); ≤3-letter stems need word boundaries */
const CATS: [string, string[]][] = [
  ['food', ['продукт', 'еда', 'еду', 'еды', 'кофе', 'кофейн', 'кафе', 'ресторан', 'обед', 'ужин', 'завтрак', 'перекус', 'пицц', 'бургер', 'шаурм', 'шаверм', 'суши', 'ролл', 'хинкал', 'хачапур', 'доставк', 'супермаркет', 'рынок', 'рынке', 'магазин', 'фрукт', 'овощ', 'мясо', 'хлеб', 'молок', 'вода в магазин', 'glovo', 'глово', 'wolt', 'вольт', 'carrefour', 'карфур', 'nikora', 'никора', 'spar', 'спар', 'agrohub', 'goodwill', 'nabiji', 'mcdonald', 'макдон', 'kfc', 'starbucks', 'wendy', 'grocer', 'food', 'coffee', 'lunch', 'dinner', 'breakfast', 'restaurant', 'cafe', 'snack', 'pizza', 'burger', 'sushi', 'delivery', 'market', 'meal']],
  ['transport', ['такси', 'метро', 'автобус', 'маршрутк', 'бензин', 'бенз', 'топлив', 'заправ', 'парковк', 'каршеринг', 'самокат', 'транспорт', 'поезд', 'электричк', 'uber', 'убер', 'bolt', 'болт', 'yandex', 'яндекс', 'taxi', 'metro', 'fuel', 'petrol', 'parking', 'scooter', 'train', 'wissol', 'gulf', 'rompetrol', 'socar', 'лукойл', 'bus', 'gas']],
  ['housing', ['аренд', 'квартир', 'жиль', 'коммунал', 'электричеств', 'свет за', 'за свет', 'отоплени', 'интернет', 'ремонт', 'мебел', 'telasi', 'теласи', 'gwp', 'rent', 'utilit', 'electric', 'internet', 'apartment', 'furniture', 'газ']],
  ['health', ['аптек', 'лекарств', 'таблетк', 'витамин', 'врач', 'доктор', 'клиник', 'больниц', 'стоматолог', 'зубн', 'анализ', 'страховк', 'psp', 'aversi', 'аверси', 'gpc', 'pharmacy', 'doctor', 'medicine', 'pills', 'vitamin', 'dentist', 'clinic', 'hospital', 'insurance']],
  ['sport', ['спортзал', 'абонемент', 'спорт', 'тренировк', 'тренер', 'кроссфит', 'протеин', 'бассейн', 'gym', 'fitness', 'crossfit', 'trainer', 'protein', 'pool', 'зал']],
  ['subscriptions', ['подписк', 'netflix', 'нетфликс', 'spotify', 'спотифай', 'youtube', 'ютуб', 'icloud', 'айклауд', 'apple music', 'chatgpt', 'чатгпт', 'claude', 'notion', 'premium', 'премиум', 'связь', 'тариф', 'мобильн', 'magti', 'магти', 'silknet', 'силкнет', 'cellfie', 'subscription', 'phone bill', 'plan']],
  ['shopping', ['одежд', 'обув', 'кроссовк', 'куртк', 'футболк', 'джинс', 'покупк', 'техник', 'наушник', 'косметик', 'подарок', 'подарк', 'zara', 'h&m', 'amazon', 'амазон', 'temu', 'тему', 'aliexpress', 'алиэкспресс', 'ozon', 'озон', 'wildberries', 'вайлдберриз', 'ikea', 'икеа', 'shopping', 'clothes', 'shoes', 'sneakers', 'jacket', 'gadget', 'headphones', 'cosmetics', 'gift']],
  ['entertainment', ['кино', 'клуб', 'развлеч', 'концерт', 'игр', 'steam', 'playstation', 'кальян', 'боулинг', 'вечеринк', 'тусовк', 'театр', 'музей', 'cinema', 'movie', 'club', 'concert', 'game', 'party', 'theater', 'museum', 'bowling', 'бар', 'bar', 'pub', 'паб']],
  ['travel', ['билет', 'отел', 'гостиниц', 'хостел', 'поездк', 'путешеств', 'самол', 'перел', 'авиа', 'airbnb', 'эйрбнб', 'booking', 'букинг', 'виза', 'тур', 'wizz', 'flight', 'hotel', 'hostel', 'trip', 'ticket', 'travel', 'visa']],
]
const CAT_RE: [string, RegExp][] = CATS.map(([c, stems]) => [
  c,
  new RegExp(stems.map((x) => (x.length <= 3 ? `(?:^|[^a-zа-яё])${x.replace(/[$&]/g, '\\$&')}(?![a-zа-яё])` : x.replace(/[$&]/g, '\\$&'))).join('|'), 'gi'),
])
/** best category by number of hits; ties go to the earlier category */
function catOf(t: string) {
  let best = 'other'
  let hits = 0
  for (const [c, re] of CAT_RE) {
    const n = (t.match(re) || []).length
    if (n > hits) { best = c; hits = n }
  }
  return best
}

// ---- spoken numbers → digits («двадцать пять» → 25, «полторы тысячи» → 1500, «twenty five» → 25)
const UNITS: Record<string, number> = {
  ноль: 0, один: 1, одна: 1, одну: 1, одного: 1, два: 2, две: 2, три: 3, четыре: 4, пять: 5, шесть: 6, семь: 7, восемь: 8, девять: 9, десять: 10,
  одиннадцать: 11, двенадцать: 12, тринадцать: 13, четырнадцать: 14, пятнадцать: 15, шестнадцать: 16, семнадцать: 17, восемнадцать: 18, девятнадцать: 19,
  двадцать: 20, тридцать: 30, сорок: 40, пятьдесят: 50, шестьдесят: 60, семьдесят: 70, восемьдесят: 80, девяносто: 90,
  сто: 100, двести: 200, триста: 300, четыреста: 400, пятьсот: 500, шестьсот: 600, семьсот: 700, восемьсот: 800, девятьсот: 900,
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
}
const HALF = new Set(['полторы', 'полтора'])
const HUNDRED = new Set(['hundred', 'hundreds'])
const THOUSAND = /^(тысяч[аиу]?|thousands?)$/
const MILLION = /^(миллион(а|ов)?|millions?)$/

function wordsToDigits(text: string) {
  const parts = text.split(/(\s+)/)
  const out: string[] = []
  let run: string[] = []
  const flush = () => {
    if (!run.length) return
    let total = 0, cur = 0, any = false
    for (const w of run) {
      if (w in UNITS) { cur += UNITS[w]; any = true }
      else if (HALF.has(w)) { cur += 1.5; any = true }
      else if (HUNDRED.has(w)) { cur = (cur || 1) * 100; any = true }
      else if (THOUSAND.test(w)) { total += (cur || 1) * 1000; cur = 0; any = true }
      else if (MILLION.test(w)) { total += (cur || 1) * 1e6; cur = 0; any = true }
    }
    out.push(any ? String(total + cur) : run.join(' '))
    run = []
  }
  for (const p of parts) {
    if (/^\s+$/.test(p)) { if (!run.length) out.push(p); continue }
    const w = p.toLowerCase().replace(/[.,!?;:]+$/, '')
    const isNum = w in UNITS || HALF.has(w) || HUNDRED.has(w) || THOUSAND.test(w) || MILLION.test(w)
    if (isNum) { run.push(w); continue }
    if (run.length) { flush(); out.push(' ') }
    out.push(p)
  }
  flush()
  return out.join('').replace(/\s{2,}/g, ' ')
}

/** fix what dictation does to numbers and words before parsing */
export function normalize(raw: string) {
  let t = ' ' + raw.replace(/ /g, ' ') + ' '
  t = t.replace(/(\d)[ ](\d{3})(?!\d)/g, '$1$2').replace(/(\d)[ ](\d{3})(?!\d)/g, '$1$2') // 5 000 → 5000
  t = t.replace(/(\d),(\d{3})(?!\d)/g, '$1$2') // 1,500 → 1500 (but 1,5 stays)
  t = t.replace(/(\d)([a-zа-яё$₾₽])/gi, '$1 $2').replace(/([a-zа-яё])(\d)/gi, '$1 $2') // 12лари → 12 лари
  t = t.replace(/\$\s*(\d+(?:[.,]\d+)?)/g, '$1 $ ') // $12 → 12 $
  t = wordsToDigits(t)
  // «5 тысяч», «2 thousand», «3k»
  t = t.replace(/(\d+(?:[.,]\d+)?)\s*(?:тысяч[аиу]?|тыс\.?|thousands?|k|к)(?=[\s,.;!?]|$)/gi, (_, n) => String(Math.round(Number(n.replace(',', '.')) * 1000)))
  return t.replace(/\s{2,}/g, ' ').trim()
}

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
const STOP = new Set(('мне меня нам себе я мы ты мой моя моё мое мои моем моём моей мою свой своя своё свое свои своей своем своём своего своих сегодня вчера позавчера также тоже ещё еще и а но на за в во с со по у от для до это так просто вот ну уже около примерно ' +
  'i me my mine we our on for the a an at from also today yesterday and to of in with by just about then plus').split(' '))
const VERB = /^(потратил|заплатил|оплатил|купил|заработал|получил|отдал|перевели|скинули|прислал|отправил|сделал|выполнил|spent|spend|paid|pay|bought|buy|earned|earn|got|received|made|did|done)[а-яёa-z]*$/i
const CURW = /^(лари|лар|lari|laris|gel|₾|доллар[а-яё]*|dollars?|бакс[а-яё]*|bucks?|usd|\$|рубл[а-яё]*|rubles?|roubles?|₽|rub|тыс[а-яё]*|к|k)$/i

function noteOf(t: string, salary: boolean) {
  if (salary) return undefined // the category already says «Зарплата»
  const words = t
    .replace(/[^\p{L}\p{N}$₾₽\s-]/gu, ' ')
    .split(/\s+/)
    .map((w) => {
      // «наресторан» → «ресторан» (dictation glued the preposition)
      const g = w.match(/^(на|за|во|в)([а-яё]{4,})$/i)
      return g && catOf(g[2]) !== 'other' ? g[2] : w
    })
    .filter((w) => w && !/^\d/.test(w) && !CURW.test(w) && !VERB.test(w) && !STOP.has(w.toLowerCase()))
    .slice(0, 4)
  const n = words.join(' ')
  return n ? n[0].toUpperCase() + n.slice(1, 40) : undefined
}

const NUM = /(\d+(?:[.,]\d+)?)\s*(тыс[а-яё]*|к|k)?(?![\d:])/gi
const CUR_AFTER = /^\s*(лари|лар|lari|laris|gel|₾|доллар[а-яё]*|dollars?|бакс[а-яё]*|bucks?|usd|\$|рубл[а-яё]*|rubles?|roubles?|₽|rub)(?=[\s,.;!?]|$)/i
const SPLIT = /(?:^|[\s,.;!?])(также|тоже|ещё|еще|потом|плюс|и|а|потратил[а-яё]*|заплатил[а-яё]*|купил[а-яё]*|заработал[а-яё]*|получил[а-яё]*|also|and|then|plus|spent|paid|bought|earned|got)(?=\s|$)/gi

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
export function parseLocal(input: string, s: ParseCtx): Action[] {
  const text = normalize(input)
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
    const category = type === 'income' ? (salary ? 'fixed' : 'variable') : catOf(seg)
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
