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
