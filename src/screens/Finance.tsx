import { useState } from 'react'
import { EXPENSE_CATS, useStore } from '../store'
import type { Currency, FinGoal, FinGoalType, Recurring } from '../store'
import { useT } from '../i18n'
import { fmtDate, monthKey, parseDay, periodRange, inRange, uid } from '../lib/date'
import { balance, totals } from '../lib/calc'
import { money } from '../lib/format'
import { Bar, Field, Header, IconBtn, Segs, Sheet } from '../components/ui'
import { Icon } from '../components/Icon'
import { TxForm } from '../components/QuickAdd'

const CAT_COLORS = ['var(--acc)', 'var(--data2)', '#8a8a93', 'var(--data3)']
const num = (s: string) => Number(s.replace(',', '.').replace(/\s/g, ''))
const CAT_ICON: Record<string, string> = { food: 'flame', housing: 'lock', transport: 'compass', entertainment: 'spark', health: 'activity', sport: 'dumbbell', subscriptions: 'repeat', shopping: 'wallet', travel: 'globe', other: 'target', fixed: 'up', variable: 'up' }

type SheetKind = { k: 'tx'; type: 'income' | 'expense' } | { k: 'budgets' } | { k: 'goal'; goal?: FinGoal } | { k: 'contrib'; goal: FinGoal } | { k: 'rec'; rec?: Recurring } | null

