import { useEffect } from 'react'
import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { useSync } from './sync'
import { addDays, dayKey } from './date'

export interface GEvent {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  meet?: string
  link?: string
  location?: string
  color?: string
}

interface GcalState {
  connected: boolean | null
  /** events keyed by Monday dayKey of the loaded week */
  weeks: Record<string, GEvent[]>
  loading: boolean
  error?: string
}
export const useGcal = create<GcalState>(() => ({ connected: null, weeks: {}, loading: false }))

const CACHE = 'lockin-gcal-cache'
try {
  const c = JSON.parse(localStorage.getItem(CACHE) || 'null')
  if (c) useGcal.setState({ weeks: c.weeks || {}, connected: c.connected ?? null })
} catch { /* ignore */ }
useGcal.subscribe((s) => {
  try {
    localStorage.setItem(CACHE, JSON.stringify({ weeks: s.weeks, connected: s.connected }))
  } catch { /* ignore */ }
})

async function call<T = Record<string, unknown>>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('calendar', { body: { action, ...payload } })
  if (error) throw new Error(error.message)
  return data as T
}

export const CAL_SCOPE = 'https://www.googleapis.com/auth/calendar.events'

export async function connectGoogle() {
  const { error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: {
      redirectTo: location.origin + location.pathname,
      scopes: CAL_SCOPE,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  })
  if (error) useGcal.setState({ error: error.message })
}

export async function disconnectGoogle() {
  await call('disconnect').catch(() => {})
  useGcal.setState({ connected: false, weeks: {} })
}

/** after the Google redirect the session carries a one-time refresh token: hand it to the server */
export async function captureProviderToken(session: Session | null) {
  const rt = session?.provider_refresh_token
  if (!rt) return
  try {
    await call('connect', { refresh_token: rt })
    useGcal.setState({ connected: true, error: undefined })
  } catch (e) {
    useGcal.setState({ error: (e as Error).message })
  }
}

export async function loadWeek(monday: Date, force = false) {
  const key = dayKey(monday)
  const s = useGcal.getState()
  if (!force && s.loading) return
  useGcal.setState({ loading: true })
  try {
    const r = await call<{ connected: boolean; events?: GEvent[]; error?: string }>('list', {
      timeMin: monday.toISOString(),
      timeMax: addDays(monday, 7).toISOString(),
    })
    useGcal.setState((st) => ({
      connected: r.connected,
      weeks: r.events ? { ...st.weeks, [key]: r.events } : st.weeks,
      error: r.error,
      loading: false,
    }))
  } catch (e) {
    useGcal.setState({ loading: false, error: (e as Error).message })
  }
}

export async function createEvent(p: { title: string; start: Date; end: Date; description?: string; guests?: string[]; meet?: boolean }) {
  const r = await call<{ id?: string; error?: string; connected?: boolean }>('create', {
    title: p.title,
    description: p.description,
    guests: p.guests || [],
    meet: !!p.meet,
    start: p.start.toISOString(),
    end: p.end.toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
  if (r.connected === false) {
    useGcal.setState({ connected: false, error: r.error })
    throw new Error(r.error === 'no_scope' ? 'no_scope' : 'not_connected')
  }
  if (r.error) throw new Error(r.error)
  if (!r.id) throw new Error('Google did not create the event')
  // show it right away, before the next refresh
  const ev: GEvent = { id: `primary:${r.id}`, title: p.title, start: p.start.toISOString(), end: p.end.toISOString(), allDay: false }
  const key = dayKey(weekStartOf(p.start))
  useGcal.setState((st) => ({ weeks: { ...st.weeks, [key]: [...(st.weeks[key] || []), ev] } }))
}

function weekStartOf(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}

/** events overlapping a given day */
export function eventsOn(day: string, weeks: Record<string, GEvent[]>) {
  const all = Object.values(weeks).flat()
  const seen = new Set<string>()
  return all.filter((e) => {
    if (seen.has(e.id)) return false
    const s = e.allDay ? e.start : dayKey(new Date(e.start))
    const en = e.allDay ? e.end : dayKey(new Date(e.end))
    const hit = e.allDay ? s <= day && day < en : s <= day && day <= en
    if (hit) seen.add(e.id)
    return hit
  })
}

/** load the week containing `monday` whenever the user is signed in */
export function useWeekEvents(monday: Date) {
  const session = useSync((s) => s.session)
  const key = dayKey(monday)
  useEffect(() => {
    if (!session) return
    loadWeek(monday)
    const onVis = () => document.visibilityState === 'visible' && loadWeek(monday)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, key])
}

function replaceEvent(id: string, next: GEvent | null) {
  useGcal.setState((st) => ({
    weeks: Object.fromEntries(Object.entries(st.weeks).map(([k, list]) => [k, next ? list.map((e) => (e.id === id ? next : e)) : list.filter((e) => e.id !== id)])),
  }))
}

export async function updateEvent(ev: GEvent, p: { title: string; start: Date; end: Date }) {
  const r = await call<{ ok?: boolean; error?: string; connected?: boolean }>('update', {
    id: ev.id, title: p.title, start: p.start.toISOString(), end: p.end.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
  if (r.connected === false) throw new Error(r.error === 'no_scope' ? 'no_scope' : 'not_connected')
  if (r.error) throw new Error(r.error)
  // moved to another week? drop it here and let that week reload
  replaceEvent(ev.id, null)
  const key = dayKey(weekStartOf(p.start))
  useGcal.setState((st) => ({ weeks: { ...st.weeks, [key]: [...(st.weeks[key] || []), { ...ev, title: p.title, start: p.start.toISOString(), end: p.end.toISOString() }] } }))
}

export async function deleteEvent(ev: GEvent) {
  const r = await call<{ ok?: boolean; error?: string; connected?: boolean }>('delete', { id: ev.id })
  if (r.connected === false) throw new Error(r.error === 'no_scope' ? 'no_scope' : 'not_connected')
  if (r.error) throw new Error(r.error)
  replaceEvent(ev.id, null)
}
