import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { useT } from '../i18n'
import { fmtDate, monthKey, periodRange } from '../lib/date'
import { Header, IconBtn } from '../components/ui'
import { Icon } from '../components/Icon'
import { Report } from '../components/Report'

export default function Summary() {
  const t = useT()
  const nav = useNavigate()
  const lang = useStore((s) => s.lang)
  const { month = monthKey() } = useParams()
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  const prev = new Date(y, m - 2, 1)
  const go = (delta: number) => nav(`/summary/${monthKey(new Date(y, m - 1 + delta, 1))}`, { replace: true })
  return (
    <>
      <Header
        eyebrow={t('summary.title')}
        title={fmtDate(d, lang, { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase())}
        actions={<IconBtn n="back" label="back" onClick={() => nav('/stats')} />}
      />
      <div className="row" style={{ marginBottom: 12 }}>
        <button className="btn ghost sm" onClick={() => go(-1)}><Icon n="back" size="s" />{fmtDate(prev, lang, { month: 'short' })}</button>
        <span className="mut" style={{ fontSize: 12, textAlign: 'center' }}>{t('summary.vs', { m: fmtDate(prev, lang, { month: 'long' }) })}</span>
        <button className="btn ghost sm" onClick={() => go(1)}>{fmtDate(new Date(y, m, 1), lang, { month: 'short' })}<Icon n="chev" size="s" /></button>
      </div>
      <Report range={periodRange('month', d)} prev={periodRange('month', prev)} />
    </>
  )
}
