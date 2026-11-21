import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { useT } from '../i18n'
import { addDays, dayKey, fmtDate, fmtWeekday, parseDay, weekStart } from '../lib/date'
import { connectGoogle, createEvent, eventsOn, loadWeek, useGcal, useWeekEvents } from '../lib/gcal'
import type { GEvent } from '../lib/gcal'
import { useSync } from '../lib/sync'
import { Field, Header, IconBtn, Sheet } from '../components/ui'
import { Icon } from '../components/Icon'

const START = 6, END = 24, ROW = 48

const hm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

export default function Calendar() {
  const t = useT()
  const nav = useNavigate()
  const lang = useStore((s) => s.lang)
  const session = useSync((s) => s.session)
  const { connected, weeks, loading, error } = useGcal()
  const now = new Date()
  const [sel, setSel] = useState(dayKey(now))
  const [offset, setOffset] = useState(0)
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState<GEvent | null>(null)
  const ws = addDays(weekStart(now), offset * 7)
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i))
  useWeekEvents(ws)
  const scroller = useRef<HTMLDivElement>(null)

  const evs = eventsOn(sel, weeks)
  const allDay = evs.filter((e) => e.allDay)
  const timed = evs.filter((e) => !e.allDay)
  const isToday = sel === dayKey(now)
  const nowY = (now.getHours() + now.getMinutes() / 60 - START) * ROW
  const hasDot = (d: Date) => eventsOn(dayKey(d), weeks).length > 0

  useEffect(() => {
    // scroll the timeline near the current hour / first event
    const first = timed[0] ? new Date(timed[0].start).getHours() : now.getHours()
    scroller.current?.scrollTo({ top: Math.max(0, (Math.min(first, now.getHours()) - START - 1) * ROW) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel])

  // columns for overlapping events
  const placed = layout(timed, sel)

  return (
    <>
      <Header
        eyebrow={fmtDate(ws, lang, { month: 'long', year: 'numeric' })}
        title={t('tab.calendar')}
        actions={connected ? (
          <>
            <IconBtn n="repeat" label="refresh" onClick={() => loadWeek(ws, true)} />
            <IconBtn n="plus" label={t('cal.new')} onClick={() => setAdding(true)} />
          </>
        ) : undefined}
      />

      <div className="row" style={{ marginBottom: 8 }}>
        <button className="iconbtn" onClick={() => setOffset((o) => o - 1)} aria-label="prev"><Icon n="back" size="s" /></button>
        <button className="lbl" onClick={() => { setOffset(0); setSel(dayKey(now)) }}>{loading ? '…' : t('cal.today')}</button>
        <button className="iconbtn" onClick={() => setOffset((o) => o + 1)} aria-label="next"><Icon n="chev" size="s" /></button>
      </div>
      <div className="week">
        {days.map((d) => (
          <button key={dayKey(d)} className={`wd ${dayKey(d) === sel ? 'on' : ''}`} onClick={() => setSel(dayKey(d))}>
            {fmtWeekday(d, lang).slice(0, 2)}
            <b>{d.getDate()}</b>
            <span style={{ display: 'block', width: 4, height: 4, borderRadius: 4, margin: '4px auto 0', background: hasDot(d) ? (dayKey(d) === sel ? 'var(--acc-ink)' : 'var(--acc)') : 'transparent' }} />
          </button>
        ))}
      </div>

      {!connected && (
        <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="ibox"><Icon n="cal" size="s" /></div>
          <div className="grow">
            <div style={{ fontWeight: 600 }}>{t('cal.connect')}</div>
            <div className="mut" style={{ fontSize: 12, marginTop: 2 }}>{session ? t('cal.connectHint') : t('cal.needCloud')}</div>
            {error && <div className="danger" style={{ fontSize: 12, marginTop: 4 }}>{error}</div>}
          </div>
          {session
            ? <button className="btn primary sm" onClick={connectGoogle}>{t('cal.connectBtn')}</button>
            : <button className="btn ghost sm" onClick={() => nav('/settings')}>{t('settings.title')}</button>}
        </div>
      )}

      {allDay.length > 0 && (
        <div className="card" style={{ padding: '10px 14px' }}>
          {allDay.map((e) => (
            <button key={e.id} className="list-row" onClick={() => setOpen(e)}>
              <span style={{ width: 4, height: 18, borderRadius: 2, background: e.color || 'var(--acc)' }} />
              <span className="grow ellipsis">{e.title}</span>
              <span className="lbl">{t('cal.allDay')}</span>
            </button>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: '12px 14px' }}>
        <div ref={scroller} style={{ maxHeight: '56dvh', overflowY: 'auto' }}>
          <div className="timeline" style={{ height: (END - START) * ROW + 10 }}>
            {Array.from({ length: END - START }, (_, i) => (
              <div key={i}>
                <div className="hr" style={{ top: i * ROW }}>{String(START + i).padStart(2, '0')}:00</div>
                <div className="gl" style={{ top: i * ROW + 7 }} />
              </div>
            ))}
            {placed.map(({ e, top, height, col, cols }) => {
              const past = new Date(e.end) < now
              return (
                <button
                  key={e.id}
                  onClick={() => setOpen(e)}
                  style={{
                    position: 'absolute', top: top + 7, height: Math.max(22, height - 2),
                    left: `calc(50px + (100% - 50px) * ${col / cols})`, width: `calc((100% - 50px) / ${cols} - 3px)`,
                    background: 'var(--acc-d)', borderLeft: `3px solid ${e.color || 'var(--acc)'}`, borderRadius: 8,
                    padding: '4px 8px', textAlign: 'left', overflow: 'hidden', opacity: past ? 0.5 : 1,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600 }} className="ellipsis">{e.title}</div>
                  {height > 34 && <div className="mono mut" style={{ fontSize: 10 }}>{hm(new Date(e.start))}–{hm(new Date(e.end))}</div>}
                </button>
              )
            })}
            {isToday && nowY > 0 && nowY < (END - START) * ROW && <div className="nowl" style={{ top: nowY + 7 }} />}
          </div>
        </div>
        {connected && evs.length === 0 && <div className="empty">{t('cal.empty')}</div>}
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title={t('cal.new')}>
        {adding && <NewEvent day={sel} onDone={() => { setAdding(false); loadWeek(ws, true) }} />}
      </Sheet>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.title}>
        {open && (
          <>
            <div className="mono t2" style={{ fontSize: 13, marginBottom: 12 }}>
              {open.allDay ? t('cal.allDay') : `${fmtDate(new Date(open.start), lang, { weekday: 'short', day: 'numeric', month: 'short' })} · ${hm(new Date(open.start))}–${hm(new Date(open.end))}`}
            </div>
            {open.location && <div className="t2" style={{ fontSize: 13, marginBottom: 12 }}>{open.location}</div>}
            {open.meet && <a className="btn primary" style={{ width: '100%', textDecoration: 'none', marginBottom: 8 }} href={open.meet} target="_blank" rel="noreferrer"><Icon n="video" size="s" />{t('cal.join')}</a>}
            {open.link && <a className="btn ghost" style={{ width: '100%', textDecoration: 'none' }} href={open.link} target="_blank" rel="noreferrer">{t('cal.openGoogle')}</a>}
          </>
        )}
      </Sheet>
    </>
  )
}

function layout(evs: GEvent[], day: string) {
  const d0 = parseDay(day)
  const items = evs.map((e) => {
    const s = Math.max(new Date(e.start).getTime(), d0.getTime())
    const en = Math.min(new Date(e.end).getTime(), addDays(d0, 1).getTime())
    const sh = (s - d0.getTime()) / 3600000
    const eh = (en - d0.getTime()) / 3600000
    return { e, sh, eh, top: (sh - START) * ROW, height: (eh - sh) * ROW, col: 0, cols: 1 }
  }).filter((x) => x.eh > START).sort((a, b) => a.sh - b.sh)
  // greedy column assignment within overlapping clusters
  let cluster: typeof items = []
  let clusterEnd = -1
  const flush = () => {
    const ends: number[] = []
    for (const it of cluster) {
      let c = ends.findIndex((x) => x <= it.sh)
      if (c === -1) { c = ends.length; ends.push(it.eh) } else ends[c] = it.eh
      it.col = c
    }
    cluster.forEach((it) => (it.cols = ends.length))
  }
  for (const it of items) {
    if (it.sh >= clusterEnd && cluster.length) { flush(); cluster = [] }
    cluster.push(it)
    clusterEnd = Math.max(clusterEnd, it.eh)
  }
  if (cluster.length) flush()
  return items.map((it) => ({ ...it, top: Math.max(0, it.top) }))
}

function NewEvent({ day, onDone }: { day: string; onDone: () => void }) {
  const t = useT()
  const nextHour = new Date()
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(day)
  const [start, setStart] = useState(hm(nextHour))
  const [dur, setDur] = useState(30)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const save = async () => {
    const [h, m] = start.split(':').map(Number)
    const s = parseDay(date)
    s.setHours(h, m, 0, 0)
    setBusy(true)
    try {
      await createEvent({ title: title.trim(), start: s, end: new Date(s.getTime() + dur * 60000) })
      onDone()
    } catch (e) {
      setErr((e as Error).message)
    }
    setBusy(false)
  }
  return (
    <>
      <Field label={t('goal.title')}><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 8 }}>
        <Field label={t('common.date')}><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label={t('cal.start')}><input className="input" type="time" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
      </div>
      <Field label={t('cal.duration')}>
        <div className="chips">
          {[15, 30, 45, 60, 90, 120].map((m) => (
            <button key={m} className={`chip ${m === dur ? 'on' : ''}`} onClick={() => setDur(m)}>{m < 60 ? `${m}′` : `${m / 60}${t('unit.h')}`}</button>
          ))}
        </div>
      </Field>
      <div className="mut" style={{ fontSize: 12, marginTop: -6, marginBottom: 12 }}>{t('cal.reminderNote')}</div>
      {err && <div className="danger" style={{ fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <button className="btn primary" style={{ width: '100%' }} disabled={!title.trim() || busy} onClick={save}>{busy ? '…' : t('common.save')}</button>
    </>
  )
}
