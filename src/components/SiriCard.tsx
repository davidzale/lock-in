import { useState } from 'react'
import { useT } from '../i18n'
import { useSync } from '../lib/sync'
import { QUICK_URL, createToken, revokeTokens, savedToken } from '../lib/quick'
import { askConfirm } from './Confirm'
import { toast } from './Toast'
import { Icon } from './Icon'

const copy = (s: string) => navigator.clipboard?.writeText(s).then(() => toast('Скопировано / Copied', 1500)).catch(() => {})

export function SiriCard() {
  const t = useT()
  const session = useSync((s) => s.session)
  const [token, setToken] = useState(savedToken())
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  return (
    <div className="card">
      <button className="row" style={{ width: '100%' }} onClick={() => setOpen(!open)}>
        <span className="gap8 h2"><Icon n="mic" size="s" className="acc" />{t('siri.title')}</span>
        <Icon n={open ? 'down' : 'chev'} size="s" className="mut" />
      </button>
      <div className="mut" style={{ fontSize: 12, marginTop: 6 }}>{t('siri.hint')}</div>
      {open && (
        <div style={{ marginTop: 12 }}>
          {!session ? (
            <div className="mut" style={{ fontSize: 12 }}>{t('push.needCloud')}</div>
          ) : !token ? (
            <button className="btn primary sm" style={{ width: '100%' }} disabled={busy} onClick={async () => {
              setBusy(true); setErr('')
              try { setToken(await createToken(session.user.id)) } catch (e) { setErr((e as Error).message) }
              setBusy(false)
            }}>{t('siri.create')}</button>
          ) : (
            <>
              <div className="lbl" style={{ marginBottom: 6 }}>{t('siri.urlWithKey')}</div>
              <button className="input mono" style={{ height: 'auto', padding: '10px 12px', fontSize: 11, wordBreak: 'break-all', textAlign: 'left' }} onClick={() => copy(`${QUICK_URL}?token=${token}`)}>{`${QUICK_URL}?token=${token}`}</button>
              <button className="btn primary sm" style={{ width: '100%', marginTop: 8 }} onClick={() => copy(`${QUICK_URL}?token=${token}`)}><Icon n="check" size="s" />{t('siri.copyUrl')}</button>
              <div className="lbl" style={{ margin: '14px 0 6px' }}>{t('siri.steps')}</div>
              <ol className="t2" style={{ fontSize: 13, lineHeight: 1.55, paddingLeft: 18 }}>
                <li>{t('siri.s1')}</li>
                <li>{t('siri.s2')}</li>
                <li>{t('siri.s3')}</li>
                <li>{t('siri.s4')}</li>
                <li>{t('siri.s5')}</li>
                <li>{t('siri.s6')}</li>
              </ol>
              <button className="btn danger sm" style={{ width: '100%', marginTop: 12 }} onClick={async () => {
                if (!(await askConfirm(t('siri.revokeQ'), { ok: t('siri.revoke'), danger: true }))) return
                await revokeTokens(session.user.id)
                setToken(null)
              }}>{t('siri.revoke')}</button>
            </>
          )}
          {err && <div className="danger" style={{ fontSize: 12, marginTop: 8 }}>{err}</div>}
        </div>
      )}
    </div>
  )
}
