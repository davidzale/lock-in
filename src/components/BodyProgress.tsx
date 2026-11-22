import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { useT } from '../i18n'
import { fmtDate, monthKey } from '../lib/date'
import { compress, getPhoto, photoKeys, putPhoto } from '../lib/photos'
import { Field, Seg, Sheet } from './ui'
import { Icon } from './Icon'

const PARTS = ['waist', 'chest', 'hips', 'arm', 'thigh'] as const
const POSES = ['front', 'side', 'back'] as const
type Pose = (typeof POSES)[number]
const mkDate = (mk: string) => new Date(Number(mk.slice(0, 4)), Number(mk.slice(5, 7)) - 1, 1)

function usePhotoUrl(key: string | null, version: number) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let u: string | null = null
    if (!key) return setUrl(null)
    getPhoto(key).then((b) => { if (b) { u = URL.createObjectURL(b); setUrl(u) } else setUrl(null) }).catch(() => setUrl(null))
    return () => { if (u) URL.revokeObjectURL(u) }
  }, [key, version])
  return url
}

export function BodyProgress() {
  const t = useT()
  const s = useStore()
  const lang = s.lang
  const mk = monthKey(new Date())
  const [sheet, setSheet] = useState<'measure' | 'photos' | null>(null)
  const months = [...new Set([...Object.keys(s.weights), ...Object.keys(s.measures)])].sort()
  const first = months[0]
  const last = months[months.length - 1]
  const val = (m: string | undefined, k: string) => (m ? (k === 'weight' ? s.weights[m] : s.measures[m]?.[k as (typeof PARTS)[number]]) : undefined)
  const rows = ['weight', ...PARTS].map((k) => ({ k, now: val(last, k), start: val(first, k) })).filter((r) => r.now != null)

  return (
    <div className="card">
      <div className="card-head">
        <span className="gap8 h2"><Icon n="scale" size="s" className="acc" />{t('body.title')}</span>
        {first && first !== last && <span className="lbl">{t('body.since', { m: fmtDate(mkDate(first), lang, { month: 'short', year: '2-digit' }) })}</span>}
      </div>
      {rows.length === 0 && <div className="mut" style={{ fontSize: 13, marginBottom: 10 }}>{t('body.empty')}</div>}
      {rows.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8, marginBottom: 12 }}>
          {rows.map((r) => {
            const d = r.start != null && r.now != null ? Math.round((r.now - r.start) * 10) / 10 : 0
            return (
              <div key={r.k} style={{ background: 'var(--card2)', borderRadius: 12, padding: '8px 10px' }}>
                <div className="lbl">{t(`body.${r.k}`).replace(', kg', '').replace(', кг', '')}</div>
                <div className="num" style={{ fontSize: 16, marginTop: 3 }}>{r.now}<span className="mut" style={{ fontSize: 11 }}> {r.k === 'weight' ? t('unit.kg') : t('body.cm')}</span></div>
                {d !== 0 && <div className={`num ${d < 0 ? 'pos' : 'neg'}`} style={{ fontSize: 11 }}>{d > 0 ? '+' : ''}{d}</div>}
              </div>
            )
          })}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 8 }}>
        <button className="btn ghost sm" onClick={() => setSheet('measure')}><Icon n="edit" size="s" />{t('body.measure')}</button>
        <button className="btn ghost sm" onClick={() => setSheet('photos')}><Icon n="sun" size="s" />{t('body.photos')}</button>
      </div>
      <Sheet open={!!sheet} onClose={() => setSheet(null)} title={sheet === 'measure' ? `${t('body.measure')} · ${fmtDate(mkDate(mk), lang, { month: 'long' })}` : t('body.photos')}>
        {sheet === 'measure' && <MeasureForm mk={mk} onDone={() => setSheet(null)} />}
        {sheet === 'photos' && <Photos mk={mk} />}
      </Sheet>
    </div>
  )
}

