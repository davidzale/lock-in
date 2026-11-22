import { useState } from 'react'
import { useStore } from '../store'
import type { Goal } from '../store'
import { useT } from '../i18n'
import { periodKey } from '../lib/date'
import type { Period } from '../lib/date'
import { goalValue } from '../lib/calc'
import { Bar, Field, Seg, Sheet } from './ui'
import { Icon } from './Icon'
import { GoalForm } from './forms'

/** personal (non-money) goals for the week / month / year */
export function GoalsCard() {
  const t = useT()
  const s = useStore()
  const [period, setPeriod] = useState<Period>('month')
  const [edit, setEdit] = useState<Goal | 'new' | null>(null)
  const [prog, setProg] = useState<Goal | null>(null)
  const list = s.goals.filter((g) => g.period === period)
  return (
    <div className="card">
      <div className="card-head">
        <span className="gap8 h2"><Icon n="target" size="s" className="acc" />{t('today.goals')}</span>
        <button className="lbl acc" onClick={() => setEdit('new')}>+ {t('common.add')}</button>
      </div>
      <Seg value={period} onChange={setPeriod} options={(['week', 'month', 'year'] as Period[]).map((p) => ({ v: p, label: t(`period.${p}`) }))} />
      <div style={{ marginTop: 6 }}>
        {list.map((g) => {
          const v = goalValue(s, g)
          return (
            <button key={g.id} className="list-row" style={{ display: 'block' }} onClick={() => setProg(g)}>
              <div className="row" style={{ marginBottom: 8 }}>
                <span style={{ fontWeight: 500 }}>{g.title}</span>
                <span className="num" style={{ fontSize: 12 }}><span className={v >= g.target ? 'acc' : ''}>{v}</span><span className="mut"> / {g.target}</span></span>
              </div>
              <Bar v={v / g.target} />
            </button>
          )
        })}
        {!list.length && <div className="empty">{t('goal.emptyHint')}</div>}
      </div>
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit === 'new' ? t('goal.new') : t('goal.edit')}>
        {edit && <GoalForm goal={edit === 'new' ? undefined : edit} defaultPeriod={period} onDone={() => setEdit(null)} />}
      </Sheet>
      <Sheet open={!!prog} onClose={() => setProg(null)} title={prog?.title}>
        {prog && <Progress goal={prog} onDone={() => setProg(null)} onEdit={() => { setEdit(prog); setProg(null) }} />}
      </Sheet>
    </div>
  )
}

function Progress({ goal, onDone, onEdit }: { goal: Goal; onDone: () => void; onEdit: () => void }) {
  const t = useT()
  const setGoalProgress = useStore((s) => s.setGoalProgress)
  const pk = periodKey(goal.period)
  const [v, setV] = useState(String(goal.progress?.[pk] || 0))
  const n = Number(v) || 0
  return (
    <>
      <Field label={`${t('goal.progress')} / ${goal.target}`}>
        <div className="gap8">
          <button className="btn ghost" onClick={() => setV(String(Math.max(0, n - 1)))}><Icon n="minus" size="s" /></button>
          <input className="input big" style={{ textAlign: 'center' }} inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} />
          <button className="btn ghost" onClick={() => setV(String(n + 1))}><Icon n="plus" size="s" /></button>
        </div>
      </Field>
      <button className="btn primary" style={{ width: '100%' }} onClick={() => { setGoalProgress(goal.id, pk, n); onDone() }}>{t('common.save')}</button>
      <button className="btn ghost" style={{ width: '100%', marginTop: 8 }} onClick={onEdit}>{t('goal.edit')}</button>
    </>
  )
}
