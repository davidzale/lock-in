import { useEffect } from 'react'
import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { DATA_KEYS, pickData, useStore } from '../store'
import type { AppData } from '../store'

/**
 * Whole-state cloud sync: one row per user in `app_state` (jsonb).
 * Last write wins, compared by timestamps; single user across devices.
 */
type Status = 'off' | 'syncing' | 'synced' | 'error'
interface SyncState {
  session: Session | null
  status: Status
  lastSync?: string
  error?: string
}
export const useSync = create<SyncState>(() => ({ session: null, status: 'off' }))

const META = 'lockin-sync-meta'
type Meta = { localChangedAt?: string; remoteAt?: string }
const readMeta = (): Meta => {
  try {
    return JSON.parse(localStorage.getItem(META) || '{}')
  } catch {
    return {}
  }
}
const writeMeta = (m: Meta) => localStorage.setItem(META, JSON.stringify({ ...readMeta(), ...m }))

let applyingRemote = false
let pushTimer: ReturnType<typeof setTimeout> | undefined

async function push() {
  const { session } = useSync.getState()
  if (!session) return
  useSync.setState({ status: 'syncing' })
  const now = new Date().toISOString()
  const { error } = await supabase.from('app_state').upsert({ user_id: session.user.id, data: pickData(useStore.getState()), updated_at: now })
  if (error) return useSync.setState({ status: 'error', error: error.message })
  writeMeta({ remoteAt: now, localChangedAt: now })
  useSync.setState({ status: 'synced', lastSync: now, error: undefined })
}

export async function pull() {
  const { session } = useSync.getState()
  if (!session) return
  useSync.setState({ status: 'syncing' })
  const { data, error } = await supabase.from('app_state').select('data, updated_at').eq('user_id', session.user.id).maybeSingle()
  if (error) return useSync.setState({ status: 'error', error: error.message })
  const meta = readMeta()
  if (!data) return push() // first device: upload local data
  const ts = (x?: string) => (x ? Date.parse(x) : 0)
  const remoteAt = data.updated_at as string
  const remoteChanged = ts(meta.remoteAt) !== ts(remoteAt)
  const localDirty = ts(meta.localChangedAt) > ts(meta.remoteAt)
  // keep whichever side changed last
  if (localDirty && ts(meta.localChangedAt) > ts(remoteAt)) return push()
  if (remoteChanged) {
    applyingRemote = true
    const incoming = data.data as Partial<AppData>
    const clean = Object.fromEntries(DATA_KEYS.filter((k) => k in incoming).map((k) => [k, incoming[k]]))
    useStore.getState().importData(clean)
    applyingRemote = false
    writeMeta({ remoteAt, localChangedAt: remoteAt })
  }
  useSync.setState({ status: 'synced', lastSync: new Date().toISOString(), error: undefined })
}

export const syncNow = () => push()

export function useCloudSync() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      useSync.setState({ session: data.session })
      if (data.session) pull()
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      useSync.setState({ session, status: session ? useSync.getState().status : 'off' })
      if (event === 'SIGNED_IN') pull()
    })
    // mark local changes and push them shortly after
    const unsub = useStore.subscribe((s, prev) => {
      if (applyingRemote) return
      if (!DATA_KEYS.some((k) => s[k] !== prev[k])) return
      writeMeta({ localChangedAt: new Date().toISOString() })
      if (!useSync.getState().session) return
      clearTimeout(pushTimer)
      pushTimer = setTimeout(push, 1500)
    })
    const onVis = () => document.visibilityState === 'visible' && useSync.getState().session && pull()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      sub.subscription.unsubscribe()
      unsub()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])
}
