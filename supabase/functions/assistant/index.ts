// LOCK IN — voice/text assistant. Turns a spoken command into proposed app actions.
// Claude only *proposes* (tool_use blocks); the app shows them and applies after the user confirms.
// Secrets: ANTHROPIC_API_KEY (+ built-in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const anthropic = new Anthropic() // reads ANTHROPIC_API_KEY

const S = (d: string) => ({ type: 'string', description: d })
const N = (d: string) => ({ type: 'number', description: d })
const OPT = (t: 'string' | 'number' | 'boolean', d: string) => ({ type: [t, 'null'], description: d })
const E = (vals: string[], d: string) => ({ type: 'string', enum: vals, description: d })
const tool = (name: string, description: string, props: Record<string, unknown>) => ({
  name,
  description,
  strict: true,
  input_schema: { type: 'object', properties: props, required: Object.keys(props), additionalProperties: false },
})

const CATS = ['food', 'housing', 'transport', 'entertainment', 'health', 'sport', 'subscriptions', 'shopping', 'travel', 'other']
const TOOLS = [
  tool('set_habit_done', 'Mark a daily habit as done or not done for a date.', {
    habit_id: S('id from the habits list'), date: S('YYYY-MM-DD'), done: { type: 'boolean' },
  }),
  tool('add_transaction', 'Record an expense or an income.', {
    type: E(['expense', 'income'], 'expense or income'),
    amount: N('positive amount in the given currency'),
    currency: E(['USD', 'GEL', 'RUB'], 'currency; use the default expense currency if the user did not say'),
    category: E([...CATS, 'fixed', 'variable'], 'expense category, or for income: fixed (salary) / variable (freelance, other)'),
    note: OPT('string', 'short description, e.g. the place or what was bought'),
    date: S('YYYY-MM-DD'),
  }),
  tool('add_workout', 'Log a workout.', {
    type: E(['strength', 'yoga', 'stretch', 'walk', 'other'], 'workout type'), minutes: N('duration in minutes'), date: S('YYYY-MM-DD'),
  }),
  tool('set_daily_metrics', 'Record sleep hours and/or steps for a date.', {
    date: S('YYYY-MM-DD'), sleep_hours: OPT('number', 'hours slept'), steps: OPT('number', 'step count'),
  }),
  tool('set_body_weight', 'Record body weight for a month.', { month: S('YYYY-MM'), kg: N('weight in kg') }),
  tool('set_growth_item', 'Set this week’s new place or new skill (and whether it is done).', {
    field: E(['place', 'skill'], 'which item'), title: S('name of the place or skill'), done: { type: 'boolean' },
  }),
  tool('set_speech_activity', 'Mark a speech-development activity as done/undone this week.', {
    activity: E(['camera', 'retell', 'aloud', 'explain', 'diction'], 'camera = talk to camera, retell = retell a podcast, aloud = read aloud, explain = explain a topic, diction = diction warm-up'),
    done: { type: 'boolean' },
  }),
  tool('add_language_minutes', 'Add language practice minutes to this week.', {
    lang: E(['en', 'fr', 'de'], 'English, French or German'), minutes: N('minutes to add (negative to remove)'),
  }),
  tool('add_habit', 'Create a new daily habit.', {
    name: S('habit name in the user’s language'), block: E(['morning', 'day', 'evening'], 'time of day'),
    target: OPT('number', 'amount, if the habit has one'), unit: { type: ['string', 'null'], enum: ['min', 'ml', 'pages', 'reps', 'steps', null], description: 'unit of target' },
    reminder: OPT('string', 'reminder time HH:MM, if asked'),
  }),
  tool('update_habit', 'Change an existing habit (name, target, reminder time). Pass null for fields that stay unchanged.', {
    habit_id: S('id from the habits list'), name: OPT('string', 'new name'), target: OPT('number', 'new target'), reminder: OPT('string', 'new reminder HH:MM, or "off" to remove'),
  }),
  tool('add_goal', 'Create a week/month/year goal.', {
    period: E(['week', 'month', 'year'], 'period'), kind: E(['income', 'savings', 'custom'], 'income/savings are counted from transactions automatically; custom is tracked by hand'),
    title: S('goal title'), target: N('target number (USD for income/savings)'),
  }),
  tool('set_goal_progress', 'Set progress of a custom goal for the current period.', { goal_id: S('id from the goals list'), value: N('new progress value') }),
  tool('add_to_money_goal', 'Add money to a savings/purchase goal, or record a debt payment (negative amount takes money out).', {
    fin_goal_id: S('id from the money goals list'), amount_usd: N('amount in USD'),
  }),
  tool('create_calendar_event', 'Create a Google Calendar event (a call, a meeting, a reminder).', {
    title: S('event title'), date: S('YYYY-MM-DD'), start_time: S('HH:MM 24h'), duration_min: N('duration in minutes; 30 if not said'),
  }),
]

const SYSTEM = `You are the assistant inside LOCK IN, a personal tracker app for daily habits, goals, finances, sport and personal growth.
The user speaks a command (often Russian, sometimes English, transcribed from voice, so expect small recognition errors).
Turn it into tool calls that change the app's data. Call every tool needed for the whole command in one turn - several calls are fine.
Rules:
- Use only ids that appear in the context. Match habits, goals and money goals by meaning, not exact spelling.
- Resolve relative dates ("вчера", "в пятницу", "завтра в 3") against the given today date and time zone.
- Amounts: "лари"/"лар"/"₾" = GEL, "долларов"/"баксов"/"$" = USD, "рублей" = RUB. Without a currency, an expense uses the default expense currency and an income uses USD.
- If the command is a question about the user's data, answer it from the context in one or two short sentences and call no tools.
- If something essential is missing or ambiguous, call no tools and ask one short clarifying question.
- After the tool calls, add one short sentence summarising what you prepared, in the user's language. No markdown.`

type Ctx = Record<string, unknown>

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '')
    const { data: { user } } = await admin.auth.getUser(jwt)
    if (!user) return json({ error: 'unauthorized' }, 401)
    if (!Deno.env.get('ANTHROPIC_API_KEY')) return json({ error: 'ANTHROPIC_API_KEY is not set in Supabase secrets' }, 500)

    const { text, context } = (await req.json()) as { text?: string; context?: Ctx }
    if (!text || text.length > 2000) return json({ error: 'empty or too long' }, 400)

    const response = await anthropic.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      tools: TOOLS,
      messages: [{ role: 'user', content: `Context (JSON):\n${JSON.stringify(context)}\n\nCommand: ${text}` }],
    } as Parameters<typeof anthropic.beta.messages.create>[0])

    if (response.stop_reason === 'refusal') return json({ reply: 'Не могу помочь с этим запросом.', actions: [] })
    const actions: { tool: string; input: unknown }[] = []
    let reply = ''
    for (const b of response.content) {
      if (b.type === 'tool_use') actions.push({ tool: b.name, input: b.input })
      else if (b.type === 'text') reply += b.text
    }
    return json({ reply: reply.trim(), actions, truncated: response.stop_reason === 'max_tokens' })
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return json({ error: 'Anthropic API key is invalid' }, 500)
    if (e instanceof Anthropic.RateLimitError) return json({ error: 'Too many requests, try again in a minute' }, 429)
    if (e instanceof Anthropic.APIError) return json({ error: `Claude API error ${e.status}: ${e.message}` }, 502)
    return json({ error: String(e) }, 500)
  }
})
