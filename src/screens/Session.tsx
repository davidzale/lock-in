import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import type { SessionKind } from '../store'
import { useT } from '../i18n'
import { EX, FAMILIES, exCues, exName, flowSteps, stepsDuration, strengthSteps } from '../lib/program'
import type { Step } from '../lib/program'
import { flowMinutes, programWeek, weekForPlan } from '../lib/sportCalc'
import { Icon } from '../components/Icon'
import { ExerciseVideo } from '../components/ExerciseVideo'

// ---------- tiny audio + wake lock helpers ----------
let ctx: AudioContext | null = null
function unlockAudio() {
  try {
    ctx ||= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
  } catch { /* no audio */ }
}
function beep(freq = 880, ms = 140, vol = 0.18) {
  if (!ctx) return
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.frequency.value = freq
  g.gain.value = vol
  o.connect(g).connect(ctx.destination)
  o.start()
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000)
  o.stop(ctx.currentTime + ms / 1000 + 0.02)
}
function useWakeLock(on: boolean) {
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return
    let lock: { release: () => Promise<void> } | null = null
    const req = () => (navigator as Navigator & { wakeLock: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock.request('screen').then((l) => (lock = l)).catch(() => {})
    req()
    const onVis = () => document.visibilityState === 'visible' && req()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      lock?.release().catch(() => {})
    }
  }, [on])
}

/** countdown that survives the app going to background (based on wall-clock end time) */
function useCountdown(seconds: number, key: string, running: boolean, onDone: () => void) {
  const [left, setLeft] = useState(seconds)
  const end = useRef(Date.now() + seconds * 1000)
  const pausedLeft = useRef<number | null>(null)
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    end.current = Date.now() + seconds * 1000
    pausedLeft.current = null
    setLeft(seconds)
  }, [key, seconds])
  useEffect(() => {
    if (!running) {
      pausedLeft.current = Math.max(0, (end.current - Date.now()) / 1000)
      return
    }
    if (pausedLeft.current != null) end.current = Date.now() + pausedLeft.current * 1000
    pausedLeft.current = null
    let lastWhole = Math.ceil((end.current - Date.now()) / 1000)
    const id = setInterval(() => {
      const l = Math.max(0, (end.current - Date.now()) / 1000)
      setLeft(l)
      const whole = Math.ceil(l)
      if (whole !== lastWhole) {
        lastWhole = whole
        if (whole <= 3 && whole > 0) beep(660, 90, 0.12)
      }
      if (l <= 0) {
        clearInterval(id)
        beep(990, 220)
        navigator.vibrate?.(200)
        done.current()
      }
    }, 200)
    return () => clearInterval(id)
  }, [running, key])
  const add = (s: number) => { end.current += s * 1000; setLeft((x) => x + s) }
  return { left, add }
}

