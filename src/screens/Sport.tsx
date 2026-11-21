import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import type { SessionKind } from '../store'
import { useT } from '../i18n'
import { addDays, dayKey, fmtDate, fmtWeekday, monthKey, parseDay, weekStart } from '../lib/date'
import { DAY_FAMILIES, EX, FAMILIES, PROGRAM_WEEKS, exCues, exName, flowSteps, phase, setsFor, stepsDuration, strengthSteps } from '../lib/program'
import { STRENGTH_DAYS, doneOn, doneToday, flowMinutes, nextDay, programWeek, weekForPlan } from '../lib/sportCalc'
import { Field, Header, IconBtn, Segs, Sheet } from '../components/ui'
import { Icon } from '../components/Icon'
import { MetricsForm, WorkoutForm } from '../components/QuickAdd'
import { ExerciseVideo } from '../components/ExerciseVideo'

export default function Sport() {
  const t = useT()
  const nav = useNavigate()
  const s = useStore()
  const sp = s.sport
  const lang = s.lang
  const L = lang === 'ru' ? 'ru' : 'en'
  const now = new Date()
  const today = dayKey(now)
  const mk = monthKey(now)
  const week = programWeek(sp)
  const planWeek = weekForPlan(week)
  const isStrengthDay = STRENGTH_DAYS.includes(now.getDay())
  const day = nextDay(sp)
  const strengthDone = doneToday(sp, ['A', 'B'])
  const yogaDone = doneToday(sp, ['yoga'])
  const stretchDone = doneToday(sp, ['stretch'])
  const [sheet, setSheet] = useState<'workout' | 'metrics' | 'weight' | { family: string } | null>(null)
  const [weight, setWeight] = useState(String(s.weights[mk] ?? ''))
  const daily = s.daily[today] || {}
  const ws = weekStart(now)

  const nextStrengthLabel = () => {
    for (let i = 1; i <= 7; i++) {
      const d = addDays(now, i)
      if (STRENGTH_DAYS.includes(d.getDay())) return fmtWeekday(d, lang, 'long')
    }
    return ''
  }
  const start = (k: SessionKind) => {
    if (!sp.start) s.sportPatch({ start: dayKey(weekStart(now)) })
    nav(`/session/${k}`)
  }
  const strengthMin = Math.round(stepsDuration(strengthSteps(day, planWeek, sp.levels)) / 60)
  const yogaMin = flowMinutes(s.habits, 'yoga')
  const stretchMin = flowMinutes(s.habits, 'stretch')
  const prs = Object.entries(sp.prs).filter(([ex]) => EX[ex] && !['march', 'breathing'].includes(ex)).sort((a, b) => b[1] - a[1]).slice(0, 6)

  return (
    <>
      <Header
        eyebrow={sp.start ? `${t('common.week')} ${week}/${PROGRAM_WEEKS} · ${t('sport.phase')} ${phase(planWeek)}` : t('sport.program12')}
        title={t('tab.sport')}
        actions={<IconBtn n="plus" label={t('quick.workout')} onClick={() => setSheet('workout')} />}
      />

      {sp.active && (
        <button className="banner" style={{ width: '100%', textAlign: 'left' }} onClick={() => nav(`/session/${sp.active!.kind}`)}>
          <div className="ibox"><Icon n="activity" size="s" /></div>
          <div className="grow"><div style={{ fontWeight: 600 }}>{t('sport.resume')}</div><div className="t2">{sp.active.kind === 'yoga' || sp.active.kind === 'stretch' ? t(`sess.${sp.active.kind}`) : `${t('sess.day')} ${sp.active.kind}`}</div></div>
          <Icon n="chev" size="s" className="mut" />
        </button>
      )}

      {!sp.spineNoteSeen && (
        <div className="card" style={{ borderColor: 'var(--acc-d)' }}>
          <div className="card-head"><span className="gap8 h2"><Icon n="activity" size="s" className="acc" />{t('sport.spineTitle')}</span>
            <button className="mut" aria-label="ok" onClick={() => s.sportPatch({ spineNoteSeen: true })}><Icon n="x" size="s" /></button></div>
          <div className="t2" style={{ fontSize: 13, lineHeight: 1.5 }}>{t('sport.spineText')}</div>
        </div>
      )}

      {/* week strip */}
      <div className="card" style={{ padding: '12px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4, textAlign: 'center' }}>
          {Array.from({ length: 7 }, (_, i) => {
            const d = addDays(ws, i)
            const k = dayKey(d)
            const str = doneOn(sp, k, ['A', 'B'])
            const fl = doneOn(sp, k, ['yoga', 'stretch'])
            const planned = STRENGTH_DAYS.includes(d.getDay())
            return (
              <div key={k}>
                <div className="lbl" style={{ color: k === today ? 'var(--acc)' : undefined }}>{fmtWeekday(d, lang).slice(0, 2)}</div>
                <div className={`daydot ${str ? 'on' : planned ? 'plan' : ''}`}>{str ? <Icon n="check" size="xs" /> : planned ? <Icon n="dumbbell" size="xs" /> : null}</div>
                <div style={{ height: 4, width: 4, borderRadius: 4, margin: '4px auto 0', background: fl ? 'var(--data2)' : 'transparent' }} />
              </div>
            )
          })}
        </div>
      </div>

      {/* today's strength */}
      <div className="card">
        <div className="card-head">
          <span className="gap8 h2"><Icon n="dumbbell" size="s" className="acc" />{t('sport.strength')}</span>
          <span className="lbl">{strengthDone ? `✓ ${strengthDone.minutes}′` : isStrengthDay ? t('cal.today') : `${t('sport.nextOn')} ${nextStrengthLabel()}`}</span>
        </div>
        <div className="t2" style={{ fontSize: 13, marginBottom: 10 }}>
          {t('sess.day')} {day} · ~{strengthMin} {t('unit.min')} · {t('sport.setsPer', { n: setsFor(planWeek) })}
        </div>
        {DAY_FAMILIES[day].map((f) => {
          const lv = FAMILIES[f].levels[Math.min(sp.levels[f] ?? 0, FAMILIES[f].levels.length - 1)]
          return (
            <div key={f} className="row" style={{ padding: '6px 0', fontSize: 14, borderTop: '1px solid var(--line2)' }}>
              <span className="ellipsis">{exName(lv.ex, lang)}</span>
              <span className="mono mut" style={{ fontSize: 11, flexShrink: 0 }}>{lv.lo}–{lv.hi}{EX[lv.ex].unit === 'sec' ? 's' : ''}</span>
            </div>
          )
        })}
        <button className={`btn ${strengthDone ? 'ghost' : 'primary'}`} style={{ width: '100%', marginTop: 12 }} onClick={() => start(day)}>
          {strengthDone ? t('sport.again') : sp.start ? t('sess.start') : t('sport.startProgram')}
        </button>
      </div>

      {/* yoga & stretch */}
      <div className="g2">
        {(['yoga', 'stretch'] as const).map((k) => {
          const done = k === 'yoga' ? yogaDone : stretchDone
          const min = k === 'yoga' ? yogaMin : stretchMin
          return (
            <button key={k} className="tile" onClick={() => start(k)}>
              <div className="row" style={{ alignItems: 'flex-start', marginBottom: 'auto' }}>
                <div className="ibox"><Icon n={k === 'yoga' ? 'sunrise' : 'moon'} size="s" /></div>
                {done && <span className="cb on" style={{ width: 18, height: 18, borderRadius: 6 }}><Icon n="check" size="xs" /></span>}
              </div>
              <div className="lbl" style={{ marginTop: 10 }}>{k === 'yoga' ? t('sport.morning') : t('sport.evening')}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{t(`sess.${k}`)}</div>
              <div className="mono mut" style={{ fontSize: 11, marginTop: 2 }}>{min} {t('unit.min')} · {flowSteps(k, min).length} {t('sess.poses')}</div>
            </button>
          )
        })}
      </div>

      {/* levels */}
      <div className="card">
        <div className="card-head"><span className="h2">{t('sport.levels')}</span><span className="lbl">{t('sport.levelsHint')}</span></div>
        {Object.entries(FAMILIES).map(([f, fam]) => {
          const li = Math.min(sp.levels[f] ?? 0, fam.levels.length - 1)
          return (
            <button key={f} className="list-row" style={{ display: 'block' }} onClick={() => setSheet({ family: f })}>
              <div className="row" style={{ marginBottom: 8 }}>
                <span className="grow ellipsis"><span className="mut" style={{ fontSize: 12 }}>{fam.name[L]} · </span>{exName(fam.levels[li].ex, lang)}</span>
                <span className="num mut" style={{ fontSize: 12 }}>{li + 1}/{fam.levels.length}</span>
              </div>
              <Segs v={(li + 1) / fam.levels.length} n={fam.levels.length} />
            </button>
          )
        })}
      </div>

      {/* records */}
      {prs.length > 0 && (
        <div className="card">
          <div className="card-head"><span className="h2">{t('sport.records')}</span></div>
          {prs.map(([ex, v]) => (
            <div key={ex} className="row" style={{ padding: '7px 0', fontSize: 14, borderTop: '1px solid var(--line2)' }}>
              <span className="ellipsis">{exName(ex, lang)}</span>
              <span className="num acc">{v}{EX[ex].unit === 'sec' ? 's' : ''}</span>
            </div>
          ))}
        </div>
      )}

      {/* body */}
      <div className="g2">
        <button className="tile" onClick={() => setSheet('metrics')}>
          <div className="ibox g"><Icon n="bed" size="s" /></div>
          <div className="lbl" style={{ marginTop: 10 }}>{t('sport.sleep')}</div>
          <div className="num" style={{ fontSize: 18, marginTop: 3 }}>{daily.sleep != null ? `${daily.sleep}${t('unit.h')}` : '—'}</div>
        </button>
        <button className="tile" onClick={() => setSheet('metrics')}>
          <div className="ibox g"><Icon n="foot" size="s" /></div>
          <div className="lbl" style={{ marginTop: 10 }}>{t('sport.steps')}</div>
          <div className="num" style={{ fontSize: 18, marginTop: 3 }}>{daily.steps != null ? daily.steps.toLocaleString('en-US').replace(/,/g, ' ') : '—'}</div>
        </button>
      </div>
      <button className="card list-row" onClick={() => setSheet('weight')}>
        <div className="ibox g"><Icon n="scale" size="s" /></div>
        <div className="grow"><div style={{ fontWeight: 500 }}>{t('sport.weight')}</div><div className="mut" style={{ fontSize: 12 }}>{t('sport.weightHint')}</div></div>
        <span className="num">{s.weights[mk] != null ? `${s.weights[mk]} ${t('unit.kg')}` : '—'}</span>
      </button>

      {/* history */}
      {sp.sessions.length > 0 && (
        <div className="card" style={{ paddingTop: 8, paddingBottom: 6 }}>
          <div className="lbl" style={{ padding: '6px 0' }}>{t('sport.recent')}</div>
          {sp.sessions.slice(0, 8).map((x) => (
            <div key={x.id} className="list-row">
              <span className="grow">{x.kind === 'yoga' || x.kind === 'stretch' ? t(`sess.${x.kind}`) : `${t('sess.day')} ${x.kind}${x.week ? ` · ${t('common.week')} ${x.week}` : ''}`}</span>
              <span className="mono mut" style={{ fontSize: 11 }}>{fmtDate(parseDay(x.date), lang, { day: '2-digit', month: '2-digit' })}</span>
              <span className="num" style={{ fontSize: 13 }}>{x.minutes}′</span>
            </div>
          ))}
        </div>
      )}

      <Sheet open={!!sheet} onClose={() => setSheet(null)} title={sheet === 'workout' ? t('quick.workout') : sheet === 'metrics' ? t('quick.metrics') : sheet === 'weight' ? t('sport.weight') : sheet ? FAMILIES[sheet.family].name[L] : ''}>
        {sheet === 'workout' && <WorkoutForm onDone={() => setSheet(null)} />}
        {sheet === 'metrics' && <MetricsForm onDone={() => setSheet(null)} />}
        {sheet === 'weight' && (
          <>
            <Field label={`${t('sport.weight')}, ${t('unit.kg')}`}>
              <input className="input big" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="83" />
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
        {sheet && typeof sheet === 'object' && <FamilySheet family={sheet.family} />}
      </Sheet>
    </>
  )
}

function FamilySheet({ family }: { family: string }) {
  const t = useT()
  const s = useStore()
  const lang = s.lang
  const fam = FAMILIES[family]
  const cur = Math.min(s.sport.levels[family] ?? 0, fam.levels.length - 1)
  const [openEx, setOpenEx] = useState<string | null>(fam.levels[cur].ex)
  const [link, setLink] = useState('')
  return (
    <>
      <div className="mut" style={{ fontSize: 12, marginBottom: 10 }}>{t('sport.levelRule')}</div>
      {fam.levels.map((lv, i) => {
        const e = EX[lv.ex]
        const open = openEx === lv.ex
        return (
          <div key={lv.ex} className="card" style={{ padding: '10px 14px', borderColor: i === cur ? 'var(--acc)' : undefined }}>
            <button className="row" style={{ width: '100%', textAlign: 'left' }} onClick={() => { setOpenEx(open ? null : lv.ex); setLink(s.sport.videos[lv.ex] || '') }}>
              <span className="gap8"><span className="num mut" style={{ fontSize: 12 }}>{i + 1}</span><span style={{ fontWeight: i === cur ? 600 : 400 }}>{exName(lv.ex, lang)}</span></span>
              <span className="mono mut" style={{ fontSize: 11 }}>{lv.lo}–{lv.hi}{e.unit === 'sec' ? 's' : ''}{s.sport.prs[lv.ex] ? ` · PR ${s.sport.prs[lv.ex]}` : ''}</span>
            </button>
            {open && (
              <div style={{ marginTop: 10 }}>
                {exCues(lv.ex, lang).map((c, k) => <div key={k} className="t2" style={{ fontSize: 13, padding: '2px 0' }}>• {c}</div>)}
                <div style={{ marginTop: 10 }}><ExerciseVideo exId={lv.ex} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 8, marginTop: 8 }}>
                  <button className="btn ghost sm" disabled={i === cur} onClick={() => s.sportPatch({ levels: { ...s.sport.levels, [family]: i }, hits: { ...s.sport.hits, [family]: 0 } })}>
                    {i === cur ? t('sport.current') : t('sport.setLevel')}
                  </button>
                </div>
                <div className="row" style={{ marginTop: 8, gap: 8 }}>
                  <input className="input" style={{ height: 38, fontSize: 13 }} placeholder={t('sport.myVideo')} value={link} onChange={(x) => setLink(x.target.value)} />
                  <button className="btn ghost sm" onClick={() => {
                    const v = { ...s.sport.videos }
                    if (/^https?:\/\//.test(link.trim())) v[lv.ex] = link.trim()
                    else delete v[lv.ex]
                    s.sportPatch({ videos: v })
                  }}>{t('common.save')}</button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
