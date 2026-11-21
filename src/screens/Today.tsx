import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import type { Block, Goal } from '../store'
import { useT } from '../i18n'
import { dayKey, fmtDate, fmtWeekday, isoWeek, periodKey, periodRange, weekKey } from '../lib/date'
import type { Period } from '../lib/date'
import { dayPct, goalValue, growthScore, streak, totals } from '../lib/calc'
import { clamp01, money, pct } from '../lib/format'
import { Header, IconBtn, Rings, Seg, Sheet, Bar, Field } from '../components/ui'
import { Icon } from '../components/Icon'
import { GoalForm, unitLabel } from '../components/forms'
import { useQuick } from '../components/QuickAdd'

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
  const weekGoals = s.goals.filter((g) => g.period === 'week')
  const gp = weekGoals.length ? weekGoals.reduce((a, g) => a + clamp01(goalValue(s, g) / g.target), 0) / weekGoals.length : 0
  const month = totals(s.txs, periodRange('month', now))
  const [period, setPeriod] = useState<Period>('week')
  const [goalSheet, setGoalSheet] = useState<Goal | 'new' | null>(null)
  const [progGoal, setProgGoal] = useState<Goal | null>(null)

  const blocks: Block[] = ['morning', 'day', 'evening']
  const eyebrow = `${fmtWeekday(now, s.lang)} ${fmtDate(now, s.lang, { day: '2-digit', month: '2-digit' })} · W${isoWeek(now)}`

  return (
    <>
      <Header
        eyebrow={eyebrow}
        title={t('today.title')}
        actions={
          <>
            <IconBtn n="chart" label={t('stats.title')} onClick={() => nav('/stats')} />
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
            <Legend color="var(--data2)" label={t('today.weekGoals')} value={pct(gp)} />
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
            <div className="num ellipsis">{money(month.net, 'USD', { sign: true, compact: true })}</div>
          </div>
          <div>
            <div className="lbl">{t('today.day')}</div>
            <div className="num">{pct(hp)}</div>
          </div>
        </div>
      </div>

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
                  <button key={h.id} className={`task ${on ? 'done' : ''}`} onClick={() => { s.toggleHabit(key, h.id); navigator.vibrate?.(8) }}>
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

      <div className="card">
        <div className="card-head">
          <span className="h2">{t('today.goals')}</span>
          <button className="lbl acc" onClick={() => setGoalSheet('new')}>+ {t('common.add')}</button>
        </div>
        <Seg value={period} onChange={setPeriod} options={(['week', 'month', 'year'] as Period[]).map((p) => ({ v: p, label: t(`period.${p}`) }))} />
        <div style={{ marginTop: 6 }}>
          {s.goals.filter((g) => g.period === period).map((g) => {
            const v = goalValue(s, g)
            const isMoney = g.kind !== 'custom'
            return (
              <button key={g.id} className="list-row" style={{ display: 'block' }} onClick={() => (g.kind === 'custom' ? setProgGoal(g) : setGoalSheet(g))}>
                <div className="row" style={{ marginBottom: 8 }}>
                  <span style={{ fontWeight: 500 }}>{g.title}</span>
                  <span className="num" style={{ fontSize: 12 }}>
                    <span className={v >= g.target ? 'acc' : ''}>{isMoney ? money(v, 'USD', { compact: true }) : v}</span>
                    <span className="mut"> / {isMoney ? money(g.target, 'USD', { compact: true }) : g.target}</span>
                  </span>
                </div>
                <Bar v={v / g.target} />
              </button>
            )
          })}
          {!s.goals.some((g) => g.period === period) && <div className="empty">{t('today.noGoals')}</div>}
        </div>
      </div>

      <Sheet open={!!goalSheet} onClose={() => setGoalSheet(null)} title={goalSheet === 'new' ? t('goal.new') : t('goal.edit')}>
        {goalSheet && <GoalForm goal={goalSheet === 'new' ? undefined : goalSheet} onDone={() => setGoalSheet(null)} />}
      </Sheet>
      <Sheet open={!!progGoal} onClose={() => setProgGoal(null)} title={progGoal?.title}>
        {progGoal && <CustomProgress goal={progGoal} onDone={() => setProgGoal(null)} onEdit={() => { setGoalSheet(progGoal); setProgGoal(null) }} />}
      </Sheet>
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

function CustomProgress({ goal, onDone, onEdit }: { goal: Goal; onDone: () => void; onEdit: () => void }) {
  const t = useT()
  const setGoalProgress = useStore((s) => s.setGoalProgress)
  const pk = periodKey(goal.period)
  const [v, setV] = useState(String(goal.progress?.[pk] || 0))
  const n = Number(v) || 0
  return (
    <>
      <Field label={`${t('goal.progress')} / ${goal.target}`}>
        <div className="gap8">
          <button className="btn ghost" onClick={() => setV(String(Math.max(0, n - 1)))}><Icon n="minus" size="s" /></button>
          <input className="input big" style={{ textAlign: 'center' }} inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} />
          <button className="btn ghost" onClick={() => setV(String(n + 1))}><Icon n="plus" size="s" /></button>
        </div>
      </Field>
      <button className="btn primary" style={{ width: '100%' }} onClick={() => { setGoalProgress(goal.id, pk, n); onDone() }}>{t('common.save')}</button>
      <button className="btn ghost" style={{ width: '100%', marginTop: 8 }} onClick={onEdit}>{t('goal.edit')}</button>
    </>
  )
}
