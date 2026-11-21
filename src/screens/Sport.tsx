import { useState } from 'react'
import { useStore } from '../store'
import type { WorkoutType } from '../store'
import { useT } from '../i18n'
import { addDays, dayKey, fmtDate, fmtWeekday, isoWeek, monthKey, parseDay, periodRange, weekStart } from '../lib/date'
import { sportTotals } from '../lib/calc'
import { Field, Header, IconBtn, Sheet } from '../components/ui'
import { Icon } from '../components/Icon'
import { MetricsForm, WorkoutForm } from '../components/QuickAdd'

const TYPES: WorkoutType[] = ['strength', 'yoga', 'stretch', 'walk', 'other']

export default function Sport() {
  const t = useT()
  const s = useStore()
  const now = new Date()
  const ws = weekStart(now)
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i))
  const mins = days.map((d) => s.workouts.filter((w) => w.date === dayKey(d)).reduce((a, w) => a + w.minutes, 0))
  const maxMin = Math.max(60, ...mins)
  const week = sportTotals(s, periodRange('week', now))
  const month = sportTotals(s, periodRange('month', now))
  const strengthWeek = week.byType.strength?.n || 0
  const today = s.daily[dayKey(now)] || {}
  const mk = monthKey(now)
  const [sheet, setSheet] = useState<'workout' | 'metrics' | 'weight' | null>(null)
  const [weight, setWeight] = useState(String(s.weights[mk] ?? ''))
  const todayKey = dayKey(now)

  return (
    <>
      <Header
        eyebrow={`${t('common.week')} ${isoWeek(now)} · ${t('sport.strengthN', { n: strengthWeek })}`}
        title={t('tab.sport')}
        actions={<IconBtn n="plus" label={t('quick.workout')} onClick={() => setSheet('workout')} />}
      />

      <div className="card" style={{ paddingBottom: 10 }}>
        <div className="row" style={{ marginBottom: 10 }}>
          <span className="lbl">{t('sport.minutesByDay')}</span>
          <span className="num" style={{ fontSize: 12 }}>{week.minutes}′</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', alignItems: 'end', height: 96, gap: 6 }}>
          {days.map((d, i) => {
            const isToday = dayKey(d) === todayKey
            const h = mins[i] ? Math.max(8, (mins[i] / maxMin) * 80) : 6
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 12, height: h, borderRadius: 3,
                  background: mins[i] ? 'var(--data2)' : 'var(--track)',
                  outline: isToday ? '1.5px dashed var(--acc)' : 'none', outlineOffset: 2,
                }} />
                <span className="mono" style={{ fontSize: 10, color: isToday ? 'var(--acc)' : 'var(--mut)', textTransform: 'uppercase' }}>{fmtWeekday(d, s.lang).slice(0, 2)}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div className="ibox g"><Icon n="lock" size="s" /></div>
        <div className="grow">
          <div style={{ fontWeight: 600 }}>{t('sport.program')}</div>
          <div className="mut" style={{ fontSize: 12, marginTop: 2 }}>{t('sport.programSoon')}</div>
        </div>
      </div>

      <div className="card" style={{ paddingTop: 8, paddingBottom: 6 }}>
        <div className="lbl" style={{ padding: '6px 0' }}>{t('sport.thisMonth')}</div>
        {TYPES.filter((x) => month.byType[x]).map((x) => (
          <div key={x} className="list-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 14 }}>
            <span>{t(`wt.${x}`)}</span>
            <span className="mono mut" style={{ fontSize: 12 }}>{Math.floor(month.byType[x].min / 60)}{t('unit.h')} {month.byType[x].min % 60}{t('unit.m')}</span>
            <span className="num" style={{ fontSize: 13 }}>{String(month.byType[x].n).padStart(2, '0')}</span>
          </div>
        ))}
        {!month.count && <div className="empty">{t('sport.noWorkouts')}</div>}
      </div>

      <div className="g2">
        <button className="tile" onClick={() => setSheet('metrics')}>
          <div className="ibox g"><Icon n="bed" size="s" /></div>
          <div className="lbl" style={{ marginTop: 10 }}>{t('sport.sleep')}</div>
          <div className="num" style={{ fontSize: 18, marginTop: 3 }}>{today.sleep != null ? `${today.sleep}${t('unit.h')}` : '—'}</div>
        </button>
        <button className="tile" onClick={() => setSheet('metrics')}>
          <div className="ibox g"><Icon n="foot" size="s" /></div>
          <div className="lbl" style={{ marginTop: 10 }}>{t('sport.steps')}</div>
          <div className="num" style={{ fontSize: 18, marginTop: 3 }}>{today.steps != null ? today.steps.toLocaleString('en-US').replace(/,/g, ' ') : '—'}</div>
        </button>
      </div>
      <button className="card list-row" style={{ border: '1px solid var(--line)' }} onClick={() => setSheet('weight')}>
        <div className="ibox g"><Icon n="scale" size="s" /></div>
        <div className="grow">
          <div style={{ fontWeight: 500 }}>{t('sport.weight')}</div>
          <div className="mut" style={{ fontSize: 12 }}>{t('sport.weightHint')}</div>
        </div>
        <span className="num">{s.weights[mk] != null ? `${s.weights[mk]} ${t('unit.kg')}` : '—'}</span>
      </button>

      {s.workouts.length > 0 && (
        <div className="card" style={{ paddingTop: 8, paddingBottom: 6 }}>
          <div className="lbl" style={{ padding: '6px 0' }}>{t('sport.recent')}</div>
          {s.workouts.slice(0, 8).map((w) => (
            <div key={w.id} className="list-row">
              <span className="grow">{t(`wt.${w.type}`)}</span>
              <span className="mono mut" style={{ fontSize: 11 }}>{fmtDate(parseDay(w.date), s.lang, { day: '2-digit', month: '2-digit' })}</span>
              <span className="num" style={{ fontSize: 13 }}>{w.minutes}′</span>
              <button className="mut" aria-label={t('common.delete')} onClick={() => confirm(t('common.confirmDelete')) && s.removeWorkout(w.id)}><Icon n="x" size="xs" /></button>
            </div>
          ))}
        </div>
      )}

      <Sheet open={!!sheet} onClose={() => setSheet(null)} title={sheet === 'workout' ? t('quick.workout') : sheet === 'metrics' ? t('quick.metrics') : t('sport.weight')}>
        {sheet === 'workout' && <WorkoutForm onDone={() => setSheet(null)} />}
        {sheet === 'metrics' && <MetricsForm onDone={() => setSheet(null)} />}
        {sheet === 'weight' && (
          <>
            <Field label={`${t('sport.weight')}, ${t('unit.kg')}`}>
              <input className="input big" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="83" autoFocus />
            </Field>
            <button className="btn primary" style={{ width: '100%' }} onClick={() => {
              const v = Number(weight.replace(',', '.'))
              const next = { ...s.weights }
              if (v > 0) next[mk] = v
              else delete next[mk]
              s.set('weights', next)
              setSheet(null)
            }}>{t('common.save')}</button>
          </>
        )}
      </Sheet>
    </>
  )
}
