// LOCK IN — push notifications. Called every minute by pg_cron (no auth needed: it only sends
// reminders that are due, deduplicated in notif_log). `{action:'test'}` with a user JWT sends a test push.
// Secrets: VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import webpush from 'npm:web-push@3.6.7'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT')!, Deno.env.get('VAPID_PUBLIC')!, Deno.env.get('VAPID_PRIVATE')!)

type Sub = { endpoint: string; user_id: string; p256dh: string; auth: string; tz: string | null }
type Msg = { title: string; body: string; url?: string; tag?: string }

async function sendTo(subs: Sub[], m: Msg) {
  let n = 0
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(m), { TTL: 3600 })
      n++
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode
      if (code === 404 || code === 410) await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
    }
  }
  return n
}

/** returns true only the first time a key is seen */
async function once(key: string) {
  const { error } = await admin.from('notif_log').insert({ key })
  return !error
}

function local(tz: string, d = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(d).map((x) => [x.type, x.value]),
  )
  const hh = Number(p.hour) % 24
  return { date: `${p.year}-${p.month}-${p.day}`, y: Number(p.year), m: Number(p.month), day: Number(p.day), minutes: hh * 60 + Number(p.minute), hh }
}

async function googleToken(userId: string) {
  const { data: row } = await admin.from('google_tokens').select('refresh_token').eq('user_id', userId).maybeSingle()
  if (!row) return null
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: Deno.env.get('GOOGLE_CLIENT_ID')!, client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!, refresh_token: row.refresh_token, grant_type: 'refresh_token' }),
  })
  return r.ok ? ((await r.json()).access_token as string) : null
}

type Habit = { id: string; name: string; reminder?: string; target?: number; unit?: string }
const UNIT: Record<string, Record<string, string>> = {
  en: { min: 'min', ml: 'ml', pages: 'pages', reps: 'reps', steps: 'steps' },
  ru: { min: 'мин', ml: 'мл', pages: 'стр.', reps: 'повт.', steps: 'шагов' },
}

async function forUser(userId: string, subs: Sub[]) {
  const tz = subs.find((s) => s.tz)?.tz || 'UTC'
  const now = new Date()
  const L = local(tz, now)
  const { data: st } = await admin.from('app_state').select('data').eq('user_id', userId).maybeSingle()
  const data = (st?.data || {}) as { lang?: string; habits?: Habit[]; logs?: Record<string, string[]> }
  const ru = data.lang === 'ru'
  let sent = 0

  // 1) habit reminders: due within the last 5 minutes and not done yet today
  for (const h of data.habits || []) {
    if (!h.reminder) continue
    const [hh, mm] = h.reminder.split(':').map(Number)
    const diff = L.minutes - (hh * 60 + mm)
    if (diff < 0 || diff > 5) continue
    if ((data.logs?.[L.date] || []).includes(h.id)) continue
    if (!(await once(`habit:${h.id}:${L.date}`))) continue
    const amount = h.target ? ` · ${h.target} ${UNIT[ru ? 'ru' : 'en'][h.unit || ''] || ''}`.trimEnd() : ''
    sent += await sendTo(subs, { title: h.name + amount, body: ru ? 'Время для привычки — отметь, когда сделаешь' : 'Time for your habit — check it off when done', url: './', tag: `habit-${h.id}` })
  }

  // 2) calendar: events starting in ~15 minutes
  const token = await googleToken(userId)
  if (token) {
    const g = (p: string) => fetch('https://www.googleapis.com/calendar/v3' + p, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json())
    const cl = await g('/users/me/calendarList?minAccessRole=reader')
    const cals = ((cl.items || []) as { id: string; selected?: boolean; primary?: boolean }[]).filter((c) => c.selected || c.primary)
    const qs = new URLSearchParams({ timeMin: new Date(now.getTime() + 10 * 60000).toISOString(), timeMax: new Date(now.getTime() + 16 * 60000).toISOString(), singleEvents: 'true', orderBy: 'startTime' })
    for (const c of cals) {
      const r = await g(`/calendars/${encodeURIComponent(c.id)}/events?${qs}`)
      for (const e of (r.items || []) as { id: string; summary?: string; status?: string; start: { dateTime?: string }; hangoutLink?: string }[]) {
        if (e.status === 'cancelled' || !e.start.dateTime) continue
        const start = new Date(e.start.dateTime)
        const mins = Math.round((start.getTime() - now.getTime()) / 60000)
        if (mins > 16 || mins < 10) continue
        if (!(await once(`event:${c.id}:${e.id}:${e.start.dateTime}`))) continue
        const time = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' }).format(start)
        sent += await sendTo(subs, {
          title: e.summary || (ru ? 'Событие' : 'Event'),
          body: ru ? `Через ${mins} мин · ${time}${e.hangoutLink ? ' · звонок' : ''}` : `In ${mins} min · ${time}${e.hangoutLink ? ' · call' : ''}`,
          url: './#/calendar',
          tag: `event-${e.id}`,
        })
      }
    }
  }

  // 3) monthly summary: the 1st of the month, from 10:00 local
  if (L.day === 1 && L.hh >= 10) {
    const prev = new Date(Date.UTC(L.y, L.m - 2, 1))
    const mk = `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`
    if (await once(`summary:${userId}:${mk}`)) {
      const name = new Intl.DateTimeFormat(ru ? 'ru-RU' : 'en-US', { month: 'long', timeZone: 'UTC' }).format(prev)
      sent += await sendTo(subs, { title: ru ? `Итоги: ${name}` : `${name} summary`, body: ru ? 'Готовы итоги месяца — посмотри, как прошёл' : 'Your monthly summary is ready', url: `./#/summary/${mk}`, tag: `summary-${mk}` })
    }
  }
  return sent
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const body = await req.json().catch(() => ({}))
    if (body.action === 'test') {
      const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '')
      const { data: { user } } = await admin.auth.getUser(jwt)
      if (!user) return json({ error: 'unauthorized' }, 401)
      const { data: subs } = await admin.from('push_subscriptions').select('*').eq('user_id', user.id)
      const sent = await sendTo((subs || []) as Sub[], { title: 'LOCK IN', body: 'Notifications work ✓', url: './', tag: 'test' })
      return json({ sent })
    }
    const { data: subs } = await admin.from('push_subscriptions').select('*')
    const byUser = new Map<string, Sub[]>()
    for (const s of (subs || []) as Sub[]) byUser.set(s.user_id, [...(byUser.get(s.user_id) || []), s])
    let sent = 0
    for (const [uid, list] of byUser) sent += await forUser(uid, list)
    // keep the log small
    await admin.from('notif_log').delete().lt('sent_at', new Date(Date.now() - 40 * 86400000).toISOString())
    return json({ users: byUser.size, sent })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
