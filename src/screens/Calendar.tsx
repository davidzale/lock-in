import { useState } from 'react'
import { useStore } from '../store'
import { useT } from '../i18n'
import { addDays, dayKey, fmtDate, fmtWeekday, weekStart } from '../lib/date'
import { Header } from '../components/ui'
import { Icon } from '../components/Icon'

const START = 7, END = 23, ROW = 44

export default function Calendar() {
  const t = useT()
  const lang = useStore((s) => s.lang)
  const now = new Date()
  const [sel, setSel] = useState(dayKey(now))
  const [offset, setOffset] = useState(0)
  const ws = addDays(weekStart(now), offset * 7)
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i))
  const isToday = sel === dayKey(now)
  const nowY = ((now.getHours() + now.getMinutes() / 60) - START) * ROW

  return (
    <>
      <Header eyebrow={fmtDate(ws, lang, { month: 'long', year: 'numeric' })} title={t('tab.calendar')} />

      <div className="row" style={{ marginBottom: 8 }}>
        <button className="iconbtn" onClick={() => setOffset((o) => o - 1)} aria-label="prev"><Icon n="back" size="s" /></button>
        <button className="lbl" onClick={() => { setOffset(0); setSel(dayKey(now)) }}>{t('cal.today')}</button>
        <button className="iconbtn" onClick={() => setOffset((o) => o + 1)} aria-label="next"><Icon n="chev" size="s" /></button>
      </div>
      <div className="week">
        {days.map((d) => (
          <button key={dayKey(d)} className={`wd ${dayKey(d) === sel ? 'on' : ''}`} onClick={() => setSel(dayKey(d))}>
            {fmtWeekday(d, lang).slice(0, 2)}
            <b>{d.getDate()}</b>
          </button>
        ))}
      </div>

      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div className="ibox"><Icon n="cal" size="s" /></div>
        <div className="grow">
          <div style={{ fontWeight: 600 }}>{t('cal.connect')}</div>
          <div className="mut" style={{ fontSize: 12, marginTop: 2 }}>{t('cal.connectSoon')}</div>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 14px' }}>
        <div className="timeline" style={{ height: (END - START) * ROW }}>
          {Array.from({ length: END - START }, (_, i) => (
            <div key={i}>
              <div className="hr" style={{ top: i * ROW }}>{String(START + i).padStart(2, '0')}:00</div>
              <div className="gl" style={{ top: i * ROW + 7 }} />
            </div>
          ))}
          {isToday && nowY > 0 && nowY < (END - START) * ROW && <div className="nowl" style={{ top: nowY + 7 }} />}
        </div>
      </div>
    </>
  )
}
