-- RevTrack garage suite: vehicle identity, expense types, fuel log, documents wallet,
-- push subscriptions, and AI Ustad chat history. Run after 0001, 0002 and 0003.

-- ───────────── helper: does the caller own this vehicle? (SECURITY INVOKER, so RLS still applies) ─────────────
create or replace function public.owns_vehicle(p_vehicle_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.vehicles v
    where v.id = p_vehicle_id and v.user_id = (select auth.uid())
  );
$$;

-- ───────────── vehicles: identity + CPLC status ─────────────
alter table public.vehicles
  add column if not exists plate           text check (char_length(plate) <= 20),
  add column if not exists engine_no       text check (char_length(engine_no) <= 40),
  add column if not exists chassis_no      text check (char_length(chassis_no) <= 40),
  add column if not exists color           text check (char_length(color) <= 30),
  add column if not exists cplc_status     text not null default 'unverified'
    check (cplc_status in ('unverified', 'clear', 'stolen_reported')),
  add column if not exists cplc_checked_on date;

-- ───────────── logs: expense type; tasks: preset checklist tag ─────────────
alter table public.maintenance_logs
  add column if not exists expense_type text not null default 'maintenance'
    check (expense_type in ('maintenance', 'tuning', 'parts'));

alter table public.tasks
  add column if not exists checklist text check (checklist in ('monsoon', 'mechanic'));

-- ───────────── fuel_entries ─────────────
create table if not exists public.fuel_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  vehicle_id  uuid not null references public.vehicles(id) on delete cascade,
  filled_on   date not null default current_date,
  odometer    int  not null check (odometer >= 0),
  liters      numeric(8,2)  not null check (liters > 0 and liters <= 500),
  total_cost  numeric(12,2) not null check (total_cost >= 0),
  station     text not null check (char_length(station) between 1 and 40),
  area        text check (char_length(area) <= 60),
  full_tank   boolean not null default true,
  notes       text check (char_length(notes) <= 500),
  created_at  timestamptz not null default now()
);
create index if not exists fuel_vehicle_date_idx on public.fuel_entries (vehicle_id, filled_on desc);
create index if not exists fuel_user_idx on public.fuel_entries (user_id);

-- ───────────── documents (wallet) ─────────────
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  vehicle_id  uuid references public.vehicles(id) on delete cascade,
  doc_type    text not null check (doc_type in
                ('driving_license', 'registration', 'token_tax', 'cplc', 'insurance', 'fitness', 'other')),
  title       text not null check (char_length(title) between 1 and 80),
  doc_number  text check (char_length(doc_number) <= 60),
  issued_on   date,
  expires_on  date,
  image_path  text check (char_length(image_path) <= 200),
  notes       text check (char_length(notes) <= 500),
  created_at  timestamptz not null default now()
);
create index if not exists documents_user_idx on public.documents (user_id);
create index if not exists documents_vehicle_idx on public.documents (vehicle_id);

-- ───────────── push_subscriptions ─────────────
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint    text not null check (char_length(endpoint) <= 1000),
  p256dh      text not null check (char_length(p256dh) <= 200),
  auth        text not null check (char_length(auth) <= 100),
  user_agent  text check (char_length(user_agent) <= 300),
  created_at  timestamptz not null default now(),
  unique (user_id, endpoint)
);
create index if not exists push_user_idx on public.push_subscriptions (user_id);

-- Which reminders were already sent, so the daily job never repeats itself. Service role only.
create table if not exists public.push_log (
  user_id    uuid not null references auth.users(id) on delete cascade,
  dedupe_key text not null,
  sent_at    timestamptz not null default now(),
  primary key (user_id, dedupe_key)
);

-- ───────────── ai_assistant_logs ─────────────
create table if not exists public.ai_assistant_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  vehicle_id  uuid references public.vehicles(id) on delete set null,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null check (char_length(content) between 1 and 6000),
  created_at  timestamptz not null default now()
);
create index if not exists ai_logs_user_time_idx on public.ai_assistant_logs (user_id, created_at desc);

-- ───────────── RLS: every table, bound to auth.uid() ─────────────
alter table public.fuel_entries       enable row level security;
alter table public.documents          enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.push_log           enable row level security;
alter table public.ai_assistant_logs  enable row level security;

revoke all on public.fuel_entries, public.documents, public.push_subscriptions,
              public.ai_assistant_logs from anon;
revoke all on public.push_log from anon, authenticated;   -- no policies: service role only

-- fuel_entries
create policy "fuel: select own" on public.fuel_entries
  for select to authenticated using (user_id = (select auth.uid()));
create policy "fuel: insert own" on public.fuel_entries
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.owns_vehicle(vehicle_id));
create policy "fuel: update own" on public.fuel_entries
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.owns_vehicle(vehicle_id));
create policy "fuel: delete own" on public.fuel_entries
  for delete to authenticated using (user_id = (select auth.uid()));

-- documents (the image path must live under the caller's own folder)
create policy "documents: select own" on public.documents
  for select to authenticated using (user_id = (select auth.uid()));
create policy "documents: insert own" on public.documents
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (vehicle_id is null or public.owns_vehicle(vehicle_id))
    and (image_path is null or starts_with(image_path, (select auth.uid())::text || '/'))
  );
create policy "documents: update own" on public.documents
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (vehicle_id is null or public.owns_vehicle(vehicle_id))
    and (image_path is null or starts_with(image_path, (select auth.uid())::text || '/'))
  );
create policy "documents: delete own" on public.documents
  for delete to authenticated using (user_id = (select auth.uid()));

-- push_subscriptions
create policy "push: select own" on public.push_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "push: insert own" on public.push_subscriptions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "push: update own" on public.push_subscriptions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "push: delete own" on public.push_subscriptions
  for delete to authenticated using (user_id = (select auth.uid()));

-- ai_assistant_logs
create policy "ai: select own" on public.ai_assistant_logs
  for select to authenticated using (user_id = (select auth.uid()));
create policy "ai: insert own" on public.ai_assistant_logs
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (vehicle_id is null or public.owns_vehicle(vehicle_id)));
create policy "ai: delete own" on public.ai_assistant_logs
  for delete to authenticated using (user_id = (select auth.uid()));

-- ───────────── private storage bucket for document photos ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Files live at <user id>/<file>. Nobody can read or write outside their own folder.
create policy "documents storage: select own" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "documents storage: insert own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "documents storage: update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "documents storage: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
