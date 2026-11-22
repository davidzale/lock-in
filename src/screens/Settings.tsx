import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CURRENCIES, LANGS, useStore } from '../store'
import type { Block, Currency, Goal, Habit, Lang, Theme } from '../store'
import { useT } from '../i18n'
import { money } from '../lib/format'
import { Field, Header, IconBtn, Seg, Sheet } from '../components/ui'
import { Icon } from '../components/Icon'
import { GoalForm, HabitForm, unitLabel } from '../components/forms'
import { CloudCard } from '../components/CloudCard'
import { PushCard } from '../components/PushCard'

export default function Settings() {
  const t = useT()
  const nav = useNavigate()
  const s = useStore()
  const [habit, setHabit] = useState<Habit | 'new' | null>(null)
  const [goal, setGoal] = useState<Goal | 'new' | null>(null)
  const [targets, setTargets] = useState(false)
  const [bal, setBal] = useState(String(s.startBalance || ''))
  const fileRef = useRef<HTMLInputElement>(null)

  const exportData = () => {
    const { lang, theme, currencies, defaultCurrency, rates, startBalance, habits, logs, goals, txs, budgets, finGoals, recurring, workouts, growth, growthTargets, daily, weights } = useStore.getState()
    const blob = new Blob([JSON.stringify({ app: 'lockin', v: 1, data: { lang, theme, currencies, defaultCurrency, rates, startBalance, habits, logs, goals, txs, budgets, finGoals, recurring, workouts, growth, growthTargets, daily, weights } }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `lockin-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }
  const importData = async (f: File) => {
    try {
      const j = JSON.parse(await f.text())
      if (j?.app !== 'lockin' || !j.data) throw new Error('bad')
      if (confirm(t('settings.importConfirm'))) s.importData(j.data)
    } catch {
      alert(t('settings.importError'))
    }
  }

  return (
    <>
      <Header eyebrow="LOCK IN" title={t('settings.title')} actions={<IconBtn n="back" label="back" onClick={() => nav(-1)} />} />

      <div className="card">
        <Field label={t('settings.language')}>
          <Seg value={s.lang} onChange={(v: Lang) => s.setLang(v)} options={[{ v: 'en', label: 'English' }, { v: 'ru', label: 'Русский' }]} />
        </Field>
        <Field label={t('settings.theme')}>
          <Seg value={s.theme} onChange={(v: Theme) => s.set('theme', v)} options={(['dark', 'light', 'system'] as Theme[]).map((x) => ({ v: x, label: t(`theme.${x}`) }))} />
        </Field>
      </div>

      <CloudCard />
      <PushCard />

      <div className="card">
        <div className="h2" style={{ marginBottom: 12 }}>{t('settings.currencies')}</div>
        <Field label={t('settings.enabled')}>
          <div className="chips">
            {CURRENCIES.map((c) => {
              const on = s.currencies.includes(c)
              return (
                <button key={c} className={`chip ${on ? 'on' : ''}`} disabled={c === 'USD'} onClick={() => {
                  const next = on ? s.currencies.filter((x) => x !== c) : [...s.currencies, c]
                  s.set('currencies', CURRENCIES.filter((x) => next.includes(x)))
                  if (on && s.defaultCurrency === c) s.set('defaultCurrency', 'USD')
                }}>{c}</button>
              )
            })}
          </div>
        </Field>
        <Field label={t('settings.defaultExpense')}>
          <div className="chips">
            {s.currencies.map((c) => <button key={c} className={`chip ${c === s.defaultCurrency ? 'on' : ''}`} onClick={() => s.set('defaultCurrency', c as Currency)}>{c}</button>)}
          </div>
        </Field>
        <div className="mono mut" style={{ fontSize: 11 }}>
          1 USD = {s.rates.GEL.toFixed(3)} GEL · {s.rates.RUB.toFixed(2)} RUB
          {s.rates.updatedAt && ` · ${new Date(s.rates.updatedAt).toLocaleDateString()}`}
        </div>
        <div className="div" style={{ marginTop: 14, paddingTop: 14 }}>
          <Field label={t('settings.startBalance')}>
            <div className="gap8">
              <input className="input" inputMode="decimal" value={bal} onChange={(e) => setBal(e.target.value)} placeholder="$0" />
              <button className="btn ghost" onClick={() => s.set('startBalance', Number(bal.replace(',', '.')) || 0)}>{t('common.save')}</button>
            </div>
          </Field>
          <div className="mut" style={{ fontSize: 12, marginTop: -6 }}>{t('settings.startBalanceHint', { v: money(s.startBalance) })}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <span className="h2">{t('settings.habits')}</span>
          <button className="lbl acc" onClick={() => setHabit('new')}>+ {t('common.add')}</button>
        </div>
        {(['morning', 'day', 'evening'] as Block[]).map((b) => (
          <div key={b}>
            <div className="lbl" style={{ padding: '10px 0 2px' }}>{t(`block.${b}`)}</div>
            {s.habits.filter((h) => h.block === b).map((h) => (
              <button key={h.id} className="list-row" onClick={() => setHabit(h)}>
                <span className="grow">{h.name}</span>
                {h.reminder && <span className="tag"><Icon n="bell" size="xs" /> {h.reminder}</span>}
                {h.target != null && <span className={`tag ${h.prog ? 'acc' : ''}`}>{h.target} {unitLabel(t, h.unit)}{h.prog ? ' ↑' : ''}</span>}
                <Icon n="chev" size="s" className="mut" />
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <span className="h2">{t('today.goals')}</span>
          <button className="lbl acc" onClick={() => setGoal('new')}>+ {t('common.add')}</button>
        </div>
        {s.goals.map((g) => (
          <button key={g.id} className="list-row" onClick={() => setGoal(g)}>
            <span className="tag">{t(`period.${g.period}`)}</span>
            <span className="grow">{g.title}</span>
            <span className="num mut" style={{ fontSize: 12 }}>{g.kind === 'custom' ? g.target : money(g.target, 'USD', { compact: true })}</span>
            <Icon n="chev" size="s" className="mut" />
          </button>
        ))}
      </div>

      <button className="card list-row" style={{ border: '1px solid var(--line)' }} onClick={() => setTargets(true)}>
        <div className="ibox"><Icon n="compass" size="s" /></div>
        <span className="grow" style={{ fontWeight: 500 }}>{t('settings.growthTargets')}</span>
        <Icon n="chev" size="s" className="mut" />
      </button>

      <div className="card">
        <div className="h2" style={{ marginBottom: 6 }}>{t('settings.data')}</div>
        <div className="mut" style={{ fontSize: 12, marginBottom: 12 }}>{t('settings.dataHint')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 8 }}>
          <button className="btn ghost sm" onClick={exportData}><Icon n="download" size="s" />{t('settings.export')}</button>
          <button className="btn ghost sm" onClick={() => fileRef.current?.click()}><Icon n="upload" size="s" />{t('settings.import')}</button>
        </div>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
      </div>

      <div className="mono mut" style={{ textAlign: 'center', fontSize: 10, padding: '8px 0 20px' }}>LOCK IN · v0.5.2 · {t('settings.phase')}</div>

      <Sheet open={!!habit} onClose={() => setHabit(null)} title={habit === 'new' ? t('habit.new') : t('habit.edit')}>
        {habit && <HabitForm habit={habit === 'new' ? undefined : habit} onDone={() => setHabit(null)} />}
      </Sheet>
      <Sheet open={!!goal} onClose={() => setGoal(null)} title={goal === 'new' ? t('goal.new') : t('goal.edit')}>
        {goal && <GoalForm goal={goal === 'new' ? undefined : goal} onDone={() => setGoal(null)} />}
      </Sheet>
      <Sheet open={targets} onClose={() => setTargets(false)} title={t('settings.growthTargets')}>
        {targets && <TargetsForm onDone={() => setTargets(false)} />}
      </Sheet>
    </>
  )
}

function TargetsForm({ onDone }: { onDone: () => void }) {
  const t = useT()
  const { growthTargets, set } = useStore()
  const [speech, setSpeech] = useState(String(growthTargets.speech))
  const [lang, setLang] = useState<Record<string, string>>(Object.fromEntries(LANGS.map((l) => [l, String(growthTargets.lang[l] ?? 0)])))
  return (
    <>
      <Field label={t('settings.speechTarget')}>
        <input className="input" inputMode="numeric" value={speech} onChange={(e) => setSpeech(e.target.value)} />
      </Field>
      {LANGS.map((l) => (
        <Field key={l} label={`${t(`lang.${l}`)} · ${t('settings.minPerWeek')}`}>
          <input className="input" inputMode="numeric" value={lang[l]} onChange={(e) => setLang({ ...lang, [l]: e.target.value })} />
        </Field>
      ))}
      <button className="btn primary" style={{ width: '100%' }} onClick={() => {
        set('growthTargets', { speech: Math.max(1, Math.min(5, Number(speech) || 3)), lang: Object.fromEntries(LANGS.map((l) => [l, Math.max(0, Number(lang[l]) || 0)])) })
        onDone()
      }}>{t('common.save')}</button>
    </>
  )
}
