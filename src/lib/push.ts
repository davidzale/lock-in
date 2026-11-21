import { supabase } from './supabase'

// Public VAPID key (the private one lives only in Supabase secrets).
const VAPID_PUBLIC = 'BB-qhqSVkvrIr-7K9Ee8BDjUZzsnaKy_X87rXyM0f8N2CFX7nAbTFX8H3FWHlxhc1OasVSM0XahJIwnCPkLFCnQ'

export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

function b64ToBytes(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

async function currentSub() {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

export async function pushEnabled() {
  return !!(await currentSub()) && Notification.permission === 'granted'
}

async function saveSub(userId: string, sub: PushSubscription) {
  const j = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert({
    endpoint: j.endpoint,
    user_id: userId,
    p256dh: j.keys?.p256dh,
    auth: j.keys?.auth,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
}

export async function enablePush(userId: string) {
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('permission')
  const reg = await navigator.serviceWorker.ready
  const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(VAPID_PUBLIC) }))
  await saveSub(userId, sub)
}

export async function disablePush() {
  const sub = await currentSub()
  if (!sub) return
  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  await sub.unsubscribe()
}

/** make sure this device's subscription (and current time zone) is stored on the server */
export async function syncSubscription(userId: string) {
  const sub = await currentSub()
  if (sub && Notification.permission === 'granted') await saveSub(userId, sub)
}

export async function testPush(userId: string) {
  await syncSubscription(userId)
  const { data, error } = await supabase.functions.invoke('notify', { body: { action: 'test' } })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data as { sent: number }
}
