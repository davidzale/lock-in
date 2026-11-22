import { supabase, SUPABASE_URL } from './supabase'
import { useStore } from '../store'
import { parseLocal, summarize } from './localParse'
import { apply } from './assistant'
import { toast } from '../components/Toast'

export const QUICK_URL = `${SUPABASE_URL}/functions/v1/quick`
const KEY = 'lockin-quick-token'

export const savedToken = () => {
  try { return localStorage.getItem(KEY) } catch { return null }
}

export async function createToken(userId: string) {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const rnd = crypto.getRandomValues(new Uint8Array(32))
  const token = Array.from(rnd, (b) => abc[b % abc.length]).join('')
  await supabase.from('quick_tokens').delete().eq('user_id', userId) // one active key
  const { error } = await supabase.from('quick_tokens').insert({ token, user_id: userId })
  if (error) throw new Error(error.message)
  try { localStorage.setItem(KEY, token) } catch { /* ignore */ }
  return token
}

export async function revokeTokens(userId: string) {
  await supabase.from('quick_tokens').delete().eq('user_id', userId)
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}

let running = false
/** apply commands that arrived through Siri while the app was closed */
export async function applyInbox() {
  if (running) return
  running = true
  try {
    const { data, error } = await supabase.from('quick_inbox').select('id, text, created_at').is('applied_at', null).order('created_at')
    if (error || !data?.length) return
    const s = useStore.getState()
    const habits = s.habits.map((h) => ({ id: h.id, name: h.name, seed: h.seed }))
    const done: string[] = []
    for (const row of data) {
      const actions = parseLocal(row.text, { defaultCurrency: s.defaultCurrency, habits, now: new Date(row.created_at) })
      for (const a of actions) await apply(a)
      await supabase.from('quick_inbox').update({ applied_at: new Date().toISOString() }).eq('id', row.id)
      const sum = summarize(actions, habits)
      if (sum) done.push(sum)
    }
    if (done.length) toast(`Siri: ${done.join('; ')}`)
  } finally {
    running = false
  }
}
