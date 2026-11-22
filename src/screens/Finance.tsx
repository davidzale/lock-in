import { useState } from 'react'
import { EXPENSE_CATS, useStore } from '../store'
import type { Currency, FinGoal, FinGoalType, Recurring, Tx } from '../store'
import { useT } from '../i18n'
import { dayKey, fmtDate, inRange, monthKey, parseDay, uid } from '../lib/date'
import { balance, totals } from '../lib/calc'
import { budgetsFor, monthTarget, recurringActive, recurringAmount, yearTarget } from '../lib/finance'
import { money } from '../lib/format'
import { Bar, Field, IconBtn, Seg, Segs, Sheet } from '../components/ui'
import { Icon } from '../components/Icon'
import { TxForm } from '../components/QuickAdd'
import { CategoryRing } from '../components/Donut'

const num = (s: string) => Number(s.replace(',', '.').replace(/\s/g, ''))
const CAT_ICON: Record<string, string> = { food: 'flame', housing: 'lock', transport: 'compass', entertainment: 'spark', health: 'activity', sport: 'dumbbell', subscriptions: 'repeat', shopping: 'wallet', travel: 'globe', other: 'target', fixed: 'up', variable: 'up' }
const cap = (x: string) => x.replace(/^./, (c) => c.toUpperCase())
const monthRange = (y: number, m: number): [Date, Date] => [new Date(y, m, 1), new Date(y, m + 1, 1)]

type SheetKind =
  | { k: 'tx'; type: 'income' | 'expense'; tx?: Tx }
  | { k: 'budgets' }
  | { k: 'target'; scope: 'month' | 'year' }
  | { k: 'goal'; goal?: FinGoal }
  | { k: 'contrib'; goal: FinGoal }
  | { k: 'rec'; rec?: Recurring }
  | { k: 'pay'; rec: Recurring }
  | null

export default function Finance() {
  const t = useT()
  const s = useStore()
  const lang = s.lang
  const now = new Date()
  const [mode, setMode] = useState<'month' | 'year'>('month')
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [sheet, setSheet] = useState<SheetKind>(null)
  const close = () => setSheet(null)
  const shift = (d: number) => {
    if (mode === 'year') return setCursor((c) => ({ ...c, y: c.y + d }))
    setCursor((c) => {
      const x = new Date(c.y, c.m + d, 1)
      return { y: x.getFullYear(), m: x.getMonth() }
    })
  }
  const mDate = new Date(cursor.y, cursor.m, 1)
  const mk = monthKey(mDate)
  const label = mode === 'month' ? cap(fmtDate(mDate, lang, { month: 'long', year: 'numeric' })) : String(cursor.y)
  const isNow = mode === 'month' ? mk === monthKey(now) : cursor.y === now.getFullYear()

  return (
    <>
      <div className="head">
        <div className="h">{t('tab.finance')}</div>
        <div className="gap8">
          <IconBtn n="up" label={t('quick.income')} onClick={() => setSheet({ k: 'tx', type: 'income' })} />
          <IconBtn n="down" label={t('quick.expense')} onClick={() => setSheet({ k: 'tx', type: 'expense' })} />
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <Seg value={mode} onChange={setMode} options={[{ v: 'month', label: t('period.month') }, { v: 'year', label: t('period.year') }]} />
      </div>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className="iconbtn" onClick={() => shift(-1)} aria-label="prev"><Icon n="back" size="s" /></button>
        <button className="h2" onClick={() => setCursor({ y: now.getFullYear(), m: now.getMonth() })}>{label}{!isNow && <span className="lbl acc" style={{ marginLeft: 8 }}>{t('cal.today')}</span>}</button>
        <button className="iconbtn" onClick={() => shift(1)} aria-label="next"><Icon n="chev" size="s" /></button>
      </div>

      {mode === 'month' ? (
        <MonthView y={cursor.y} m={cursor.m} mk={mk} setSheet={setSheet} />
      ) : (
        <YearView y={cursor.y} setSheet={setSheet} openMonth={(m) => { setCursor({ y: cursor.y, m }); setMode('month') }} />
      )}

      <Sheet open={!!sheet} onClose={close} title={sheetTitle(sheet, t)}>
        {sheet?.k === 'tx' && <TxForm key={sheet.tx?.id || sheet.type} type={sheet.type} tx={sheet.tx} defaultDate={mk === monthKey(now) ? dayKey() : `${mk}-01`} onDone={close} />}
        {sheet?.k === 'budgets' && <BudgetsForm mk={mk} onDone={close} />}
        {sheet?.k === 'target' && <TargetForm scope={sheet.scope} mk={mk} y={String(cursor.y)} onDone={close} />}
        {sheet?.k === 'goal' && <FinGoalForm goal={sheet.goal} onDone={close} />}
        {sheet?.k === 'contrib' && <ContribForm goal={sheet.goal} onDone={close} onEdit={() => setSheet({ k: 'goal', goal: sheet.goal })} />}
        {sheet?.k === 'rec' && <RecurringForm rec={sheet.rec} mk={mk} onDone={close} />}
        {sheet?.k === 'pay' && <PayConfirm rec={sheet.rec} mk={mk} onDone={close} />}
      </Sheet>
    </>
  )
}

