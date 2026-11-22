import type { ReactNode } from 'react'
import { useStore } from '../store'
import { useT } from '../i18n'
import { addDays, daysIn, dayKey, weekKey, weekStart } from '../lib/date'
import { avgMetric, bestStreak, dayPct, growthScore, habitAvg, sportTotals, totals } from '../lib/calc'
import { money, pct } from '../lib/format'
import { Bar, Heat } from './ui'
import { Icon } from './Icon'

/** Full per-sphere report for a date range. `prev` enables deltas (used by monthly summary). */
export function Report({ range, prev }: { range: [Date, Date]; prev?: [Date, Date] }) {
  const t = useT()
  const s = useStore()
  const today = dayKey()

  const hAvg = habitAvg(s, range)
  const days = daysIn(range)
  const okDays = days.filter((k) => k <= today && dayPct(s, k) >= 0.8).length
  const pastDays = days.filter((k) => k <= today).length
  const fin = totals(s.txs, range)
  const sp = sportTotals(s, range)
  const sleep = avgMetric(s, range, 'sleep')
  const steps = avgMetric(s, range, 'steps')

  // growth: every week that starts inside range
  const weeks: string[] = []
  for (let d = weekStart(range[0]); d < range[1]; d = addDays(d, 7)) if (d >= addDays(range[0], -6)) weeks.push(weekKey(d))
  const gScores = weeks.map((w) => growthScore(s.growth[w], s.growthTargets))
  const gAvg = gScores.length ? gScores.reduce((a, g) => a + g.pct, 0) / gScores.length : 0
  const places = weeks.filter((w) => s.growth[w]?.place?.done).length
  const skills = weeks.filter((w) => s.growth[w]?.skill?.done).length
  const langMin = weeks.reduce((a, w) => a + Object.values(s.growth[w]?.lang || {}).reduce((x, y) => x + y, 0), 0)

  const pv = prev && {
    hAvg: habitAvg(s, prev),
    fin: totals(s.txs, prev),
    sp: sportTotals(s, prev),
  }

  // heat: weeks as columns
  const start = weekStart(range[0])
  const cols = Math.ceil((range[1].getTime() - start.getTime()) / (7 * 86400000))
  const heatVals: (number | null)[] = []
  for (let c = 0; c < cols; c++)
    for (let r = 0; r < 7; r++) {
      const d = addDays(start, c * 7 + r)
      const k = dayKey(d)
      heatVals.push(d < range[0] || d >= range[1] || k > today ? null : dayPct(s, k))
    }

  const cats = Object.entries(fin.byCat).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <>
      <Section icon="check" title={t('stats.habits')}>
        <Trio
          a={[t('stats.avg'), pct(hAvg), pv && delta(hAvg - pv.hAvg, true)]}
          b={[t('stats.goodDays'), `${okDays}/${pastDays}`]}
          c={[t('stats.bestStreak'), `${bestStreak(s, range)}${t('unit.d')}`]}
        />
        <div style={{ marginTop: 14 }}>{cols <= 6 ? <Heat values={heatVals} cols={7} rows={cols} flow="row" /> : <Heat values={heatVals} cols={cols} />}</div>
      </Section>

      <Section icon="wallet" title={t('tab.finance')}>
        <Trio
          a={[t('fin.income'), money(fin.income, 'USD', { compact: true }), pv && delta(fin.income - pv.fin.income)]}
          b={[t('fin.expense'), money(fin.expense, 'USD', { compact: true }), pv && delta(fin.expense - pv.fin.expense, false, true)]}
          c={[t('stats.net'), money(fin.net, 'USD', { compact: true, sign: true }), fin.net ? <span className={fin.net > 0 ? 'pos' : 'neg'} style={{ fontSize: 10, marginLeft: 4 }}>●</span> : null]}
        />
        {cats.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {cats.map(([c, v]) => (
              <div key={c} style={{ padding: '6px 0' }}>
                <div className="row" style={{ fontSize: 13, marginBottom: 5 }}><span>{t(`cat.${c}`)}</span><span className="num mut" style={{ fontSize: 12 }}>{money(v)}</span></div>
                <Bar v={v / fin.expense} />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon="activity" title={t('tab.sport')}>
        <Trio
          a={[t('stats.workouts'), String(sp.count), pv && delta(sp.count - pv.sp.count)]}
          b={[t('stats.minutes'), `${sp.minutes}′`]}
          c={[t('stats.strength'), String(sp.byType.strength?.n || 0)]}
        />
        <div className="stats div" style={{ marginTop: 12, paddingTop: 12, gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
          <div><div className="lbl">{t('stats.avgSleep')}</div><div className="num">{sleep != null ? `${sleep.toFixed(1)}${t('unit.h')}` : '—'}</div></div>
          <div><div className="lbl">{t('stats.avgSteps')}</div><div className="num">{steps != null ? Math.round(steps).toLocaleString('en-US').replace(/,/g, ' ') : '—'}</div></div>
        </div>
      </Section>

      <Section icon="compass" title={t('tab.growth')}>
        <Trio
          a={[t('stats.avg'), pct(gAvg)]}
          b={[t('stats.places'), String(places)]}
          c={[t('stats.skills'), String(skills)]}
        />
        <div className="row div" style={{ marginTop: 12, paddingTop: 12, fontSize: 13 }}>
          <span className="t2">{t('stats.langMin')}</span>
          <span className="num">{langMin}′</span>
        </div>
      </Section>
    </>
  )
}

function delta(v: number, isPct = false, invert = false) {
  if (!v || Math.abs(v) < 0.005) return null
  const good = invert ? v < 0 : v > 0
  const txt = isPct ? `${v > 0 ? '+' : '−'}${Math.round(Math.abs(v) * 100)}pp` : `${v > 0 ? '+' : '−'}${Math.round(Math.abs(v)).toLocaleString('en-US')}`
  return <span className="mono" style={{ fontSize: 10, color: good ? 'var(--acc)' : 'var(--mut)', marginLeft: 4 }}>{txt}</span>
}

function Section({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <div className="card">
      <div className="card-head" style={{ marginBottom: 12 }}>
        <span className="gap8 h2"><Icon n={icon} size="s" className="acc" />{title}</span>
      </div>
      {children}
    </div>
  )
}

type Cell = [string, string, ReactNode?]
function Trio({ a, b, c }: { a: Cell; b: Cell; c: Cell }) {
  return (
    <div className="stats">
      {[a, b, c].map(([l, v, d], i) => (
        <div key={i}>
          <div className="lbl">{l}</div>
          <div className="num ellipsis">{v}{d}</div>
        </div>
      ))}
    </div>
  )
}
