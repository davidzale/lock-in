-- LOCK IN: Siri / Shortcuts. Run once in Supabase → SQL Editor (empty tab).
create table if not exists public.quick_tokens (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.quick_tokens enable row level security;
create policy "own tokens select" on public.quick_tokens for select using (auth.uid() = user_id);
create policy "own tokens insert" on public.quick_tokens for insert with check (auth.uid() = user_id);
create policy "own tokens delete" on public.quick_tokens for delete using (auth.uid() = user_id);
grant select, insert, delete on table public.quick_tokens to authenticated;
grant select on table public.quick_tokens to service_role;

create table if not exists public.quick_inbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now(),
  applied_at timestamptz
);
alter table public.quick_inbox enable row level security;
create policy "own inbox select" on public.quick_inbox for select using (auth.uid() = user_id);
create policy "own inbox update" on public.quick_inbox for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, update on table public.quick_inbox to authenticated;
grant insert on table public.quick_inbox to service_role;
