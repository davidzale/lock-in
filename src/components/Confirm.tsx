import { create } from 'zustand'
import { useT } from '../i18n'
import { Icon } from './Icon'

type Req = { text: string; ok?: string; danger?: boolean; resolve: (v: boolean) => void }
const useConfirm = create<{ req: Req | null }>(() => ({ req: null }))

/** in-app replacement for window.confirm — `if (await askConfirm('Delete?')) …` */
export function askConfirm(text: string, opts: { ok?: string; danger?: boolean } = { danger: true }) {
  return new Promise<boolean>((resolve) => useConfirm.setState({ req: { text, ...opts, resolve } }))
}

export function ConfirmHost() {
  const t = useT()
  const req = useConfirm((s) => s.req)
  if (!req) return null
  const done = (v: boolean) => {
    req.resolve(v)
    useConfirm.setState({ req: null })
  }
  return (
    <>
      <div className="backdrop" style={{ zIndex: 60 }} onClick={() => done(false)} />
      <div className="confirm" role="alertdialog">
        <div className={`ibox ${req.danger ? 'warn' : ''}`} style={{ margin: '0 auto 12px' }}><Icon n={req.danger ? 'trash' : 'check'} size="s" /></div>
        <div style={{ fontSize: 15, fontWeight: 600, textAlign: 'center', lineHeight: 1.4 }}>{req.text}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 8, marginTop: 18 }}>
          <button className="btn ghost" onClick={() => done(false)}>{t('common.cancel')}</button>
          <button className={`btn ${req.danger ? 'danger-fill' : 'primary'}`} onClick={() => done(true)}>{req.ok || (req.danger ? t('common.delete') : 'OK')}</button>
        </div>
      </div>
    </>
  )
}
