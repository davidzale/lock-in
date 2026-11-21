import { useEffect, useState } from 'react'
import { useT } from '../i18n'
import { useSync } from '../lib/sync'
import { disablePush, enablePush, isStandalone, pushEnabled, pushSupported, refreshPushTz, testPush } from '../lib/push'
import { Switch } from './ui'
import { Icon } from './Icon'

export function PushCard() {
  const t = useT()
  const session = useSync((s) => s.session)
  const [on, setOn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const supported = pushSupported()

  useEffect(() => {
    if (!supported) return
    pushEnabled().then((v) => {
      setOn(v)
      if (v && session) refreshPushTz(session.user.id)
    })
  }, [supported, session])

  const toggle = async (v: boolean) => {
    if (!session) return
    setBusy(true)
    setMsg(null)
    try {
      if (v) await enablePush(session.user.id)
      else await disablePush()
      setOn(v)
    } catch (e) {
      const m = (e as Error).message
      setMsg({ ok: false, text: m === 'permission' ? t('push.denied') : m })
    }
    setBusy(false)
  }

  let hint = t('push.hint')
  if (!session) hint = t('push.needCloud')
  else if (!isStandalone()) hint = t('push.installFirst')
  else if (!supported) hint = t('push.unsupported')

  const can = !!session && supported && isStandalone()

  return (
    <div className="card">
      <div className="row">
        <span className="gap8 h2"><Icon n="bell" size="s" className="acc" />{t('push.title')}</span>
        <Switch on={on} onChange={(v) => !busy && can && toggle(v)} />
      </div>
      <div className="mut" style={{ fontSize: 12, marginTop: 6 }}>{on ? t('push.onHint') : hint}</div>
      {msg && <div className={msg.ok ? 'acc' : 'danger'} style={{ fontSize: 12, marginTop: 8 }}>{msg.text}</div>}
      {on && (
        <button
          className="btn ghost sm"
          style={{ width: '100%', marginTop: 12 }}
          disabled={busy}
          onClick={async () => {
            setMsg(null)
            try {
              const r = await testPush()
              setMsg({ ok: true, text: t('push.testSent', { n: r.sent }) })
            } catch (e) {
              setMsg({ ok: false, text: (e as Error).message })
            }
          }}
        >
          {t('push.test')}
        </button>
      )}
    </div>
  )
}
