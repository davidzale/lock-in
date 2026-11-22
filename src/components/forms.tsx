import { useState } from 'react'
import { useStore } from '../store'
import type { Block, Goal, GoalKind, Habit, Unit } from '../store'
import type { Period } from '../lib/date'
import { dayKey, uid } from '../lib/date'
import { useT } from '../i18n'
import { Field, Seg, Switch } from './ui'
import { askConfirm } from './Confirm'

const num = (s: string) => Number(s.replace(',', '.').replace(/\s/g, ''))

export function unitLabel(t: (k: string) => string, u?: Unit) {
  return u ? t(`unit.${u}`) : ''
}

export function HabitForm({ habit, onDone }: { habit?: Habit; onDone: () => void }) {
  const t = useT()
  const { upsertHabit, removeHabit } = useStore()
  const [name, setName] = useState(habit?.name || '')
  const [block, setBlock] = useState<Block>(habit?.block || 'morning')
  const [hasTarget, setHasTarget] = useState(habit?.target != null)
  const [target, setTarget] = useState(String(habit?.target ?? ''))
  const [unit, setUnit] = useState<Unit>(habit?.unit || 'min')
  const [reminder, setReminder] = useState(habit?.reminder || '')
  const [prog, setProg] = useState(!!habit?.prog)
  const [step, setStep] = useState(String(habit?.prog?.step ?? 5))
  const [every, setEvery] = useState(String(habit?.prog?.everyDays ?? 14))
  const [max, setMax] = useState(String(habit?.prog?.max ?? ''))

  const save = () => {
    const h: Habit = {
      id: habit?.id || uid(),
      createdAt: habit?.createdAt || dayKey(),
      lastProgAt: habit?.lastProgAt,
      seed: habit?.seed && habit.name === name.trim() ? habit.seed : undefined,
      name: name.trim(),
      block,
      target: hasTarget && num(target) > 0 ? num(target) : undefined,
      unit: hasTarget ? unit : undefined,
      reminder: reminder || undefined,
      prog: hasTarget && prog ? { step: num(step) || 1, everyDays: num(every) || 14, max: max ? num(max) : undefined } : undefined,
    }
    upsertHabit(h)
    onDone()
  }

  return (
    <>
      <Field label={t('habit.name')}>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus={!habit} />
      </Field>
      <Field label={t('habit.block')}>
        <Seg value={block} onChange={setBlock} options={(['morning', 'day', 'evening'] as Block[]).map((b) => ({ v: b, label: t(`block.${b}`) }))} />
      </Field>
      <div className="row" style={{ marginBottom: 14 }}>
        <span>{t('habit.hasTarget')}</span>
        <Switch on={hasTarget} onChange={setHasTarget} />
      </div>
      {hasTarget && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.3fr)', gap: 8 }}>
            <Field label={t('habit.target')}>
              <input className="input" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
            </Field>
            <Field label={t('habit.unit')}>
              <select className="input" value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
                {(['min', 'ml', 'pages', 'reps', 'steps'] as Unit[]).map((u) => (
                  <option key={u} value={u}>{t(`unit.${u}`)}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="row" style={{ marginBottom: 6 }}>
            <span>{t('habit.autoGrow')}</span>
            <Switch on={prog} onChange={setProg} />
          </div>
          <div className="mut" style={{ fontSize: 12, marginBottom: 12 }}>{t('habit.autoGrowHint')}</div>
          {prog && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: 8 }}>
              <Field label={t('habit.step')}><input className="input" inputMode="decimal" value={step} onChange={(e) => setStep(e.target.value)} /></Field>
              <Field label={t('habit.everyDays')}><input className="input" inputMode="numeric" value={every} onChange={(e) => setEvery(e.target.value)} /></Field>
              <Field label={t('habit.max')}><input className="input" inputMode="decimal" value={max} onChange={(e) => setMax(e.target.value)} /></Field>
            </div>
          )}
        </>
      )}
      <Field label={t('habit.reminder')}>
        <input className="input" type="time" value={reminder} onChange={(e) => setReminder(e.target.value)} />
      </Field>
      <div className="mut" style={{ fontSize: 12, marginTop: -8, marginBottom: 14 }}>{t('habit.reminderHint')}</div>
      <button className="btn primary" style={{ width: '100%' }} disabled={!name.trim()} onClick={save}>{t('common.save')}</button>
      {habit && (
        <button className="btn danger" style={{ width: '100%', marginTop: 8 }} onClick={async () => { if (await askConfirm(t('common.confirmDelete'))) { removeHabit(habit.id); onDone() } }}>
          {t('common.delete')}
        </button>
      )}
    </>
  )
}

export function GoalForm({ goal, onDone, defaultPeriod }: { goal?: Goal; onDone: () => void; defaultPeriod?: Period }) {
  const t = useT()
  const { upsertGoal, removeGoal } = useStore()
  const [period, setPeriod] = useState<Period>(goal?.period || defaultPeriod || 'month')
  const kind: GoalKind = 'custom'
  const [title, setTitle] = useState(goal?.title || '')
  const [target, setTarget] = useState(String(goal?.target ?? ''))
  return (
    <>
      <Field label={t('goal.period')}>
        <Seg value={period} onChange={setPeriod} options={(['week', 'month', 'year'] as Period[]).map((p) => ({ v: p, label: t(`period.${p}`) }))} />
      </Field>
      <Field label={t('goal.title')}>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('goal.titlePh')} />
      </Field>
      <Field label={t('goal.target')}>
        <input className="input" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
      </Field>
      <button
        className="btn primary"
        style={{ width: '100%' }}
        disabled={!title.trim() || !(num(target) > 0)}
        onClick={() => { upsertGoal({ ...goal, id: goal?.id || uid(), period, kind, title: title.trim(), target: num(target), seed: goal?.seed && goal.title === title.trim() ? goal.seed : undefined }); onDone() }}
      >
        {t('common.save')}
      </button>
      {goal && (
        <button className="btn danger" style={{ width: '100%', marginTop: 8 }} onClick={async () => { if (await askConfirm(t('common.confirmDelete'))) { removeGoal(goal.id); onDone() } }}>
          {t('common.delete')}
        </button>
      )}
    </>
  )
}
