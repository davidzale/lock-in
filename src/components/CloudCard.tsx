import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { pull, syncNow, useSync } from '../lib/sync'
import { useT } from '../i18n'
import { Field } from './ui'
import { Icon } from './Icon'
import { disconnectGoogle, useGcal } from '../lib/gcal'

export function CloudCard() {
  const t = useT()
  const { session, status, lastSync, error } = useSync()
  const gConnected = useGcal((g) => g.connected)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const run = async (fn: () => Promise<{ error: { message: string } | null }>, okText?: string) => {
    setBusy(true)
    setMsg(null)
    const { error } = await fn()
    setBusy(false)
    if (error) setMsg({ ok: false, text: error.message })
    else if (okText) setMsg({ ok: true, text: okText })
  }

  if (session) {
    return (
      <div className="card">
        <div className="card-head">
          <span className="gap8 h2"><Icon n="upload" size="s" className="acc" />{t('cloud.title')}</span>
          <span className={`tag ${status === 'error' ? '' : 'acc'}`}>{t(`cloud.status.${status}`)}</span>
        </div>
        <div className="t2" style={{ fontSize: 13 }}>{session.user.email}</div>
        {lastSync && <div className="mono mut" style={{ fontSize: 11, marginTop: 4 }}>{t('cloud.last')} {new Date(lastSync).toLocaleString()}</div>}
        {error && <div className="danger" style={{ fontSize: 12, marginTop: 6 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
          <button className="btn ghost sm" onClick={() => syncNow().then(pull)}>{t('cloud.syncNow')}</button>
          <button className="btn ghost sm" onClick={() => supabase.auth.signOut()}>{t('cloud.signOut')}</button>
        </div>
        {gConnected && (
          <div className="row div" style={{ marginTop: 12, paddingTop: 12, fontSize: 13 }}>
            <span className="gap8"><Icon n="cal" size="s" className="acc" />Google Calendar</span>
            <button className="lbl" onClick={() => confirm(t('cal.disconnectQ')) && disconnectGoogle()}>{t('cal.disconnect')}</button>
          </div>
        )}
      </div>
    )
  }

  const valid = /\S+@\S+\.\S+/.test(email) && password.length >= 8
  return (
    <div className="card">
      <div className="gap8 h2" style={{ marginBottom: 6 }}><Icon n="upload" size="s" className="acc" />{t('cloud.title')}</div>
      <div className="mut" style={{ fontSize: 12, marginBottom: 12 }}>{t('cloud.hint')}</div>
      <Field label="Email">
        <input className="input" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value.trim())} />
      </Field>
      <Field label={t('cloud.password')}>
        <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      {msg && <div className={msg.ok ? 'acc' : 'danger'} style={{ fontSize: 12, marginBottom: 10 }}>{msg.text}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button className="btn primary sm" disabled={!valid || busy} onClick={() => run(() => supabase.auth.signInWithPassword({ email, password }))}>
          {t('cloud.signIn')}
        </button>
        <button
          className="btn ghost sm"
          disabled={!valid || busy}
          onClick={() => run(() => supabase.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } }), t('cloud.checkEmail'))}
        >
          {t('cloud.signUp')}
        </button>
      </div>
      <div className="mut" style={{ fontSize: 11, marginTop: 8 }}>{t('cloud.pwHint')}</div>
    </div>
  )
}
