import type { Currency } from '../store'

const SYM: Record<Currency, string> = { USD: '$', GEL: '₾', RUB: '₽' }
export const sym = (c: Currency) => SYM[c]

export function money(v: number, c: Currency = 'USD', opts: { sign?: boolean; compact?: boolean } = {}) {
  const abs = Math.abs(v)
  let s: string
  if (opts.compact && abs >= 10000) s = (abs / 1000).toFixed(abs >= 100000 ? 0 : 1).replace(/\.0$/, '') + 'k'
  else s = Math.round(abs).toLocaleString('en-US').replace(/,/g, ' ')
  const sign = v < 0 ? '−' : opts.sign && v > 0 ? '+' : ''
  return c === 'USD' ? `${sign}$${s}` : `${sign}${s} ${SYM[c]}`
}

export const pct = (v: number) => `${Math.round(v * 100)}%`
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/** 434 → { d: 0, h: 7, m: 14 } */
export function splitMinutes(total: number) {
  const t = Math.max(0, Math.round(total))
  return { d: Math.floor(t / 1440), h: Math.floor((t % 1440) / 60), m: t % 60 }
}
export function inDuration(total: number, lang: string) {
  const { d, h, m } = splitMinutes(total)
  const u = lang === 'ru' ? { d: 'д', h: 'ч', m: 'мин', in: 'через' } : { d: 'd', h: 'h', m: 'min', in: 'in' }
  const parts = d ? [`${d} ${u.d}`, h ? `${h} ${u.h}` : ''] : h ? [`${h} ${u.h}`, m ? `${m} ${u.m}` : ''] : [`${m} ${u.m}`]
  return `${u.in} ${parts.filter(Boolean).join(' ')}`
}

/** one recognisable pastel colour per category (dark & light friendly) */
export const CAT_COLOR: Record<string, string> = {
  food: '#ff8fab', housing: '#7cc4ff', transport: '#ffd166', entertainment: '#c3a6ff', health: '#6ee7b7',
  sport: '#ffa36c', subscriptions: '#8ea7ff', shopping: '#f7b2e6', travel: '#5fd3e0', other: '#a1a1a8',
  fixed: '#6ee7b7', variable: '#7cc4ff', 'other+': '#6e6e75',
}
export const catColor = (k: string) => CAT_COLOR[k] || '#a1a1a8'
/** css class for a signed amount */
export const signCls = (v: number) => (v > 0 ? 'pos' : v < 0 ? 'neg' : '')
