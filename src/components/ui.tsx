import { useEffect, useRef, useState } from 'react'
import type { ReactNode, TouchEvent as RTouchEvent } from 'react'
import { createPortal } from 'react-dom'
import { create } from 'zustand'
import { Icon } from './Icon'
import { clamp01 } from '../lib/format'

/** how many sheets are open — the tab bar and mic button hide while any is */
export const useOverlay = create<{ count: number }>(() => ({ count: 0 }))

const CLOSE_MS = 220

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)
  const last = useRef({ title, children })
  if (open) last.current = { title, children } // keep content while the close animation plays
  const sheet = useRef<HTMLDivElement>(null)
  const drag = useRef<{ y0: number; dy: number; active: boolean }>({ y0: 0, dy: 0, active: false })

  useEffect(() => {
    if (open) {
      setMounted(true)
      setClosing(false)
      return
    }
    if (!mounted) return
    setClosing(true)
    const t = setTimeout(() => { setMounted(false); setClosing(false) }, CLOSE_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!mounted) return
    useOverlay.setState((o) => ({ count: o.count + 1 }))
    return () => useOverlay.setState((o) => ({ count: Math.max(0, o.count - 1) }))
  }, [mounted])

  if (!mounted) return null

  // swipe down to close (only when the sheet content is scrolled to the top)
  const onTouchStart = (e: RTouchEvent) => {
    const el = sheet.current
    if (!el || el.scrollTop > 0) return
    drag.current = { y0: e.touches[0].clientY, dy: 0, active: true }
  }
  const onTouchMove = (e: RTouchEvent) => {
    const d = drag.current
    if (!d.active || !sheet.current) return
    d.dy = Math.max(0, e.touches[0].clientY - d.y0)
    if (d.dy > 0) {
      sheet.current.style.transition = 'none'
      sheet.current.style.transform = `translateY(${d.dy}px)`
    }
  }
  const onTouchEnd = () => {
    const d = drag.current
    const el = sheet.current
    d.active = false
    if (!el) return
    el.style.transition = 'transform .22s cubic-bezier(.2,.8,.2,1)'
    if (d.dy > 110) {
      el.style.transform = 'translateY(100%)'
      setTimeout(onClose, 160)
    } else el.style.transform = ''
    d.dy = 0
  }

  return createPortal(
    <>
      <div className={`backdrop ${closing ? 'closing' : ''}`} onClick={onClose} />
      <div
        ref={sheet}
        className={`sheet ${closing ? 'closing' : ''}`}
        role="dialog"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="grab" />
        {last.current.title && <h3>{last.current.title}</h3>}
        {last.current.children}
      </div>
    </>,
    document.body,
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
  // start empty and fill on mount, so the rings always animate in
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <svg width={size} height={size} viewBox="0 0 104 104" style={{ flexShrink: 0 }}>
      <g fill="none" strokeWidth={8} strokeLinecap="round" transform="rotate(-90 52 52)">
        {values.map((x, i) => {
          const r = radii[i]
          const c = 2 * Math.PI * r
          const v = shown ? clamp01(x.v) : 0
          return (
            <g key={i}>
              <circle cx="52" cy="52" r={r} stroke={x.track} />
              <circle
                cx="52" cy="52" r={r} stroke={x.color} strokeDasharray={c} strokeDashoffset={c * (1 - v)}
                style={{ opacity: v > 0 ? 1 : 0, transition: `stroke-dashoffset .9s cubic-bezier(.16,1,.3,1) ${i * 80}ms, opacity .2s` }}
              />
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
  const idx = Math.max(0, options.findIndex((o) => o.v === value))
  return (
    <div className="seg">
      <span className="seg-ind" style={{ width: `calc((100% - 6px) / ${options.length})`, transform: `translateX(${idx * 100}%)` }} />
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
    <div className="field">
      <span className="lbl">{label}</span>
      {children}
    </div>
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
