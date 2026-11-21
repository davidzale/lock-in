-- LOCK IN: Google Calendar tokens. Only the server (Edge Function, service role) can access this table.
create table if not exists public.google_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token text not null,
  updated_at timestamptz not null default now()
);
alter table public.google_tokens enable row level security;
-- no policies on purpose: clients (anon/authenticated) cannot read or write it
revoke all on table public.google_tokens from anon, authenticated;
grant select, insert, update, delete on table public.google_tokens to service_role;
grant select, insert, update on table public.app_state to service_role;