function Ring({ v, size = 220, children }: { v: number; size?: number; children: ReactNode }) {
  const r = 46
  const c = 2 * Math.PI * r
  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} viewBox="0 0 104 104">
        <g fill="none" strokeWidth={5} strokeLinecap="round" transform="rotate(-90 52 52)">
          <circle cx="52" cy="52" r={r} stroke="var(--track)" />
          <circle cx="52" cy="52" r={r} stroke="var(--acc)" strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(1, v)))} style={{ transition: 'stroke-dashoffset .25s linear' }} />
        </g>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>{children}</div>
    </div>
  )
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export default function Session() {
  const t = useT()
  const nav = useNavigate()
  const { kind = 'A' } = useParams() as { kind: SessionKind }
  const s = useStore()
  const lang = s.lang
  const sp = s.sport
  const resume = sp.active && sp.active.kind === kind ? sp.active : null
  const week = resume?.week ?? programWeek(sp)

  const steps: Step[] = useMemo(() => {
    if (kind === 'yoga' || kind === 'stretch') return flowSteps(kind, flowMinutes(s.habits, kind))
    return strengthSteps(kind, weekForPlan(week), sp.levels)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, week])

  const [started, setStarted] = useState(!!resume)
  const [idx, setIdx] = useState(resume?.step ?? 0)
  const [logs, setLogs] = useState<Record<string, number[]>>(resume?.logs ?? {})
  const [startedAt] = useState(resume?.startedAt ?? Date.now())
  const [paused, setPaused] = useState(false)
  const [resting, setResting] = useState(false)
  const [summary, setSummary] = useState<{ minutes: number; levelUps: string[]; prs: string[] } | null>(null)
  const [confirmExit, setConfirmExit] = useState(false)
  const [, tick] = useState(0)
  useWakeLock(started && !summary)
  useEffect(() => {
    const id = setInterval(() => tick((x) => x + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // each step starts at the top of the screen
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [started, idx, resting, summary])

  // persist progress so closing the app resumes where you left off
  useEffect(() => {
    if (!started || summary) return
    s.sportPatch({ active: { kind, startedAt, step: idx, week, logs } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, idx, logs, summary])

  const step = steps[idx]
  const isFlow = kind === 'yoga' || kind === 'stretch'
  const title = isFlow ? t(`sess.${kind}`) : `${t('sess.day')} ${kind} · ${t('common.week')} ${week}`

  const finish = () => {
    const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000))
    const before = { ...sp.prs }
    const levelUps = s.finishSession(kind, minutes, logs, week)
    const prs = Object.entries(logs).filter(([ex, reps]) => reps.some((r) => r > (before[ex] || 0)) && (before[ex] || 0) > 0).map(([ex]) => ex)
    setSummary({ minutes, levelUps, prs })
  }
  const next = () => {
    setResting(false)
    if (idx >= steps.length - 1) finish()
    else setIdx(idx + 1)
  }
  const prev = () => { setResting(false); setIdx(Math.max(0, idx - 1)) }

  // ---------- summary ----------
  if (summary) {
    const sets = Object.values(logs).reduce((a, r) => a + r.length, 0)
    const reps = Object.entries(logs).filter(([ex]) => EX[ex]?.unit === 'reps').reduce((a, [, r]) => a + r.reduce((x, y) => x + y, 0), 0)
    return (
      <div className="session">
        <div style={{ textAlign: 'center', paddingTop: 30 }}>
          <div className="ibox" style={{ width: 64, height: 64, borderRadius: 22, margin: '0 auto 16px' }}><Icon n="check" /></div>
          <div className="h">{t('sess.doneTitle')}</div>
          <div className="mut" style={{ marginTop: 6 }}>{title}</div>
        </div>
        <div className="card stats" style={{ marginTop: 24 }}>
          <div><div className="lbl">{t('stats.minutes')}</div><div className="num">{summary.minutes}′</div></div>
          <div><div className="lbl">{t('sess.sets')}</div><div className="num">{isFlow ? steps.length : sets}</div></div>
          <div><div className="lbl">{isFlow ? t('sess.poses') : t('sess.reps')}</div><div className="num">{isFlow ? steps.length : reps}</div></div>
        </div>
        {summary.levelUps.map((f) => {
          const lv = FAMILIES[f].levels[s.sport.levels[f]]
          return (
            <div key={f} className="banner">
              <div className="ibox"><Icon n="up" size="s" /></div>
              <div className="grow"><div style={{ fontWeight: 600 }}>{t('sess.levelUp')}</div><div className="t2">{FAMILIES[f].name[lang === 'ru' ? 'ru' : 'en']}: {exName(lv.ex, lang)}</div></div>
            </div>
          )
        })}
        {summary.prs.length > 0 && (
          <div className="card">
            <div className="lbl" style={{ marginBottom: 6 }}>{t('sess.newPrs')}</div>
            {summary.prs.map((ex) => (
              <div key={ex} className="row" style={{ padding: '6px 0' }}><span>{exName(ex, lang)}</span><span className="num acc">{s.sport.prs[ex]}{EX[ex].unit === 'sec' ? 's' : ''}</span></div>
            ))}
          </div>
        )}
        <button className="btn primary" style={{ width: '100%', marginTop: 12 }} onClick={() => nav('/sport', { replace: true })}>{t('ai.done')}</button>
      </div>
    )
  }

  // ---------- intro ----------
  if (!started) {
    const est = Math.round(stepsDuration(steps) / 60)
    const groups: { label: string; items: string[] }[] = []
    if (isFlow) groups.push({ label: `${steps.length} ${t('sess.poses')}`, items: [...new Set(steps.map((x) => exName(x.ex, lang)))] })
    else {
      groups.push({ label: `${t('sess.warmup')} · 8′`, items: steps.filter((x) => x.kind === 'timed' && x.part === 'warmup').map((x) => exName(x.ex, lang)) })
      const fams = [...new Map(steps.filter((x): x is Extract<Step, { kind: 'set' }> => x.kind === 'set').map((x) => [x.family, x])).values()]
      groups.push({ label: `${t('sess.strength')} · ${fams[0]?.sets}×`, items: fams.map((x) => `${exName(x.ex, lang)} · ${x.lo}–${x.hi}${EX[x.ex].unit === 'sec' ? ' s' : ''}${EX[x.ex].side ? ` ${t('sess.perSide')}` : ''}`) })
      groups.push({ label: t('sess.finisher'), items: [...new Set(steps.filter((x) => x.kind === 'timed' && x.part === 'finisher').map((x) => exName(x.ex, lang)))] })
      groups.push({ label: t('sess.cooldown'), items: steps.filter((x) => x.kind === 'timed' && x.part === 'cooldown').map((x) => exName(x.ex, lang)) })
    }
    return (
      <div className="session">
        <div className="row" style={{ marginBottom: 18 }}>
          <button className="iconbtn" onClick={() => nav(-1)} aria-label="back"><Icon n="back" size="s" /></button>
          <span className="lbl">~{est} {t('unit.min')}</span>
        </div>
        <div className="h" style={{ marginBottom: 16 }}>{title}</div>
        {groups.map((g) => (
          <div key={g.label} className="card">
            <div className="lbl" style={{ marginBottom: 8 }}>{g.label}</div>
            {g.items.map((x, i) => <div key={i} className="t2" style={{ fontSize: 14, padding: '4px 0' }}>{x}</div>)}
          </div>
        ))}
        <button className="btn primary" style={{ width: '100%', height: 54, fontSize: 17, marginTop: 6 }} onClick={() => { unlockAudio(); beep(880, 80, 0.08); setStarted(true) }}>
          <Icon n="activity" size="s" />{t('sess.start')}
        </button>
      </div>
    )
  }

  // ---------- running ----------
  const elapsed = Math.round((Date.now() - startedAt) / 1000)
  const nextStep = steps[idx + 1]
  return (
    <div className="session">
      <div className="row" style={{ marginBottom: 10 }}>
        <button className="iconbtn" onClick={() => setConfirmExit(true)} aria-label="close"><Icon n="x" size="s" /></button>
        <span className="num mut" style={{ fontSize: 13 }}>{fmt(elapsed)}</span>
        <span className="num mut" style={{ fontSize: 13 }}>{idx + 1}/{steps.length}</span>
      </div>
      <div className="bar" style={{ marginBottom: 18 }}><i style={{ width: `${((idx + (resting ? 0.5 : 0)) / steps.length) * 100}%`, background: 'var(--acc)' }} /></div>

      {step.kind === 'timed' ? (
        <TimedView key={idx} step={step} paused={paused} onDone={next} lang={lang} t={t} />
      ) : resting ? (
        <RestView key={`r${idx}`} sec={step.rest} paused={paused} onDone={next} t={t} nextName={nextStep ? exName(nextStep.ex, lang) : ''} />
      ) : (
        <SetView
          key={idx}
          step={step}
          lang={lang}
          t={t}
          prev={(logs[step.ex] || [])[step.set - 2]}
          onLog={(v) => {
            const arr = [...(logs[step.ex] || [])]
            arr[step.set - 1] = v
            setLogs({ ...logs, [step.ex]: arr })
            navigator.vibrate?.(20)
            if (idx >= steps.length - 1) finish()
            else if (step.rest > 0) setResting(true)
            else next()
          }}
        />
      )}

      <div className="session-controls">
        <button className="iconbtn big" onClick={prev} disabled={idx === 0} aria-label="previous"><Icon n="back" /></button>
        {(step.kind === 'timed' || resting) && (
          <button className="fab-inline" onClick={() => setPaused(!paused)} aria-label="pause">
            {paused ? <Icon n="activity" /> : <span style={{ display: 'flex', gap: 5 }}><i className="pause-bar" /><i className="pause-bar" /></span>}
          </button>
        )}
        <button className="iconbtn big" onClick={next} aria-label="skip"><Icon n="chev" /></button>
      </div>
      {nextStep && !resting && <div className="mut" style={{ textAlign: 'center', fontSize: 12, marginTop: 12 }}>{t('sess.next')}: {exName(nextStep.ex, lang)}</div>}

      {confirmExit && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>{t('sess.exitQ')}</div>
          <div style={{ display: 'grid', gap: 8 }}>
            <button className="btn primary sm" onClick={finish}>{t('sess.finishNow')}</button>
            <button className="btn ghost sm" onClick={() => nav('/sport')}>{t('sess.later')}</button>
            <button className="btn danger sm" onClick={() => { s.sportPatch({ active: null }); nav('/sport') }}>{t('sess.discard')}</button>
            <button className="btn ghost sm" onClick={() => setConfirmExit(false)}>{t('sess.continue')}</button>
          </div>
        </div>
      )}
    </div>
  )
}

type TFn = (k: string, v?: Record<string, string | number>) => string

function TimedView({ step, paused, onDone, lang, t }: { step: Extract<Step, { kind: 'timed' }>; paused: boolean; onDone: () => void; lang: string; t: TFn }) {
  const { left, add } = useCountdown(step.sec, `${step.ex}${step.sec}${step.label}`, !paused, onDone)
  const part = step.part === 'flow' ? '' : t(`sess.${step.part}`)
  return (
    <div className="step-in">
      <div className="lbl acc" style={{ textAlign: 'center' }}>{part}{step.label ? `${part ? ' · ' : ''}${step.label === 'L' ? t('sess.left') : step.label === 'R' ? t('sess.right') : step.label}` : ''}</div>
      <div className="h" style={{ textAlign: 'center', margin: '6px 0 18px' }}>{exName(step.ex, lang)}</div>
      <Ring v={left / step.sec}>
        <div>
          <div className="num" style={{ fontSize: 56, fontWeight: 600 }}>{Math.ceil(left)}</div>
          <button className="lbl" onClick={() => add(15)}>+15 s</button>
        </div>
      </Ring>
      <div style={{ marginTop: 18 }}>
        {exCues(step.ex, lang).map((c, i) => <div key={i} className="t2" style={{ fontSize: 14, textAlign: 'center', padding: '3px 0' }}>{c}</div>)}
        {step.part !== 'rest' && <div style={{ marginTop: 12 }}><ExerciseVideo exId={step.ex} /></div>}
      </div>
    </div>
  )
}

function RestView({ sec, paused, onDone, t, nextName }: { sec: number; paused: boolean; onDone: () => void; t: TFn; nextName: string }) {
  const { left, add } = useCountdown(sec, 'rest', !paused, onDone)
  return (
    <div className="step-in">
      <div className="lbl acc" style={{ textAlign: 'center' }}>{t('sess.rest')}</div>
      <div className="h" style={{ textAlign: 'center', margin: '6px 0 18px', fontSize: 22 }}>{t('sess.next')}: {nextName}</div>
      <Ring v={left / sec}>
        <div>
          <div className="num" style={{ fontSize: 56, fontWeight: 600 }}>{Math.ceil(left)}</div>
          <div className="gap8" style={{ justifyContent: 'center' }}>
            <button className="lbl" onClick={() => add(15)}>+15 s</button>
            <button className="lbl acc" onClick={onDone}>{t('sess.skipRest')}</button>
          </div>
        </div>
      </Ring>
    </div>
  )
}

function SetView({ step, lang, t, prev, onLog }: { step: Extract<Step, { kind: 'set' }>; lang: string; t: TFn; prev?: number; onLog: (v: number) => void }) {
  const e = EX[step.ex]
  const isSec = e.unit === 'sec'
  const [v, setV] = useState(prev ?? (isSec ? step.lo : Math.round((step.lo + step.hi) / 2)))
  const [timing, setTiming] = useState(false)
  const t0 = useRef(0)
  const [, tick] = useState(0)
  useEffect(() => {
    if (!timing) return
    const id = setInterval(() => { setV(Math.floor((Date.now() - t0.current) / 1000)); tick((x) => x + 1) }, 250)
    return () => clearInterval(id)
  }, [timing])
  return (
    <div className="step-in">
      <div className="lbl acc" style={{ textAlign: 'center' }}>{FAMILIES[step.family].name[lang === 'ru' ? 'ru' : 'en']} · {t('sess.setOf', { a: step.set, b: step.sets })}</div>
      <div className="h" style={{ textAlign: 'center', margin: '6px 0 4px' }}>{exName(step.ex, lang)}</div>
      <div className="mut" style={{ textAlign: 'center', fontSize: 13 }}>
        {t('sess.target')}: <span className="num" style={{ color: 'var(--text)' }}>{step.lo}–{step.hi}</span> {isSec ? t('sess.seconds') : t('sess.repsShort')}{e.side ? ` ${t('sess.perSide')}` : ''}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        {exCues(step.ex, lang).map((c, i) => <div key={i} className="t2" style={{ fontSize: 13.5, padding: '3px 0' }}>• {c}</div>)}
        <div style={{ marginTop: 10 }}><ExerciseVideo exId={step.ex} /></div>
      </div>

      <div className="stepper">
        <button className="iconbtn big" onClick={() => setV(Math.max(0, v - 1))} aria-label="minus"><Icon n="minus" /></button>
        <div style={{ textAlign: 'center' }}>
          <div className="num" style={{ fontSize: 64, fontWeight: 600, lineHeight: 1 }}>{v}</div>
          <div className="lbl" style={{ marginTop: 4 }}>{isSec ? t('sess.seconds') : t('sess.repsShort')}</div>
        </div>
        <button className="iconbtn big" onClick={() => setV(v + 1)} aria-label="plus"><Icon n="plus" /></button>
      </div>
      {isSec && (
        <button className="btn ghost" style={{ width: '100%', marginBottom: 8 }} onClick={() => { if (timing) setTiming(false); else { t0.current = Date.now(); setV(0); setTiming(true); unlockAudio() } }}>
          {timing ? t('sess.stopTimer') : t('sess.startTimer')}
        </button>
      )}
      <button className="btn primary" style={{ width: '100%', height: 52 }} onClick={() => { setTiming(false); onLog(v) }}>
        <Icon n="check" size="s" />{t('sess.logSet')}
      </button>
    </div>
  )
}
