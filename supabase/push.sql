-- LOCK IN: push notifications. Run once in Supabase → SQL Editor (empty tab).

-- devices that receive pushes
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  tz text,
  updated_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy "own subs select" on public.push_subscriptions for select using (auth.uid() = user_id);
create policy "own subs insert" on public.push_subscriptions for insert with check (auth.uid() = user_id);
create policy "own subs update" on public.push_subscriptions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own subs delete" on public.push_subscriptions for delete using (auth.uid() = user_id);
grant select, insert, update, delete on table public.push_subscriptions to authenticated, service_role;

-- sent-notification log (dedupe), server only
create table if not exists public.notif_log (
  key text primary key,
  sent_at timestamptz not null default now()
);
alter table public.notif_log enable row level security;
revoke all on table public.notif_log from anon, authenticated;
grant select, insert, delete on table public.notif_log to service_role;

-- run the notifier every minute
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule(
  'lockin-notify',
  '* * * * *',
  $$ select net.http_post(
       url := 'https://haurbvvzogrhayeonjuq.supabase.co/functions/v1/notify',
       headers := '{"Content-Type": "application/json"}'::jsonb,
       body := '{}'::jsonb
     ) $$
);