export default function Finance() {
  const t = useT()
  const s = useStore()
  const now = new Date()
  const range = periodRange('month', now)
  const m = totals(s.txs, range)
  const mk = monthKey(now)
  const [sheet, setSheet] = useState<SheetKind>(null)
  const close = () => setSheet(null)
  const cats = Object.entries(m.byCat).sort((a, b) => b[1] - a[1])
  const top = cats.slice(0, 3)
  const rest = cats.slice(3).reduce((a, [, v]) => a + v, 0)
  const parts = [...top, ...(rest > 0 ? [['other+', rest] as [string, number]] : [])]
  const monthTx = s.txs.filter((x) => inRange(x.date, range)).sort((a, b) => (a.date < b.date ? 1 : -1))
  const budgetCats = Object.keys(s.budgets).filter((c) => s.budgets[c] > 0)

  return (
    <>
      <Header
        eyebrow={fmtDate(now, s.lang, { month: 'long', year: 'numeric' })}
        title={t('tab.finance')}
        actions={
          <>
            <IconBtn n="up" label={t('quick.income')} onClick={() => setSheet({ k: 'tx', type: 'income' })} />
            <IconBtn n="plus" label={t('quick.expense')} onClick={() => setSheet({ k: 'tx', type: 'expense' })} />
          </>
        }
      />

      <div className="card">
        <div className="row">
          <span className="lbl">{t('fin.monthLeft')}</span>
          <span className="lbl">{t('fin.balance')} <span className="num" style={{ color: 'var(--text)' }}>{money(balance(s))}</span></span>
        </div>
        <div className="num" style={{ fontSize: 32, margin: '6px 0 12px' }}>{money(m.net, 'USD', { sign: true })}</div>
        <div className="stats">
          <div>
            <div className="lbl">{t('fin.fixed')}</div>
            <div className="num ellipsis">{money(m.fixed, 'USD', { compact: true })}</div>
          </div>
          <div>
            <div className="lbl">{t('fin.variable')}</div>
            <div className="num ellipsis">{money(m.variable, 'USD', { compact: true })}</div>
          </div>
          <div>
            <div className="lbl">{t('fin.expense')}</div>
            <div className="num ellipsis">{money(m.expense, 'USD', { compact: true })}</div>
          </div>
        </div>
        {m.expense > 0 && (
          <>
            <div className="bar" style={{ marginTop: 14 }}>
              {parts.map(([c, v], i) => <i key={c} style={{ width: `${(v / m.expense) * 100}%`, background: CAT_COLORS[i], borderRadius: 0 }} />)}
            </div>
            <div className="mono mut" style={{ display: 'flex', gap: 10, fontSize: 10, marginTop: 8, flexWrap: 'wrap', textTransform: 'uppercase' }}>
              {parts.map(([c, v], i) => (
                <span key={c}><span style={{ color: CAT_COLORS[i] }}>●</span> {c === 'other+' ? t('fin.rest') : t(`cat.${c}`)} {money(v, 'USD', { compact: true })}</span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <span className="h2">{t('fin.budgets')}</span>
          <button className="lbl acc" onClick={() => setSheet({ k: 'budgets' })}>{t('common.edit')}</button>
        </div>
        {budgetCats.length === 0 && <div className="empty">{t('fin.noBudgets')}</div>}
        {budgetCats.map((c) => {
          const spent = m.byCat[c] || 0
          const lim = s.budgets[c]
          const over = spent > lim
          return (
            <div key={c} style={{ padding: '8px 0' }}>
              <div className="row" style={{ marginBottom: 6, fontSize: 13 }}>
                <span>{t(`cat.${c}`)}</span>
                <span className="num" style={{ fontSize: 12 }}><span className={over ? 'danger' : ''}>{money(spent)}</span><span className="mut"> / {money(lim)}</span></span>
              </div>
              <Bar v={spent / lim} color={over ? 'var(--danger)' : 'var(--acc)'} />
            </div>
          )
        })}
      </div>

      <div className="card">
        <div className="card-head">
          <span className="h2">{t('fin.goals')}</span>
          <button className="lbl acc" onClick={() => setSheet({ k: 'goal' })}>+ {t('common.add')}</button>
        </div>
        {s.finGoals.map((g) => {
          const isDebt = g.type === 'debt'
          const v = g.target > 0 ? g.saved / g.target : 0
          return (
            <button key={g.id} className="list-row" style={{ display: 'block' }} onClick={() => setSheet({ k: 'contrib', goal: g })}>
              <div className="row" style={{ marginBottom: 10 }}>
                <span className="gap8" style={{ fontWeight: 600 }}><Icon n={isDebt ? 'lock' : g.type === 'purchase' ? 'wallet' : 'target'} size="s" className="acc" />{g.title}</span>
                <span className="num acc" style={{ fontSize: 12 }}>{isDebt && g.target === 0 ? '0' : `${Math.round(v * 100)}%`}</span>
              </div>
              <Segs v={v} />
              <div className="mono mut" style={{ fontSize: 11, marginTop: 8, textAlign: 'left' }}>
                {isDebt ? (g.target > 0 ? `${t('fin.debtLeft')} ${money(Math.max(0, g.target - g.saved))}` : t('fin.noDebt')) : `${money(g.saved)} / ${money(g.target)}`}
              </div>
            </button>
          )
        })}
      </div>

      <div className="card">
        <div className="card-head">
          <span className="h2">{t('fin.recurring')}</span>
          <button className="lbl acc" onClick={() => setSheet({ k: 'rec' })}>+ {t('common.add')}</button>
        </div>
        {s.recurring.length === 0 && <div className="empty">{t('fin.noRecurring')}</div>}
        {[...s.recurring].sort((a, b) => a.day - b.day).map((r) => {
          const paid = r.paid.includes(mk)
          return (
            <div key={r.id} className="list-row">
              <button className="ibox g" onClick={() => setSheet({ k: 'rec', rec: r })}><Icon n="repeat" size="s" /></button>
              <button className="grow" style={{ textAlign: 'left' }} onClick={() => setSheet({ k: 'rec', rec: r })}>
                <div>{r.title}</div>
                <div className="mono mut" style={{ fontSize: 11 }}>{t('fin.everyMonth', { d: r.day })} · {money(r.amount, r.currency)}</div>
              </button>
              {paid ? <span className="tag">{t('fin.paid')}</span> : <button className="btn primary sm" onClick={() => s.payRecurring(r.id, mk)}>{t('fin.pay')}</button>}
            </div>
          )
        })}
      </div>

      <div className="card">
        <div className="card-head"><span className="h2">{t('fin.transactions')}</span><span className="num mut" style={{ fontSize: 12 }}>{monthTx.length}</span></div>
        {monthTx.length === 0 && <div className="empty">{t('fin.noTx')}</div>}
        {monthTx.map((x) => (
          <div key={x.id} className="list-row">
            <div className={`ibox ${x.type === 'income' ? '' : 'g'}`}><Icon n={CAT_ICON[x.category] || 'wallet'} size="s" /></div>
            <div className="grow">
              <div className="ellipsis">{x.note || t(`cat.${x.category}`)}</div>
              <div className="mono mut" style={{ fontSize: 11, textTransform: 'uppercase' }}>
                {t(`cat.${x.category}`)} · {fmtDate(parseDay(x.date), s.lang, { day: '2-digit', month: '2-digit' })}
                {x.currency !== 'USD' && ` · ${money(x.amount, x.currency)}`}
              </div>
            </div>
            <span className={`num ${x.type === 'income' ? 'acc' : ''}`}>{x.type === 'income' ? '+' : '−'}{money(x.usd).replace('−', '')}</span>
            <button className="mut" aria-label={t('common.delete')} onClick={() => confirm(t('common.confirmDelete')) && s.removeTx(x.id)}><Icon n="x" size="xs" /></button>
          </div>
        ))}
      </div>

      <Sheet open={!!sheet} onClose={close} title={sheetTitle(sheet, t)}>
        {sheet?.k === 'tx' && <TxForm key={sheet.type} type={sheet.type} onDone={close} />}
        {sheet?.k === 'budgets' && <BudgetsForm onDone={close} />}
        {sheet?.k === 'goal' && <FinGoalForm goal={sheet.goal} onDone={close} />}
        {sheet?.k === 'contrib' && <ContribForm goal={sheet.goal} onDone={close} onEdit={() => setSheet({ k: 'goal', goal: sheet.goal })} />}
        {sheet?.k === 'rec' && <RecurringForm rec={sheet.rec} onDone={close} />}
      </Sheet>
    </>
  )
}

function sheetTitle(s: SheetKind, t: (k: string) => string) {
  if (!s) return ''
  if (s.k === 'tx') return s.type === 'income' ? t('quick.income') : t('quick.expense')
  if (s.k === 'budgets') return t('fin.budgets')
  if (s.k === 'goal') return s.goal ? t('goal.edit') : t('fin.newGoal')
  if (s.k === 'contrib') return s.goal.title
  return s.rec ? s.rec.title : t('fin.newRecurring')
}

function BudgetsForm({ onDone }: { onDone: () => void }) {
  const t = useT()
  const { budgets, set } = useStore()
  const [vals, setVals] = useState<Record<string, string>>(Object.fromEntries(EXPENSE_CATS.map((c) => [c, budgets[c] ? String(budgets[c]) : ''])))
  return (
    <>
      <div className="mut" style={{ fontSize: 12, marginBottom: 12 }}>{t('fin.budgetsHint')}</div>
      {EXPENSE_CATS.map((c) => (
        <div key={c} className="row" style={{ marginBottom: 8 }}>
          <span>{t(`cat.${c}`)}</span>
          <input className="input" style={{ width: 120, height: 40, textAlign: 'right' }} inputMode="decimal" placeholder="$ —" value={vals[c]} onChange={(e) => setVals({ ...vals, [c]: e.target.value })} />
        </div>
      ))}
      <button className="btn primary" style={{ width: '100%', marginTop: 8 }} onClick={() => {
        set('budgets', Object.fromEntries(Object.entries(vals).filter(([, v]) => num(v) > 0).map(([k, v]) => [k, num(v)])))
        onDone()
      }}>{t('common.save')}</button>
    </>
  )
}

function FinGoalForm({ goal, onDone }: { goal?: FinGoal; onDone: () => void }) {
  const t = useT()
  const { upsertFinGoal, removeFinGoal } = useStore()
  const [type, setType] = useState<FinGoalType>(goal?.type || 'savings')
  const [title, setTitle] = useState(goal?.title || '')
  const [target, setTarget] = useState(goal ? String(goal.target) : '')
  return (
    <>
      <Field label={t('goal.kind')}>
        <div className="chips">
          {(['savings', 'purchase', 'debt'] as FinGoalType[]).map((k) => (
            <button key={k} className={`chip ${k === type ? 'on' : ''}`} onClick={() => setType(k)}>{t(`fg.${k}`)}</button>
          ))}
        </div>
      </Field>
      <Field label={t('goal.title')}><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label={type === 'debt' ? t('fin.debtTotal') : t('goal.targetUsd')}><input className="input" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} /></Field>
      <button className="btn primary" style={{ width: '100%' }} disabled={!title.trim()} onClick={() => {
        upsertFinGoal({ id: goal?.id || uid(), saved: goal?.saved || 0, type, title: title.trim(), target: num(target) || 0, seed: goal?.seed && goal.title === title.trim() ? goal.seed : undefined })
        onDone()
      }}>{t('common.save')}</button>
      {goal && <button className="btn danger" style={{ width: '100%', marginTop: 8 }} onClick={() => { if (confirm(t('common.confirmDelete'))) { removeFinGoal(goal.id); onDone() } }}>{t('common.delete')}</button>}
    </>
  )
}

function ContribForm({ goal, onDone, onEdit }: { goal: FinGoal; onDone: () => void; onEdit: () => void }) {
  const t = useT()
  const upsertFinGoal = useStore((s) => s.upsertFinGoal)
  const [v, setV] = useState('')
  const n = num(v)
  return (
    <>
      <div className="row" style={{ marginBottom: 14 }}>
        <span className="mut">{goal.type === 'debt' ? t('fin.paidOff') : t('fin.saved')}</span>
        <span className="num">{money(goal.saved)} / {money(goal.target)}</span>
      </div>
      <Field label={goal.type === 'debt' ? t('fin.payDebt') : t('fin.addToGoal')}>
        <input className="input big" inputMode="decimal" placeholder="$0" value={v} onChange={(e) => setV(e.target.value)} autoFocus />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button className="btn ghost" disabled={!(n > 0)} onClick={() => { upsertFinGoal({ ...goal, saved: Math.max(0, goal.saved - n) }); onDone() }}>− {t('fin.withdraw')}</button>
        <button className="btn primary" disabled={!(n > 0)} onClick={() => { upsertFinGoal({ ...goal, saved: goal.saved + n }); onDone() }}>+ {t('common.add')}</button>
      </div>
      <button className="btn ghost" style={{ width: '100%', marginTop: 8 }} onClick={onEdit}>{t('goal.edit')}</button>
    </>
  )
}

function RecurringForm({ rec, onDone }: { rec?: Recurring; onDone: () => void }) {
  const t = useT()
  const { currencies, upsertRecurring, removeRecurring } = useStore()
  const [title, setTitle] = useState(rec?.title || '')
  const [amount, setAmount] = useState(rec ? String(rec.amount) : '')
  const [cur, setCur] = useState<Currency>(rec?.currency || 'USD')
  const [cat, setCat] = useState(rec?.category || 'subscriptions')
  const [day, setDay] = useState(String(rec?.day || 1))
  return (
    <>
      <Field label={t('goal.title')}><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Netflix" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 8 }}>
        <Field label={t('fin.amount')}><input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label={t('fin.dayOfMonth')}><input className="input" inputMode="numeric" value={day} onChange={(e) => setDay(e.target.value)} /></Field>
      </div>
      <div className="chips" style={{ marginBottom: 14 }}>
        {currencies.map((c) => <button key={c} className={`chip ${c === cur ? 'on' : ''}`} onClick={() => setCur(c)}>{c}</button>)}
      </div>
      <Field label={t('fin.category')}>
        <div className="chips">
          {EXPENSE_CATS.map((c) => <button key={c} className={`chip ${c === cat ? 'on' : ''}`} onClick={() => setCat(c)}>{t(`cat.${c}`)}</button>)}
        </div>
      </Field>
      <button className="btn primary" style={{ width: '100%' }} disabled={!title.trim() || !(num(amount) > 0)} onClick={() => {
        upsertRecurring({ id: rec?.id || uid(), paid: rec?.paid || [], title: title.trim(), amount: num(amount), currency: cur, category: cat, day: Math.min(31, Math.max(1, num(day) || 1)) })
        onDone()
      }}>{t('common.save')}</button>
      {rec && <button className="btn danger" style={{ width: '100%', marginTop: 8 }} onClick={() => { if (confirm(t('common.confirmDelete'))) { removeRecurring(rec.id); onDone() } }}>{t('common.delete')}</button>}
    </>
  )
}
