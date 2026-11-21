import type { ReactNode } from 'react'
import { Icon } from './Icon'
import { clamp01 } from '../lib/format'

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  if (!open) return null
  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="sheet" role="dialog">
        <div className="grab" />
        {title && <h3>{title}</h3>}
        {children}
      </div>
    </>
  )
}

export function Header({ eyebrow, title, actions }: { eyebrow: string; title: string; actions?: ReactNode }) {
  return (
    <div className="head">
      <div style={{ minWidth: 0 }}>
        <div className="lbl">{eyebrow}</div>
        <div className="h">{title}</div>
      </div>
      {actions && <div className="gap8">{actions}</div>}
    </div>
  )
}

export function IconBtn({ n, onClick, label }: { n: string; onClick: () => void; label: string }) {
  return (
    <button className="iconbtn" onClick={onClick} aria-label={label}>
      <Icon n={n} size="s" />
    </button>
  )
}

export function Rings({ values, size = 100 }: { values: { v: number; color: string; track: string }[]; size?: number }) {
  const radii = [46, 34, 22]
  return (
    <svg width={size} height={size} viewBox="0 0 104 104" style={{ flexShrink: 0 }}>
      <g fill="none" strokeWidth={8} strokeLinecap="round" transform="rotate(-90 52 52)">
        {values.map((x, i) => {
          const r = radii[i]
          const c = 2 * Math.PI * r
          const v = clamp01(x.v)
          return (
            <g key={i}>
              <circle cx="52" cy="52" r={r} stroke={x.track} />
              {v > 0 && <circle cx="52" cy="52" r={r} stroke={x.color} strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: 'stroke-dashoffset .5s ease' }} />}
            </g>
          )
        })}
      </g>
    </svg>
  )
}

export function Bar({ v, color = 'var(--acc)' }: { v: number; color?: string }) {
  return (
    <div className="bar">
      <i style={{ width: `${clamp01(v) * 100}%`, background: color }} />
    </div>
  )
}

export function Segs({ v, n = 12 }: { v: number; n?: number }) {
  const on = Math.round(clamp01(v) * n)
  return (
    <div className="segs" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
      {Array.from({ length: n }, (_, i) => (
        <i key={i} className={i < on ? 'on' : ''} />
      ))}
    </div>
  )
}

export function Seg<T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.v} className={o.v === value ? 'on' : ''} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return <button className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)} role="switch" aria-checked={on} />
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="lbl">{label}</span>
      {children}
    </label>
  )
}

/** levels: 0..1 values; renders a columns x rows heat grid (column-major) */
export function Heat({ values, rows = 7, cols, flow = 'column' }: { values: (number | null)[]; rows?: number; cols: number; flow?: 'column' | 'row' }) {
  const color = (v: number | null) => {
    if (v == null) return 'transparent'
    if (v <= 0) return 'var(--track)'
    if (v < 0.4) return 'color-mix(in srgb, var(--acc) 30%, var(--track))'
    if (v < 0.8) return 'color-mix(in srgb, var(--acc) 62%, var(--track))'
    return 'var(--acc)'
  }
  return (
    <div className={`heat ${flow === 'row' ? 'heat-cal' : ''}`} style={{ gridAutoFlow: flow, gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, auto)` }}>
      {values.map((v, i) => (
        <span key={i} style={{ background: color(v) }} />
      ))}
    </div>
  )
}
