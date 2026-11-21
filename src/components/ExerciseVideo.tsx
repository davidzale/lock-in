import { useState } from 'react'
import { useStore } from '../store'
import { useT } from '../i18n'
import { EX, videoUrl } from '../lib/program'
import { VIDEOS } from '../lib/videos'
import { Icon } from './Icon'

/** YouTube id from any youtube link (watch, youtu.be, shorts, embed) */
function ytId(url?: string) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

export function videoFor(exId: string, custom?: string) {
  const own = ytId(custom)
  if (own) return { id: own, title: '', channel: '', url: custom! }
  if (custom) return { id: null, title: '', channel: '', url: custom }
  const v = VIDEOS[exId]
  if (v) return { id: v.id, title: v.title, channel: v.channel, url: `https://www.youtube.com/watch?v=${v.id}` }
  return { id: null, title: '', channel: '', url: videoUrl(EX[exId]) }
}

/** "Technique video" button that expands an embedded player in place */
export function ExerciseVideo({ exId, compact = false }: { exId: string; compact?: boolean }) {
  const t = useT()
  const custom = useStore((s) => s.sport.videos[exId])
  const [open, setOpen] = useState(false)
  const v = videoFor(exId, custom)
  if (!v.id) {
    return (
      <a className={`btn ghost ${compact ? 'sm' : 'sm'}`} style={{ width: '100%', textDecoration: 'none' }} href={v.url} target="_blank" rel="noreferrer">
        <Icon n="video" size="s" />{t('sess.video')}
      </a>
    )
  }
  return (
    <div>
      <button className="btn ghost sm" style={{ width: '100%' }} onClick={() => setOpen(!open)}>
        <Icon n="video" size="s" />{open ? t('sess.hideVideo') : t('sess.video')}
      </button>
      {open && (
        <div className="video-wrap">
          <div className="video-frame">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${v.id}?playsinline=1&rel=0&modestbranding=1&autoplay=1`}
              title={v.title || EX[exId]?.name.en}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
          <div className="row" style={{ marginTop: 6, fontSize: 11 }}>
            <span className="mut ellipsis">{v.channel}</span>
            <a className="lbl acc" href={v.url} target="_blank" rel="noreferrer">YouTube ↗</a>
          </div>
        </div>
      )}
    </div>
  )
}
