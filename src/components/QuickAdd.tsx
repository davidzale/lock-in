import { useState } from 'react'
import { create } from 'zustand'
import { useNavigate } from 'react-router-dom'
import { EXPENSE_CATS, useStore } from '../store'
import type { Currency, TxType, WorkoutType } from '../store'
import { useT } from '../i18n'
import { dayKey } from '../lib/date'
import { sym } from '../lib/format'
import { Field, Sheet } from './ui'
import { Icon } from './Icon'

export type QuickKind = 'menu' | 'expense' | 'income' | 'workout' | 'metrics'
export const useQuick = create<{ kind: QuickKind | null; open: (k: QuickKind) => void; close: () => void }>((set) => ({
  kind: null,
  open: (kind) => set({ kind }),
  close: () => set({ kind: null }),
}))

const num = (s: string) => Number(s.replace(',', '.').replace(/\s/g, ''))

export function TxForm({ type, onDone }: { type: TxType; onDone: () => void }) {
  const t = useT()
  const { currencies, defaultCurrency, addTx } = useStore()
  const [amount, setAmount] = useState('')
  const [cur, setCur] = useState<Currency>(type === 'income' ? 'USD' : defaultCurrency)
  const [cat, setCat] = useState<string>(type === 'income' ? 'fixed' : 'food')
  const [date, setDate] = useState(dayKey())
  const [note, setNote] = useState('')
  const v = num(amount)
  const ok = v > 0
  return (
    <>
      <Field label={t('fin.amount')}>
        <div style={{ position: 'relative' }}>
          <input className="input big" inputMode="decimal" autoFocus placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <span className="num mut" style={{ position: 'absolute', right: 16, top: 16, fontSize: 22 }}>{sym(cur)}</span>
        </div>
      </Field>
      <div className="chips" style={{ marginBottom: 14 }}>
        {currencies.map((c) => (
          <button key={c} className={`chip ${c === cur ? 'on' : ''}`} onClick={() => setCur(c)}>{c}</button>
        ))}
      </div>
      <Field label={type === 'income' ? t('fin.incomeType') : t('fin.category')}>
        <div className="chips">
          {(type === 'income' ? ['fixed', 'variable'] : [...EXPENSE_CATS]).map((c) => (
            <button key={c} className={`chip ${c === cat ? 'on' : ''}`} onClick={() => setCat(c)}>{t(`cat.${c}`)}</button>
          ))}
        </div>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 8 }}>
        <Field label={t('common.date')}>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={t('common.note')}>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('common.optional')} />
        </Field>
      </div>
      <button
        className="btn primary"
        style={{ width: '100%' }}
        disabled={!ok}
        onClick={() => {
          addTx({ type, amount: v, currency: cur, category: cat, note: note.trim() || undefined, date })
          onDone()
        }}
      >
        {t('common.save')}
      </button>
    </>
  )
}

export function WorkoutForm({ onDone }: { onDone: () => void }) {
  const t = useT()
  const addWorkout = useStore((s) => s.addWorkout)
  const [type, setType] = useState<WorkoutType>('strength')
  const [min, setMin] = useState('60')
  const [date, setDate] = useState(dayKey())
  const v = num(min)
  return (
    <>
      <Field label={t('sport.type')}>
        <div className="chips">
          {(['strength', 'yoga', 'stretch', 'walk', 'other'] as WorkoutType[]).map((x) => (
            <button key={x} className={`chip ${x === type ? 'on' : ''}`} onClick={() => setType(x)}>{t(`wt.${x}`)}</button>
          ))}
        </div>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label={t('sport.minutes')}>
          <input className="input" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} />
        </Field>
        <Field label={t('common.date')}>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <button className="btn primary" style={{ width: '100%' }} disabled={!(v > 0)} onClick={() => { addWorkout({ type, minutes: v, date }); onDone() }}>
        {t('common.save')}
      </button>
    </>
  )
}

export function MetricsForm({ onDone }: { onDone: () => void }) {
  const t = useT()
  const { daily, setDaily } = useStore()
  const [date, setDate] = useState(dayKey())
  const m = daily[date] || {}
  const [sleep, setSleep] = useState(m.sleep != null ? String(m.sleep) : '')
  const [steps, setSteps] = useState(m.steps != null ? String(m.steps) : '')
  return (
    <>
      <Field label={t('common.date')}>
        <input className="input" type="date" value={date} onChange={(e) => {
          setDate(e.target.value)
          const x = daily[e.target.value] || {}
          setSleep(x.sleep != null ? String(x.sleep) : '')
          setSteps(x.steps != null ? String(x.steps) : '')
        }} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label={t('sport.sleepH')}>
          <input className="input" inputMode="decimal" placeholder="7.5" value={sleep} onChange={(e) => setSleep(e.target.value)} />
        </Field>
        <Field label={t('sport.steps')}>
          <input className="input" inputMode="numeric" placeholder="8000" value={steps} onChange={(e) => setSteps(e.target.value)} />
        </Field>
      </div>
      <button className="btn primary" style={{ width: '100%' }} onClick={() => {
        setDaily(date, { sleep: sleep ? num(sleep) : undefined, steps: steps ? num(steps) : undefined })
        onDone()
      }}>
        {t('common.save')}
      </button>
    </>
  )
}

export function QuickAdd() {
  const t = useT()
  const nav = useNavigate()
  const { kind, open, close } = useQuick()
  const items: { k: QuickKind | 'growth'; icon: string; label: string }[] = [
    { k: 'expense', icon: 'down', label: t('quick.expense') },
    { k: 'income', icon: 'up', label: t('quick.income') },
    { k: 'workout', icon: 'dumbbell', label: t('quick.workout') },
    { k: 'metrics', icon: 'bed', label: t('quick.metrics') },
    { k: 'growth', icon: 'spark', label: t('quick.growth') },
  ]
  const titles: Record<QuickKind, string> = {
    menu: t('quick.title'),
    expense: t('quick.expense'),
    income: t('quick.income'),
    workout: t('quick.workout'),
    metrics: t('quick.metrics'),
  }
  return (
    <Sheet open={!!kind} onClose={close} title={kind ? titles[kind] : ''}>
      {kind === 'menu' && (
        <div>
          {items.map((x) => (
            <button key={x.k} className="list-row" onClick={() => {
              if (x.k === 'growth') { close(); nav('/growth') } else open(x.k)
            }}>
              <div className="ibox"><Icon n={x.icon} size="s" /></div>
              <span className="grow" style={{ fontSize: 15, fontWeight: 500 }}>{x.label}</span>
              <Icon n="chev" size="s" className="mut" />
            </button>
          ))}
        </div>
      )}
      {(kind === 'expense' || kind === 'income') && <TxForm key={kind} type={kind} onDone={close} />}
      {kind === 'workout' && <WorkoutForm onDone={close} />}
      {kind === 'metrics' && <MetricsForm onDone={close} />}
    </Sheet>
  )
}
