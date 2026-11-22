// LOCK IN — Siri / Shortcuts inbox.
// POST { text } with header `x-lockin-token: <personal token>` → stores the command in quick_inbox
// and replies with a short summary for Siri to speak. The app applies inbox items when it opens.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import { parseLocal, summarize } from './localParse.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-lockin-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const reply = (text: string, status = 200) => new Response(text, { status, headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8' } })
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const token = req.headers.get('x-lockin-token') || new URL(req.url).searchParams.get('token') || ''
    if (token.length < 20) return reply('Нет ключа LOCK IN', 401)
    const { data: tk } = await admin.from('quick_tokens').select('user_id').eq('token', token).maybeSingle()
    if (!tk) return reply('Ключ LOCK IN не найден — создай новый в Настройках', 401)

    let text = ''
    const ct = req.headers.get('content-type') || ''
    if (ct.includes('json')) text = String((await req.json().catch(() => ({}))).text || '')
    else text = (await req.text()).trim()
    text = text.slice(0, 500)
    if (!text) return reply('Не расслышал — повтори, пожалуйста', 400)

    const { data: st } = await admin.from('app_state').select('data').eq('user_id', tk.user_id).maybeSingle()
    const d = (st?.data || {}) as { defaultCurrency?: string; habits?: { id: string; name: string; seed?: string }[] }
    const habits = (d.habits || []).map((h) => ({ id: h.id, name: h.name, seed: h.seed }))
    const actions = parseLocal(text, { defaultCurrency: d.defaultCurrency || 'GEL', habits })
    if (!actions.length) return reply(/[а-яё]/i.test(text) ? 'Не понял. Скажи, например: «кофе 12 лари» или «сделал йогу»' : 'Didn’t get that. Try “coffee 12 lari” or “did yoga”.', 422)

    const { error } = await admin.from('quick_inbox').insert({ user_id: tk.user_id, text })
    if (error) return reply('Не получилось сохранить: ' + error.message, 500)
    const ru = /[а-яё]/i.test(text)
    return reply((ru ? 'Записал: ' : 'Saved: ') + summarize(actions, habits, !ru))
  } catch (e) {
    return reply('Ошибка: ' + String(e), 500)
  }
})
