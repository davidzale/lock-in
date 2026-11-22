// LOCK IN — Google Calendar proxy.
// Keeps the user's Google refresh token server-side (table google_tokens, no client access)
// and talks to the Calendar API on their behalf.
// Secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (+ built-in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const CAL = 'https://www.googleapis.com/calendar/v3'

async function accessToken(refresh: string): Promise<string | null> {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      refresh_token: refresh,
      grant_type: 'refresh_token',
    }),
  })
  const j = await r.json()
  return r.ok ? (j.access_token as string) : null
}

type GEv = {
  id: string; summary?: string; status?: string; htmlLink?: string; hangoutLink?: string; location?: string
  start: { dateTime?: string; date?: string }; end: { dateTime?: string; date?: string }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '')
    const { data: { user } } = await admin.auth.getUser(jwt)
    if (!user) return json({ error: 'unauthorized' }, 401)
    const body = await req.json().catch(() => ({}))
    const action = body.action as string

    if (action === 'connect') {
      if (!body.refresh_token) return json({ error: 'no refresh token' }, 400)
      const { error } = await admin.from('google_tokens').upsert({ user_id: user.id, refresh_token: body.refresh_token, updated_at: new Date().toISOString() })
      if (error) return json({ error: error.message }, 500)
      return json({ connected: true })
    }

    const { data: row } = await admin.from('google_tokens').select('refresh_token').eq('user_id', user.id).maybeSingle()
    if (!row) return json({ connected: false })

    if (action === 'disconnect') {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(row.refresh_token)}`, { method: 'POST' }).catch(() => {})
      await admin.from('google_tokens').delete().eq('user_id', user.id)
      return json({ connected: false })
    }

    const token = await accessToken(row.refresh_token)
    if (!token) {
      await admin.from('google_tokens').delete().eq('user_id', user.id)
      return json({ connected: false, error: 'google access expired, reconnect' })
    }
    const g = (path: string, init: RequestInit = {}) =>
      fetch(CAL + path, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) } })

    // the user may have unticked the calendar checkbox on Google's consent screen
    const info = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${token}`).then((r) => r.json()).catch(() => ({}))
    if (info.scope && !String(info.scope).includes('calendar')) {
      return json({ connected: false, error: 'no_scope' })
    }

    if (action === 'status') return json({ connected: true })

    if (action === 'list') {
      const cl = await g('/users/me/calendarList?minAccessRole=reader').then((r) => r.json())
      const cals: { id: string; backgroundColor?: string; selected?: boolean; primary?: boolean; summary?: string }[] =
        (cl.items || []).filter((c: { selected?: boolean; primary?: boolean }) => c.selected || c.primary)
      // calendar.events scope can't list calendars — always read the primary calendar directly
      if (!cals.some((c) => c.primary)) cals.unshift({ id: 'primary', primary: true })
      const qs = new URLSearchParams({ timeMin: body.timeMin, timeMax: body.timeMax, singleEvents: 'true', orderBy: 'startTime', maxResults: '250' })
      const lists = await Promise.all(
        cals.map(async (c) => {
          const r = await g(`/calendars/${encodeURIComponent(c.id)}/events?${qs}`).then((r) => r.json())
          return ((r.items || []) as GEv[])
            .filter((e) => e.status !== 'cancelled')
            .map((e) => ({
              id: `${c.id}:${e.id}`,
              title: e.summary || '(no title)',
              start: e.start.dateTime || e.start.date,
              end: e.end.dateTime || e.end.date,
              allDay: !e.start.dateTime,
              meet: e.hangoutLink,
              link: e.htmlLink,
              location: e.location,
              color: c.backgroundColor,
              calendar: c.primary ? 'primary' : c.summary,
            }))
        }),
      )
      const events = lists.flat().sort((a, b) => String(a.start).localeCompare(String(b.start)))
      return json({ connected: true, events })
    }

    if (action === 'update' || action === 'delete') {
      const full = String(body.id || '')
      const cut = full.lastIndexOf(':')
      const cal = cut > 0 ? full.slice(0, cut) : 'primary'
      const evId = cut > 0 ? full.slice(cut + 1) : full
      const path = `/calendars/${encodeURIComponent(cal)}/events/${encodeURIComponent(evId)}?sendUpdates=all`
      if (action === 'delete') {
        const r = await g(path, { method: 'DELETE' })
        if (!r.ok && r.status !== 410) return json({ error: (await r.json().catch(() => ({}))).error?.message || 'delete failed' }, 400)
        return json({ connected: true, ok: true })
      }
      const tz = body.timeZone || 'UTC'
      const patch: Record<string, unknown> = {}
      if (body.title) patch.summary = body.title
      if (body.start) patch.start = { dateTime: body.start, timeZone: tz }
      if (body.end) patch.end = { dateTime: body.end, timeZone: tz }
      const r = await g(path, { method: 'PATCH', body: JSON.stringify(patch) })
      const j = await r.json()
      if (!r.ok) return json({ error: j.error?.message || 'update failed' }, 400)
      return json({ connected: true, ok: true })
    }

    if (action === 'create') {
      const tz = body.timeZone || 'UTC'
      const guests = ((body.guests || []) as string[]).filter((x) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x)).slice(0, 50)
      const ev: Record<string, unknown> = {
        summary: body.title,
        description: body.description || undefined,
        start: { dateTime: body.start, timeZone: tz },
        end: { dateTime: body.end, timeZone: tz },
        reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 15 }] },
      }
      if (guests.length) ev.attendees = guests.map((email) => ({ email }))
      if (body.meet) ev.conferenceData = { createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } } }
      // sendUpdates=all emails the invitation to every guest
      const qs = new URLSearchParams({ sendUpdates: guests.length ? 'all' : 'none', conferenceDataVersion: '1' })
      const r = await g(`/calendars/primary/events?${qs}`, { method: 'POST', body: JSON.stringify(ev) })
      const j = await r.json()
      if (!r.ok) return json({ error: j.error?.message || 'create failed' }, 400)
      return json({ connected: true, id: j.id })
    }

    return json({ error: 'unknown action' }, 400)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
