import { useEffect, useState } from 'react'
import { useStore } from '../store'
import type { Tx } from '../store'
import { useT } from '../i18n'
import { inRange } from '../lib/date'
import { catColor, money } from '../lib/format'
import { Seg } from './ui'


/** spending / income ring by category (tap a slice or a row to focus it) */
export function CategoryRing({ range }: { range: [Date, Date] }) {
  const t = useT()
  const txs = useStore((s) => s.txs)
  const [type, setType] = useState<Tx['type']>('expense')
  const [sel, setSel] = useState<string | null>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
    return () => cancelAnimationFrame(id)
  }, [])
  useEffect(() => setSel(null), [type, range[0].getTime()])

  const by: Record<string, number> = {}
  for (const x of txs) if (x.type === type && inRange(x.date, range)) by[x.category] = (by[x.category] || 0) + x.usd
  let items = Object.entries(by).sort((a, b) => b[1] - a[1])
  if (items.length > 6) items = [...items.slice(0, 5), ['other+', items.slice(5).reduce((a, [, v]) => a + v, 0)]]
  const total = items.reduce((a, [, v]) => a + v, 0)
  const name = (k: string) => (k === 'other+' ? t('fin.rest') : t(`cat.${k}`))

  const R = 46
  const C = 2 * Math.PI * R
  const gap = items.length > 1 ? 1.2 : 0
  let acc = 0
  const focus = sel ? items.find(([k]) => k === sel) : null

  return (
    <div className="card">
      <Seg value={type} onChange={setType} options={[{ v: 'expense', label: t('fin.spending') }, { v: 'income', label: t('fin.income') }]} />
      <div style={{ position: 'relative', width: 196, height: 196, margin: '16px auto 10px' }}>
        <svg width="196" height="196" viewBox="0 0 120 120">
          <g transform="rotate(-90 60 60)" fill="none" strokeWidth="13">
            <circle cx="60" cy="60" r={R} stroke="var(--track)" />
            {total > 0 && items.map(([k, v], i) => {
              const len = (v / total) * C
              const dash = Math.max(0.01, len - gap)
              const off = -acc
              acc += len
              const dim = sel && sel !== k
              return (
                <circle
                  key={k}
                  cx="60" cy="60" r={R}
                  stroke={catColor(k)}
                  strokeDasharray={`${shown ? dash : 0} ${C}`}
                  strokeDashoffset={off}
                  style={{ transition: `stroke-dasharray .8s cubic-bezier(.16,1,.3,1) ${i * 60}ms, opacity .2s`, opacity: dim ? 0.25 : 1, cursor: 'pointer' }}
                  onClick={() => setSel(sel === k ? null : k)}
                />
              )
            })}
          </g>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', pointerEvents: 'none' }}>
          <div>
            <div className="lbl">{focus ? name(focus[0]) : type === 'expense' ? t('fin.spent') : t('fin.earned')}</div>
            <div className="num" style={{ fontSize: 24, marginTop: 4 }}>{money(focus ? focus[1] : total, 'USD', { compact: true })}</div>
            {focus && <div className="num mut" style={{ fontSize: 12, marginTop: 2 }}>{Math.round((focus[1] / total) * 100)}%</div>}
          </div>
        </div>
      </div>
      {items.length === 0 && <div className="empty">{t('fin.noTx')}</div>}
      {items.map(([k, v]) => (
        <button key={k} className="list-row" style={{ opacity: sel && sel !== k ? 0.45 : 1 }} onClick={() => setSel(sel === k ? null : k)}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: catColor(k), flexShrink: 0 }} />
          <span className="grow" style={{ textAlign: 'left' }}>{name(k)}</span>
          <span className="num mut" style={{ fontSize: 12 }}>{Math.round((v / total) * 100)}%</span>
          <span className="num" style={{ minWidth: 70, textAlign: 'right' }}>{money(v)}</span>
        </button>
      ))}
    </div>
  )
}
