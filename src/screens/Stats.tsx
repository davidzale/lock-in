import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { useT } from '../i18n'
import { fmtDate, monthKey, periodRange } from '../lib/date'
import type { Period } from '../lib/date'
import { Header, IconBtn, Seg } from '../components/ui'
import { Icon } from '../components/Icon'
import { Report } from '../components/Report'

export default function Stats() {
  const t = useT()
  const nav = useNavigate()
  const lang = useStore((s) => s.lang)
  const [p, setP] = useState<Period>('week')
  const now = new Date()
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return (
    <>
      <Header eyebrow={t('stats.eyebrow')} title={t('stats.title')} actions={<IconBtn n="back" label="back" onClick={() => nav(-1)} />} />
      <div style={{ marginBottom: 12 }}>
        <Seg value={p} onChange={setP} options={(['week', 'month', 'year'] as Period[]).map((x) => ({ v: x, label: t(`period.${x}`) }))} />
      </div>
      <button className="card list-row" style={{ border: '1px solid var(--line)' }} onClick={() => nav(`/summary/${monthKey(prevMonth)}`)}>
        <div className="ibox"><Icon n="chart" size="s" /></div>
        <div className="grow">
          <div style={{ fontWeight: 600 }}>{t('summary.title')}</div>
          <div className="mut" style={{ fontSize: 12, textTransform: 'capitalize' }}>{fmtDate(prevMonth, lang, { month: 'long', year: 'numeric' })}</div>
        </div>
        <Icon n="chev" size="s" className="mut" />
      </button>
      <Report range={periodRange(p, now)} />
    </>
  )
}
