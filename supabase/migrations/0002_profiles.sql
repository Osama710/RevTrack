-- Profiles: one row per user, created automatically at signup.

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  currency     text not null default 'Rs' check (currency in ('Rs', '$', '€', '£', 'AED', 'SAR')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on public.profiles from anon;

create policy "profiles: select own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: insert own" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Create the profile row whenever a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill users who signed up before this migration.
insert into public.profiles (id) select id from auth.users on conflict do nothing;