function MeasureForm({ mk, onDone }: { mk: string; onDone: () => void }) {
  const t = useT()
  const s = useStore()
  const [w, setW] = useState(String(s.weights[mk] ?? ''))
  const [m, setM] = useState<Record<string, string>>(Object.fromEntries(PARTS.map((p) => [p, String(s.measures[mk]?.[p] ?? '')])))
  const n = (x: string) => Number(x.replace(',', '.'))
  return (
    <>
      <Field label={t('body.weight')}><input className="input" inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} placeholder="83" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 8 }}>
        {PARTS.map((p) => (
          <Field key={p} label={`${t(`body.${p}`)}, ${t('body.cm')}`}>
            <input className="input" inputMode="decimal" value={m[p]} onChange={(e) => setM({ ...m, [p]: e.target.value })} />
          </Field>
        ))}
      </div>
      <button className="btn primary" style={{ width: '100%' }} onClick={() => {
        const weights = { ...s.weights }
        if (n(w) > 0) weights[mk] = n(w)
        else delete weights[mk]
        const vals = Object.fromEntries(PARTS.filter((p) => n(m[p]) > 0).map((p) => [p, n(m[p])]))
        const measures = { ...s.measures }
        if (Object.keys(vals).length) measures[mk] = vals
        else delete measures[mk]
        s.set('weights', weights)
        s.set('measures', measures)
        onDone()
      }}>{t('common.save')}</button>
    </>
  )
}

function Slot({ k, label, version, onPick }: { k: string; label: string; version: number; onPick: () => void }) {
  const url = usePhotoUrl(k, version)
  return (
    <button className="photo-slot" onClick={onPick}>
      {url ? <img src={url} alt={label} /> : <Icon n="plus" size="s" className="mut" />}
      <span className="lbl">{label}</span>
    </button>
  )
}

function Photos({ mk }: { mk: string }) {
  const t = useT()
  const lang = useStore((s) => s.lang)
  const [version, setVersion] = useState(0)
  const [keys, setKeys] = useState<string[]>([])
  const [mode, setMode] = useState<'month' | 'compare'>('month')
  const [pose, setPose] = useState<Pose>('front')
  const input = useRef<HTMLInputElement>(null)
  const target = useRef('')
  useEffect(() => { photoKeys().then(setKeys).catch(() => setKeys([])) }, [version])
  const months = [...new Set(keys.map((k) => k.split(':')[0]))].sort()
  const before = months.find((m) => keys.includes(`${m}:${pose}`)) || null
  const after = [...months].reverse().find((m) => keys.includes(`${m}:${pose}`)) || null
  const bUrl = usePhotoUrl(before ? `${before}:${pose}` : null, version)
  const aUrl = usePhotoUrl(after && after !== before ? `${after}:${pose}` : null, version)

  return (
    <>
      <div className="mut" style={{ fontSize: 12, marginBottom: 12 }}>{t('body.local')}</div>
      <Seg value={mode} onChange={setMode} options={[{ v: 'month', label: fmtDate(mkDate(mk), lang, { month: 'long' }) }, { v: 'compare', label: t('body.compare') }]} />
      {mode === 'month' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8, marginTop: 12 }}>
          {POSES.map((p) => <Slot key={p} k={`${mk}:${p}`} label={t(`body.${p}`)} version={version} onPick={() => { target.current = `${mk}:${p}`; input.current?.click() }} />)}
        </div>
      ) : (
        <>
          <div style={{ margin: '12px 0' }}><Seg value={pose} onChange={setPose} options={POSES.map((p) => ({ v: p, label: t(`body.${p}`) }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 8 }}>
            {[{ url: bUrl, m: before, l: t('body.before') }, { url: aUrl, m: after !== before ? after : null, l: t('body.after') }].map((x) => (
              <div key={x.l} className="photo-slot" style={{ cursor: 'default' }}>
                {x.url ? <img src={x.url} alt={x.l} /> : <Icon n="sun" size="s" className="mut" />}
                <span className="lbl">{x.l}{x.m ? ` · ${fmtDate(mkDate(x.m), lang, { month: 'short', year: '2-digit' })}` : ''}</span>
              </div>
            ))}
          </div>
        </>
      )}
      <input ref={input} type="file" accept="image/*" hidden onChange={async (e) => {
        const f = e.target.files?.[0]
        e.target.value = ''
        if (!f || !target.current) return
        await putPhoto(target.current, await compress(f))
        setVersion((v) => v + 1)
      }} />
    </>
  )
}