function sheetTitle(s: SheetKind, t: (k: string) => string) {
  if (!s) return ''
  if (s.k === 'tx') return s.tx ? t('fin.editTx') : s.type === 'income' ? t('quick.income') : t('quick.expense')
  if (s.k === 'budgets') return t('fin.budgets')
  if (s.k === 'target') return s.scope === 'month' ? t('fin.monthGoal') : t('fin.yearGoal')
  if (s.k === 'goal') return s.goal ? t('goal.edit') : t('fin.newGoal')
  if (s.k === 'contrib') return s.goal.title
  if (s.k === 'pay') return t('fin.payQ')
  return s.rec ? s.rec.title : t('fin.newRecurring')
}

type SetSheet = (s: SheetKind) => void

// ---------------------------------------------------------------- month
function MonthView({ y, m, mk, setSheet }: { y: number; m: number; mk: string; setSheet: SetSheet }) {
  const t = useT()
  const s = useStore()
  const lang = s.lang
  const range = monthRange(y, m)
  const tot = totals(s.txs, range)
  const target = monthTarget(s, mk)
  const budgets = budgetsFor(s, mk)
  const budgetCats = Object.keys(budgets).filter((c) => budgets[c] > 0)
  const txs = s.txs.filter((x) => inRange(x.date, range)).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  const days = [...new Set(txs.map((x) => x.date))]
  const recs = s.recurring.filter((r) => recurringActive(r, mk)).sort((a, b) => a.day - b.day)
  const recDue = recs.filter((r) => !r.paid.includes(mk)).reduce((a, r) => a + recurringAmount(r, mk) / (r.currency === 'USD' ? 1 : s.rates[r.currency] || 1), 0)

  return (
    <>
      <div className="card">
        <div className="lbl">{t('fin.monthLeft')}</div>
        <div className="num" style={{ fontSize: 32, margin: '6px 0 12px' }}>{money(tot.net, 'USD', { sign: true })}</div>
        <div className="stats">
          <div><div className="lbl">{t('fin.fixed')}</div><div className="num ellipsis">{money(tot.fixed, 'USD', { compact: true })}</div></div>
          <div><div className="lbl">{t('fin.variable')}</div><div className="num ellipsis">{money(tot.variable, 'USD', { compact: true })}</div></div>
          <div><div className="lbl">{t('fin.expense')}</div><div className="num ellipsis">{money(tot.expense, 'USD', { compact: true })}</div></div>
        </div>
      </div>

      <CategoryRing range={range} />

      <button className="card list-row" style={{ display: 'block' }} onClick={() => setSheet({ k: 'target', scope: 'month' })}>
        <div className="row" style={{ marginBottom: 8 }}>
          <span className="gap8" style={{ fontWeight: 600 }}><Icon n="target" size="s" className="acc" />{t('fin.monthGoal')}</span>
          <span className="num" style={{ fontSize: 13, whiteSpace: 'nowrap' }}><span className={tot.income >= target ? 'acc' : ''}>{money(tot.income)}</span><span className="mut"> / {money(target)}</span></span>
        </div>
        <Bar v={tot.income / target} />
      </button>

      <div className="card">
        <div className="card-head"><span className="h2">{t('fin.budgets')}</span><button className="lbl acc" onClick={() => setSheet({ k: 'budgets' })}>{t('common.edit')}</button></div>
        {budgetCats.length === 0 && <div className="empty">{t('fin.noBudgets')}</div>}
        {budgetCats.map((c) => {
          const spent = tot.byCat[c] || 0
          const lim = budgets[c]
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
          <span className="h2">{t('fin.recurring')}</span>
          <button className="lbl acc" onClick={() => setSheet({ k: 'rec' })}>+ {t('common.add')}</button>
        </div>
        {recs.length === 0 && <div className="empty">{t('fin.noRecurring')}</div>}
        {recs.length > 0 && recDue > 0 && <div className="mut" style={{ fontSize: 12, marginBottom: 4 }}>{t('fin.dueLeft')} <span className="num" style={{ color: 'var(--text)' }}>{money(recDue)}</span></div>}
        {recs.map((r) => {
          const paid = r.paid.includes(mk)
          return (
            <div key={r.id} className="list-row">
              <button className="ibox g" onClick={() => setSheet({ k: 'rec', rec: r })}><Icon n="repeat" size="s" /></button>
              <button className="grow" style={{ textAlign: 'left' }} onClick={() => setSheet({ k: 'rec', rec: r })}>
                <div>{r.title}</div>
                <div className="mono mut" style={{ fontSize: 11 }}>{t('fin.everyMonth', { d: r.day })} · {money(recurringAmount(r, mk), r.currency)}</div>
              </button>
              {paid ? <span className="tag acc">✓ {t('fin.paid')}</span> : <button className="btn primary sm" onClick={() => setSheet({ k: 'pay', rec: r })}>{t('fin.pay')}</button>}
            </div>
          )
        })}
      </div>

      <div className="card">
        <div className="card-head"><span className="h2">{t('fin.transactions')}</span><span className="num mut" style={{ fontSize: 12 }}>{txs.length}</span></div>
        {txs.length === 0 && <div className="empty">{t('fin.noTx')}</div>}
        {days.map((d) => (
          <div key={d}>
            <div className="lbl" style={{ padding: '10px 0 2px' }}>{fmtDate(parseDay(d), lang, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
            {txs.filter((x) => x.date === d).map((x) => (
              <button key={x.id} className="list-row" onClick={() => setSheet({ k: 'tx', type: x.type, tx: x })}>
                <div className={`ibox ${x.type === 'income' ? '' : 'g'}`}><Icon n={CAT_ICON[x.category] || 'wallet'} size="s" /></div>
                <div className="grow" style={{ textAlign: 'left' }}>
                  <div className="ellipsis">{x.note || t(`cat.${x.category}`)}</div>
                  <div className="mono mut" style={{ fontSize: 11, textTransform: 'uppercase' }}>{t(`cat.${x.category}`)}{x.currency !== 'USD' && ` · ${money(x.amount, x.currency)}`}</div>
                </div>
                <span className={`num ${x.type === 'income' ? 'acc' : ''}`}>{x.type === 'income' ? '+' : '−'}{money(x.usd).replace('−', '')}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

// ---------------------------------------------------------------- year
function YearView({ y, setSheet, openMonth }: { y: number; setSheet: SetSheet; openMonth: (m: number) => void }) {
  const t = useT()
  const s = useStore()
  const lang = s.lang
  const now = new Date()
  const year = totals(s.txs, [new Date(y, 0, 1), new Date(y + 1, 0, 1)])
  const months = Array.from({ length: 12 }, (_, m) => ({ m, ...totals(s.txs, monthRange(y, m)) }))
  const target = yearTarget(s, String(y))
  const monthsGone = y < now.getFullYear() ? 12 : y > now.getFullYear() ? 0 : now.getMonth() + 1
  const active = months.filter((x) => x.income || x.expense).length || 1
  const left = Math.max(0, target - year.income)
  const monthsLeft = 12 - monthsGone + (y === now.getFullYear() ? 1 : 0)
  const need = monthsLeft > 0 ? left / monthsLeft : 0
  const rate = year.income > 0 ? Math.max(0, year.net) / year.income : 0
  const maxV = Math.max(1, ...months.map((x) => Math.max(x.income, x.expense)))

  return (
    <>
      <div className="card">
        <div className="lbl">{t('fin.yearSaved')}</div>
        <div className="num" style={{ fontSize: 32, margin: '6px 0 12px' }}>{money(year.net, 'USD', { sign: true })}</div>
        <div className="stats">
          <div><div className="lbl">{t('fin.earned')}</div><div className="num ellipsis">{money(year.income, 'USD', { compact: true })}</div></div>
          <div><div className="lbl">{t('fin.spent')}</div><div className="num ellipsis">{money(year.expense, 'USD', { compact: true })}</div></div>
          <div><div className="lbl">{t('fin.saveRate')}</div><div className="num">{Math.round(rate * 100)}%</div></div>
        </div>
        <div className="stats div" style={{ marginTop: 12, paddingTop: 12, gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}>
          <div><div className="lbl">{t('fin.avgIncome')}</div><div className="num">{money(year.income / active, 'USD', { compact: true })}</div></div>
          <div><div className="lbl">{t('fin.balance')}</div><div className="num">{money(balance(s))}</div></div>
        </div>
      </div>

      <button className="card list-row" style={{ display: 'block' }} onClick={() => setSheet({ k: 'target', scope: 'year' })}>
        <div className="row" style={{ marginBottom: 8 }}>
          <span className="gap8" style={{ fontWeight: 600 }}><Icon n="target" size="s" className="acc" />{t('fin.yearGoal')}</span>
          <span className="num" style={{ fontSize: 13, whiteSpace: 'nowrap' }}><span className={year.income >= target ? 'acc' : ''}>{money(year.income, 'USD', { compact: true })}</span><span className="mut"> / {money(target, 'USD', { compact: true })}</span></span>
        </div>
        <Segs v={year.income / target} />
        {left > 0 && monthsLeft > 0 && <div className="mono mut" style={{ fontSize: 11, marginTop: 8, textAlign: 'left' }}>{t('fin.needPerMonth', { v: money(need, 'USD', { compact: true }) })}</div>}
      </button>

      <CategoryRing range={[new Date(y, 0, 1), new Date(y + 1, 0, 1)]} />

      <div className="card">
        <div className="card-head">
          <span className="h2">{t('fin.goals')}</span>
          <button className="lbl acc" onClick={() => setSheet({ k: 'goal' })}>+ {t('common.add')}</button>
        </div>
        {s.finGoals.map((g) => {
          const isDebt = g.type === 'debt'
          const v = g.target > 0 ? g.saved / g.target : 0
          let plan = ''
          if (g.deadline && g.target > g.saved) {
            const [dy, dm] = g.deadline.split('-').map(Number)
            const n = (dy - now.getFullYear()) * 12 + (dm - 1 - now.getMonth()) + 1
            if (n > 0) plan = t('fin.perMonthTill', { v: money((g.target - g.saved) / n, 'USD', { compact: true }), d: fmtDate(new Date(dy, dm - 1, 1), lang, { month: 'short', year: 'numeric' }) })
          }
          return (
            <button key={g.id} className="list-row" style={{ display: 'block' }} onClick={() => setSheet({ k: 'contrib', goal: g })}>
              <div className="row" style={{ marginBottom: 10 }}>
                <span className="gap8" style={{ fontWeight: 600 }}><Icon n={isDebt ? 'lock' : g.type === 'purchase' ? 'wallet' : 'target'} size="s" className="acc" />{g.title}</span>
                <span className="num acc" style={{ fontSize: 12 }}>{isDebt && g.target === 0 ? '0' : `${Math.round(v * 100)}%`}</span>
              </div>
              <Segs v={v} />
              <div className="mono mut" style={{ fontSize: 11, marginTop: 8, textAlign: 'left' }}>
                {isDebt ? (g.target > 0 ? `${t('fin.debtLeft')} ${money(Math.max(0, g.target - g.saved))}` : t('fin.noDebt')) : `${money(g.saved)} / ${money(g.target)}`}
                {plan && ` · ${plan}`}
              </div>
            </button>
          )
        })}
      </div>

      <div className="card">
        <div className="card-head"><span className="h2">{t('fin.byMonth')}</span><span className="lbl"><span className="acc">●</span> {t('fin.income')} <span style={{ color: 'var(--data3)' }}>●</span> {t('fin.expense')}</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0,1fr))', alignItems: 'end', gap: 3, height: 90, marginBottom: 4 }}>
          {months.map((x) => (
            <button key={x.m} onClick={() => openMonth(x.m)} style={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: '100%', justifyContent: 'center' }}>
              <i style={{ display: 'block', width: '45%', height: `${(x.income / maxV) * 100}%`, minHeight: 2, background: 'var(--acc)', borderRadius: 2, transition: 'height .5s var(--ease)' }} />
              <i style={{ display: 'block', width: '45%', height: `${(x.expense / maxV) * 100}%`, minHeight: 2, background: 'var(--data3)', borderRadius: 2, transition: 'height .5s var(--ease)' }} />
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0,1fr))', textAlign: 'center' }} className="mono mut">
          {months.map((x) => <span key={x.m} style={{ fontSize: 9 }}>{fmtDate(new Date(y, x.m, 1), lang, { month: 'narrow' })}</span>)}
        </div>
        <div style={{ marginTop: 10 }}>
          {months.filter((x) => x.income || x.expense).map((x) => (
            <button key={x.m} className="list-row" onClick={() => openMonth(x.m)} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto auto', gap: 10 }}>
              <span style={{ textAlign: 'left' }}>{cap(fmtDate(new Date(y, x.m, 1), lang, { month: 'long' }))}</span>
              <span className="num acc" style={{ fontSize: 12 }}>+{money(x.income, 'USD', { compact: true })}</span>
              <span className="num mut" style={{ fontSize: 12 }}>−{money(x.expense, 'USD', { compact: true }).replace('−', '')}</span>
              <span className="num" style={{ fontSize: 12, minWidth: 56, textAlign: 'right' }}>{money(x.net, 'USD', { sign: true, compact: true })}</span>
            </button>
          ))}
          {!months.some((x) => x.income || x.expense) && <div className="empty">{t('fin.noTx')}</div>}
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------- forms
function TargetForm({ scope, mk, y, onDone }: { scope: 'month' | 'year'; mk: string; y: string; onDone: () => void }) {
  const t = useT()
  const s = useStore()
  const cur = scope === 'month' ? monthTarget(s, mk) : yearTarget(s, y)
  const [v, setV] = useState(String(cur))
  return (
    <>
      <div className="mut" style={{ fontSize: 12, marginBottom: 12 }}>{scope === 'month' ? t('fin.monthGoalHint') : t('fin.yearGoalHint')}</div>
      <Field label={t('goal.targetUsd')}><input className="input big" inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} /></Field>
      <button className="btn primary" style={{ width: '100%' }} disabled={!(num(v) > 0)} onClick={() => {
        const fp = s.finPlan
        if (scope === 'month') s.set('finPlan', { ...fp, monthOverrides: { ...fp.monthOverrides, [mk]: num(v) } })
        else s.set('finPlan', { ...fp, yearOverrides: { ...fp.yearOverrides, [y]: num(v) } })
        onDone()
      }}>{t('common.save')}</button>
    </>
  )
}

function BudgetsForm({ mk, onDone }: { mk: string; onDone: () => void }) {
  const t = useT()
  const s = useStore()
  const cur = budgetsFor(s, mk)
  const [vals, setVals] = useState<Record<string, string>>(Object.fromEntries(EXPENSE_CATS.map((c) => [c, cur[c] ? String(cur[c]) : ''])))
  return (
    <>
      <div className="mut" style={{ fontSize: 12, marginBottom: 12 }}>{t('fin.budgetsHint2')}</div>
      {EXPENSE_CATS.map((c) => (
        <div key={c} className="row" style={{ marginBottom: 8 }}>
          <span>{t(`cat.${c}`)}</span>
          <input className="input" style={{ width: 120, height: 40, textAlign: 'right' }} inputMode="decimal" placeholder="$ —" value={vals[c]} onChange={(e) => setVals({ ...vals, [c]: e.target.value })} />
        </div>
      ))}
      <button className="btn primary" style={{ width: '100%', marginTop: 8 }} onClick={() => {
        const b = Object.fromEntries(Object.entries(vals).filter(([, v]) => num(v) > 0).map(([k, v]) => [k, num(v)]))
        s.set('budgetsHist', { ...(s.budgetsHist || {}), [mk]: b })
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
  const [deadline, setDeadline] = useState(goal?.deadline || '')
  return (
    <>
      <Field label={t('goal.kind')}>
        <div className="chips">
          {(['savings', 'purchase', 'debt'] as FinGoalType[]).map((k) => <button key={k} className={`chip ${k === type ? 'on' : ''}`} onClick={() => setType(k)}>{t(`fg.${k}`)}</button>)}
        </div>
      </Field>
      <Field label={t('goal.title')}><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('fin.goalPh')} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 8 }}>
        <Field label={type === 'debt' ? t('fin.debtTotal') : t('goal.targetUsd')}><input className="input" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} /></Field>
        <Field label={t('fin.deadline')}><input className="input" type="month" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></Field>
      </div>
      <button className="btn primary" style={{ width: '100%' }} disabled={!title.trim()} onClick={() => {
        upsertFinGoal({ id: goal?.id || uid(), saved: goal?.saved || 0, type, title: title.trim(), target: num(target) || 0, deadline: deadline || undefined, seed: goal?.seed && goal.title === title.trim() ? goal.seed : undefined })
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
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 8 }}>
        <button className="btn ghost" disabled={!(n > 0)} onClick={() => { upsertFinGoal({ ...goal, saved: Math.max(0, goal.saved - n) }); onDone() }}>− {t('fin.withdraw')}</button>
        <button className="btn primary" disabled={!(n > 0)} onClick={() => { upsertFinGoal({ ...goal, saved: goal.saved + n }); onDone() }}>+ {t('common.add')}</button>
      </div>
      <button className="btn ghost" style={{ width: '100%', marginTop: 8 }} onClick={onEdit}>{t('goal.edit')}</button>
    </>
  )
}

function RecurringForm({ rec, mk, onDone }: { rec?: Recurring; mk: string; onDone: () => void }) {
  const t = useT()
  const { currencies, upsertRecurring, removeRecurring } = useStore()
  const [title, setTitle] = useState(rec?.title || '')
  const [amount, setAmount] = useState(rec ? String(recurringAmount(rec, mk)) : '')
  const [cur, setCur] = useState<Currency>(rec?.currency || 'USD')
  const [cat, setCat] = useState(rec?.category || 'subscriptions')
  const [day, setDay] = useState(String(rec?.day || 1))
  return (
    <>
      <Field label={t('goal.title')}><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Netflix" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 8 }}>
        <Field label={t('fin.amount')}><input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label={t('fin.dayOfMonth')}><input className="input" inputMode="numeric" value={day} onChange={(e) => setDay(e.target.value)} /></Field>
      </div>
      {rec && <div className="mut" style={{ fontSize: 12, marginTop: -6, marginBottom: 12 }}>{t('fin.amountFrom')}</div>}
      <div className="chips" style={{ marginBottom: 14 }}>
        {currencies.map((c) => <button key={c} className={`chip ${c === cur ? 'on' : ''}`} onClick={() => setCur(c)}>{c}</button>)}
      </div>
      <Field label={t('fin.category')}>
        <div className="chips">{EXPENSE_CATS.map((c) => <button key={c} className={`chip ${c === cat ? 'on' : ''}`} onClick={() => setCat(c)}>{t(`cat.${c}`)}</button>)}</div>
      </Field>
      <button className="btn primary" style={{ width: '100%' }} disabled={!title.trim() || !(num(amount) > 0)} onClick={() => {
        const a = num(amount)
        const base: Recurring = rec
          ? { ...rec, amounts: recurringAmount(rec, mk) !== a ? [...(rec.amounts || []).filter((x) => x.from !== mk), { from: mk, amount: a }] : rec.amounts }
          : { id: uid(), paid: [], amount: a, start: mk, title: '', currency: cur, category: cat, day: 1 }
        upsertRecurring({ ...base, title: title.trim(), currency: cur, category: cat, day: Math.min(31, Math.max(1, num(day) || 1)) })
        onDone()
      }}>{t('common.save')}</button>
      {rec && <button className="btn danger" style={{ width: '100%', marginTop: 8 }} onClick={() => { if (confirm(t('common.confirmDelete'))) { removeRecurring(rec.id); onDone() } }}>{t('common.delete')}</button>}
    </>
  )
}

function PayConfirm({ rec, mk, onDone }: { rec: Recurring; mk: string; onDone: () => void }) {
  const t = useT()
  const s = useStore()
  const a = recurringAmount(rec, mk)
  return (
    <>
      <div className="card" style={{ textAlign: 'center', padding: 18 }}>
        <div style={{ fontWeight: 600 }}>{rec.title}</div>
        <div className="num" style={{ fontSize: 28, margin: '6px 0' }}>{money(a, rec.currency)}</div>
        <div className="mut" style={{ fontSize: 12 }}>{cap(fmtDate(new Date(Number(mk.slice(0, 4)), Number(mk.slice(5)) - 1, 1), s.lang, { month: 'long', year: 'numeric' }))} · {t(`cat.${rec.category}`)}</div>
      </div>
      <div className="mut" style={{ fontSize: 12, marginBottom: 12 }}>{t('fin.payHint')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 8 }}>
        <button className="btn ghost" onClick={onDone}>{t('common.cancel')}</button>
        <button className="btn primary" onClick={() => { s.payRecurring(rec.id, mk); onDone() }}><Icon n="check" size="s" />{t('fin.confirmPay')}</button>
      </div>
    </>
  )
}
