import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSync } from '../lib/sync'
import { useStore } from '../store'
import type { Block } from '../store'
import { useT } from '../i18n'
import { dayKey, fmtDate, fmtWeekday, isoWeek, monthKey, periodRange, weekKey } from '../lib/date'
import { dayPct, growthScore, streak, totals } from '../lib/calc'
import { clamp01, inDuration, money, pct } from '../lib/format'
import { Header, IconBtn, Rings } from '../components/ui'
import { Icon } from '../components/Icon'
import { unitLabel } from '../components/forms'
import { monthTarget } from '../lib/finance'
import { useQuick } from '../components/QuickAdd'
import { eventsOn, useGcal, useWeekEvents } from '../lib/gcal'
import { weekStart } from '../lib/date'

export default function Today() {
  const t = useT()
  const nav = useNavigate()
  const s = useStore()
  const openQuick = useQuick((q) => q.open)
  const now = new Date()
  const key = dayKey(now)
  const done = s.logs[key] || []
  const hp = dayPct(s, key)
  const gw = growthScore(s.growth[weekKey(now)], s.growthTargets)
  const month = totals(s.txs, periodRange('month', now))
  const gp = clamp01(month.income / monthTarget(s, monthKey(now)))

  const blocks: Block[] = ['morning', 'day', 'evening']
  useWeekEvents(weekStart(now))
  const weeks = useGcal((g) => g.weeks)
  const calConnected = useGcal((g) => !!g.connected)
  const signedIn = useSync((x) => !!x.session)
  const lastTap = useRef<{ id: string; at: number }>({ id: '', at: 0 })
  const tap = (id: string) => {
    const n = Date.now()
    if (lastTap.current.id === id && n - lastTap.current.at < 400) return // ignore accidental double taps
    lastTap.current = { id, at: n }
    s.toggleHabit(key, id)
    navigator.vibrate?.(8)
  }
  const next = eventsOn(key, weeks).filter((e) => !e.allDay && new Date(e.end) > now)[0]
  const hm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const eyebrow = `${fmtWeekday(now, s.lang)} ${fmtDate(now, s.lang, { day: '2-digit', month: '2-digit' })} · W${isoWeek(now)}`

  return (
    <>
      <Header
        eyebrow={eyebrow}
        title={t('today.title')}
        actions={
          <>
            <IconBtn n="logo" label={t('stats.title')} onClick={() => nav('/stats')} />
            <IconBtn n="settings" label={t('settings.title')} onClick={() => nav('/settings')} />
            <IconBtn n="plus" label={t('quick.title')} onClick={() => openQuick('menu')} />
          </>
        }
      />

      {s.progNotes.map((n) => {
        const h = s.habits.find((x) => x.id === n.habitId)
        if (!h) return null
        return (
          <div key={n.id} className="banner">
            <div className="ibox"><Icon n="up" size="s" /></div>
            <div className="grow">
              <div style={{ fontWeight: 600 }}>{t('today.levelUp')}</div>
              <div className="t2">{h.name}: <span className="num">{n.from} → {n.to}</span> {unitLabel(t, h.unit)}</div>
            </div>
            <button className="mut" onClick={() => s.dismissProg(n.id)} aria-label="ok"><Icon n="x" size="s" /></button>
          </div>
        )
      })}

      <div className="card">
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <Rings
            values={[
              { v: hp, color: 'var(--acc)', track: 'var(--acc-track)' },
              { v: gp, color: 'var(--data2)', track: 'var(--track)' },
              { v: gw.pct, color: 'var(--data3)', track: 'var(--track)' },
            ]}
          />
          <div style={{ flex: 1, display: 'grid', gap: 9, fontSize: 13 }}>
            <Legend color="var(--acc)" label={t('today.habits')} value={`${done.filter((id) => s.habits.some((h) => h.id === id)).length}/${s.habits.length}`} />
            <Legend color="var(--data2)" label={t('today.incomeGoal')} value={pct(gp)} />
            <Legend color="var(--data3)" label={t('tab.growth')} value={`${gw.done}/4`} />
          </div>
        </div>
        <div className="stats div" style={{ marginTop: 14, paddingTop: 12 }}>
          <div>
            <div className="lbl">{t('today.streak')}</div>
            <div className="num acc">{streak(s)}{t('unit.d')}</div>
          </div>
          <div>
            <div className="lbl">{t('today.monthNet')}</div>
            <div className={`num ellipsis ${month.net > 0 ? 'pos' : month.net < 0 ? 'neg' : ''}`}>{money(month.net, 'USD', { sign: true, compact: true })}</div>
          </div>
          <div>
            <div className="lbl">{t('today.day')}</div>
            <div className="num">{pct(hp)}</div>
          </div>
        </div>
      </div>

      {(calConnected || signedIn) && (
        <button className="card list-row next-slot" onClick={() => nav('/calendar')}>
          <div className={`ibox ${next ? '' : 'g'}`}><Icon n={next?.meet ? 'video' : 'cal'} size="s" /></div>
          <div className="grow">
            {next ? (
              <>
                <div className="ellipsis" style={{ fontSize: 14, fontWeight: 600 }}>{next.title}</div>
                <div className="mono mut" style={{ fontSize: 11, marginTop: 3 }}>
                  {hm(new Date(next.start))}–{hm(new Date(next.end))} · {new Date(next.start) <= now ? t('today.now') : inDuration((new Date(next.start).getTime() - now.getTime()) / 60000, s.lang)}
                </div>
              </>
            ) : (
              <div className="mut" style={{ fontSize: 13 }}>{calConnected ? t('today.noMoreEvents') : t('cal.connect')}</div>
            )}
          </div>
          <Icon n="chev" size="s" className="mut" />
        </button>
      )}

      {blocks.map((b) => {
        const hs = s.habits.filter((h) => h.block === b)
        if (!hs.length) return null
        const d = hs.filter((h) => done.includes(h.id)).length
        return (
          <div className="card" key={b} style={{ paddingBottom: 6 }}>
            <div className="card-head">
              <span className="gap8 h2"><Icon n={b === 'morning' ? 'sunrise' : b === 'day' ? 'sun' : 'moon'} size="s" className="mut" />{t(`block.${b}`)}</span>
              <span className="num mut" style={{ fontSize: 12 }}>{d}/{hs.length}</span>
            </div>
            <div>
              {hs.map((h) => {
                const on = done.includes(h.id)
                return (
                  <button key={h.id} className={`task ${on ? 'done' : ''}`} onClick={() => tap(h.id)}>
                    <span className={`cb ${on ? 'on' : ''}`}>{on && <Icon n="check" size="xs" className="" />}</span>
                    <span className="tname grow">{h.name}</span>
                    {h.target != null && <span className={`tag ${h.prog ? 'acc' : ''}`}>{h.target} {unitLabel(t, h.unit)}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

    </>
  )
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="row">
      <span className="t2 gap8"><i style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'block' }} />{label}</span>
      <span className="num">{value}</span>
    </div>
  )
}
