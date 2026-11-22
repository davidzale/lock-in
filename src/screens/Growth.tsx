import { useMemo, useState } from 'react'
import { LANGS, SPEECH_ACTS, useStore } from '../store'
import type { GrowthWeek } from '../store'
import { useT } from '../i18n'
import { addDays, isoWeek, weekKey, weekStart } from '../lib/date'
import { growthScore } from '../lib/calc'
import { Field, Header, Heat, Sheet, Switch } from '../components/ui'
import { Icon } from '../components/Icon'
import { IDEAS } from '../lib/ideas'
import { GoalsCard } from '../components/GoalsCard'

type K = 'place' | 'skill' | 'speech' | 'lang'

export default function Growth() {
  const t = useT()
  const s = useStore()
  const now = new Date()
  const wk = weekKey(now)
  const w: GrowthWeek = s.growth[wk] || { speech: [], lang: {} }
  const sc = growthScore(w, s.growthTargets)
  const [open, setOpen] = useState<K | null>(null)
  const isSat = now.getDay() === 6
  const [ideaSeed, setIdeaSeed] = useState(() => Math.floor(Math.random() * 1000))
  const ideas = IDEAS[s.lang]
  const idea = ideas[ideaSeed % ideas.length]

  const langMin = LANGS.reduce((a, l) => a + (w.lang[l] || 0), 0)
  const langTarget = LANGS.reduce((a, l) => a + (s.growthTargets.lang[l] || 0), 0)

  const tiles: { k: K; icon: string; title: string; value: string; done: boolean }[] = [
    { k: 'place', icon: 'pin', title: t('growth.place'), value: w.place?.title || (isSat ? t('growth.placeToday') : t('growth.placeSat')), done: !!w.place?.done },
    { k: 'skill', icon: 'spark', title: t('growth.skill'), value: w.skill?.title || t('growth.setSkill'), done: !!w.skill?.done },
    { k: 'speech', icon: 'mic', title: t('growth.speech'), value: `${w.speech.length}/${s.growthTargets.speech}`, done: sc.parts.speech >= 1 },
    { k: 'lang', icon: 'globe', title: t('growth.lang'), value: `${langMin}/${langTarget} ${t('unit.min')}`, done: sc.parts.lang >= 1 },
  ]

  const heat = useMemo(() => {
    const cols = 26
    const vals: number[] = []
    const start = addDays(weekStart(now), -7 * (cols - 1))
    for (let i = 0; i < cols; i++) {
      const g = s.growth[weekKey(addDays(start, i * 7))]
      const p = growthScore(g, s.growthTargets).parts
      vals.push(p.place, p.skill, p.speech, p.lang)
    }
    return vals
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.growth, s.growthTargets])

  return (
    <>
      <Header eyebrow={`${t('common.week')} ${isoWeek(now)} · ${sc.done}/4`} title={t('tab.growth')} />

      <div className="g2">
        {tiles.map((x) => {
          const empty = (x.k === 'place' && !w.place?.title) || (x.k === 'skill' && !w.skill?.title)
          return (
            <button key={x.k} className={`tile ${empty ? 'empty-t' : ''}`} onClick={() => setOpen(x.k)}>
              <div className="row" style={{ marginBottom: 'auto', alignItems: 'flex-start' }}>
                <div className={`ibox ${empty ? 'g' : ''}`}><Icon n={x.icon} size="s" /></div>
                {x.done && <span className="cb on" style={{ width: 18, height: 18, borderRadius: 6 }}><Icon n="check" size="xs" /></span>}
              </div>
              <div className="lbl" style={{ marginTop: 10 }}>{x.title}</div>
              <div className={empty ? 'mut' : ''} style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{x.value}</div>
            </button>
          )
        })}
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 10 }}>
          <span className="lbl">{t('growth.history')}</span>
          <span className="lbl">{t('growth.rows')}</span>
        </div>
        <Heat values={heat} rows={4} cols={26} />
      </div>

      <div className="card">
        <div className="lbl">{t('growth.idea')}</div>
        <div style={{ fontSize: 15, fontWeight: 600, margin: '6px 0 12px' }}>{idea.text}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn primary sm" style={{ flex: 1 }} onClick={() => s.updateGrowth(wk, { [idea.kind]: { title: idea.text, done: false } })}>
            {t('growth.take')} · {t(`growth.${idea.kind}`)}
          </button>
          <button className="btn ghost sm" style={{ flex: 1 }} onClick={() => setIdeaSeed((x) => x + 1)}><Icon n="shuffle" size="s" />{t('growth.another')}</button>
        </div>
      </div>

      <GoalsCard />

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open ? tiles.find((x) => x.k === open)?.title : ''}>
        {(open === 'place' || open === 'skill') && <TitleDone wk={wk} k={open} onDone={() => setOpen(null)} />}
        {open === 'speech' && (
          <>
            <div className="mut" style={{ fontSize: 12, marginBottom: 8 }}>{t('growth.speechHint', { n: s.growthTargets.speech })}</div>
            {SPEECH_ACTS.map((a) => {
              const on = w.speech.includes(a)
              return (
                <button key={a} className={`task ${on ? 'done' : ''}`} onClick={() => s.updateGrowth(wk, { speech: on ? w.speech.filter((x) => x !== a) : [...w.speech, a] })}>
                  <span className={`cb ${on ? 'on' : ''}`}>{on && <Icon n="check" size="xs" />}</span>
                  <span className="grow"><span className="tname">{t(`speech.${a}`)}</span><div className="mut" style={{ fontSize: 12, textDecoration: 'none' }}>{t(`speech.${a}.d`)}</div></span>
                </button>
              )
            })}
          </>
        )}
        {open === 'lang' && (
          <>
            {LANGS.map((l) => {
              const v = w.lang[l] || 0
              const tg = s.growthTargets.lang[l] || 0
              const setV = (n: number) => s.updateGrowth(wk, { lang: { ...w.lang, [l]: Math.max(0, n) } })
              return (
                <div key={l} className="list-row">
                  <div className="grow">
                    <div style={{ fontWeight: 500 }}>{t(`lang.${l}`)}</div>
                    <div className="num mut" style={{ fontSize: 12 }}><span className={v >= tg ? 'acc' : ''}>{v}</span> / {tg} {t('unit.min')}</div>
                  </div>
                  <button className="btn ghost sm" onClick={() => setV(v - 15)}>−15</button>
                  <button className="btn primary sm" onClick={() => setV(v + 15)}>+15</button>
                </div>
              )
            })}
          </>
        )}
      </Sheet>
    </>
  )
}

function TitleDone({ wk, k, onDone }: { wk: string; k: 'place' | 'skill'; onDone: () => void }) {
  const t = useT()
  const s = useStore()
  const cur = s.growth[wk]?.[k]
  const [title, setTitle] = useState(cur?.title || '')
  const [done, setDone] = useState(!!cur?.done)
  return (
    <>
      <Field label={k === 'place' ? t('growth.placeQ') : t('growth.skillQ')}>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus={!cur} />
      </Field>
      <div className="row" style={{ marginBottom: 16 }}>
        <span>{k === 'place' ? t('growth.visited') : t('growth.mastered')}</span>
        <Switch on={done} onChange={setDone} />
      </div>
      <button className="btn primary" style={{ width: '100%' }} onClick={() => { s.updateGrowth(wk, { [k]: title.trim() ? { title: title.trim(), done } : undefined }); onDone() }}>
        {t('common.save')}
      </button>
    </>
  )
}
