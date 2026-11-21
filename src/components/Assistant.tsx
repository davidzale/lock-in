import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { useT } from '../i18n'
import { useSync } from '../lib/sync'
import { useGcal, loadWeek } from '../lib/gcal'
import { weekStart } from '../lib/date'
import { apply, ask, describe } from '../lib/assistant'
import type { Action } from '../lib/assistant'
import { Sheet, useOverlay } from './ui'
import { Icon } from './Icon'

type Rec = {
  lang: string; interimResults: boolean; continuous: boolean
  onresult: (e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void
  onerror: (e: { error: string }) => void; onend: () => void; start: () => void; stop: () => void
}
const SR = (window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec }).SpeechRecognition
  || (window as unknown as { webkitSpeechRecognition?: new () => Rec }).webkitSpeechRecognition

export function Assistant() {
  const t = useT()
  const lang = useStore((s) => s.lang)
  const session = useSync((s) => s.session)
  const calendar = useGcal((g) => !!g.connected)
  const [open, setOpen] = useState(false)
  const overlay = useOverlay((o) => o.count > 0)
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [reply, setReply] = useState('')
  const [actions, setActions] = useState<{ a: Action; label: string; on: boolean }[]>([])
  const [done, setDone] = useState(false)
  const rec = useRef<Rec | null>(null)
  const base = useRef('')

  const reset = () => { setText(''); setReply(''); setActions([]); setErr(''); setDone(false) }
  const close = () => { rec.current?.stop(); setOpen(false); setTimeout(reset, 250) }

  useEffect(() => () => rec.current?.stop(), [])

  const listen = () => {
    if (!SR) return
    if (listening) { rec.current?.stop(); return }
    const r = new SR()
    r.lang = lang === 'ru' ? 'ru-RU' : 'en-US'
    r.interimResults = true
    r.continuous = false
    base.current = text ? text.trim() + ' ' : ''
    r.onresult = (e) => {
      let s = ''
      for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript
      setText(base.current + s)
    }
    r.onerror = (e) => { setListening(false); if (e.error !== 'aborted' && e.error !== 'no-speech') setErr(t('ai.micError')) }
    r.onend = () => setListening(false)
    rec.current = r
    setErr('')
    try { r.start(); setListening(true) } catch { setErr(t('ai.micError')) }
  }

  const send = async () => {
    rec.current?.stop()
    if (!text.trim()) return
    setBusy(true); setErr(''); setReply(''); setActions([]); setDone(false)
    try {
      const r = await ask(text.trim(), calendar)
      const s = useStore.getState()
      setReply(r.reply)
      setActions(r.actions.map((a) => ({ a, label: describe(a, t, s) || '', on: true })).filter((x) => x.label))
    } catch (e) {
      setErr((e as Error).message)
    }
    setBusy(false)
  }

  const confirm = async () => {
    setBusy(true); setErr('')
    try {
      for (const x of actions) if (x.on) await apply(x.a)
      if (actions.some((x) => x.on && x.a.tool === 'create_calendar_event')) loadWeek(weekStart(new Date()), true)
      setDone(true)
      navigator.vibrate?.(15)
      setTimeout(close, 900)
    } catch (e) {
      setErr((e as Error).message)
    }
    setBusy(false)
  }

  return (
    <>
      <button className={`fab ${overlay ? 'hide' : ''}`} aria-label={t('ai.title')} onClick={() => setOpen(true)}>
        <Icon n="mic" />
      </button>
      <Sheet open={open} onClose={close} title={t('ai.title')}>
        {!session ? (
          <div className="mut" style={{ fontSize: 13, paddingBottom: 8 }}>{t('ai.needCloud')}</div>
        ) : (
          <>
            <div style={{ position: 'relative' }}>
              <textarea
                className="input"
                style={{ height: 96, padding: '12px 56px 12px 14px', resize: 'none', lineHeight: 1.4 }}
                placeholder={t('ai.placeholder')}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              />
              {SR && (
                <button
                  onClick={listen}
                  aria-label="mic"
                  className={listening ? 'mic on' : 'mic'}
                >
                  <Icon n="mic" size="s" />
                </button>
              )}
            </div>
            <div className="mut" style={{ fontSize: 11, margin: '6px 0 12px' }}>{SR ? t('ai.hintMic') : t('ai.hintKeyboard')}</div>

            {err && <div className="danger" style={{ fontSize: 12, marginBottom: 10 }}>{err}</div>}
            {reply && <div className="t2" style={{ fontSize: 14, marginBottom: 10 }}>{reply}</div>}

            {actions.length > 0 && (
              <div className="card" style={{ padding: '4px 14px' }}>
                {actions.map((x, k) => (
                  <button key={k} className={`task ${x.on ? '' : 'done'}`} onClick={() => setActions(actions.map((y, j) => (j === k ? { ...y, on: !y.on } : y)))}>
                    <span className={`cb ${x.on ? 'on' : ''}`}>{x.on && <Icon n="check" size="xs" />}</span>
                    <span className="tname grow" style={{ fontSize: 13 }}>{x.label}</span>
                  </button>
                ))}
              </div>
            )}

            {done ? (
              <div className="btn ghost" style={{ width: '100%' }}><Icon n="check" size="s" className="acc" />{t('ai.done')}</div>
            ) : actions.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
                <button className="btn ghost" onClick={reset} disabled={busy}>{t('ai.again')}</button>
                <button className="btn primary" onClick={confirm} disabled={busy || !actions.some((x) => x.on)}>
                  {busy ? '…' : t('ai.apply', { n: actions.filter((x) => x.on).length })}
                </button>
              </div>
            ) : (
              <button className="btn primary" style={{ width: '100%' }} onClick={send} disabled={busy || !text.trim()}>
                {busy ? t('ai.thinking') : t('ai.send')}
              </button>
            )}
          </>
        )}
      </Sheet>
    </>
  )
}
