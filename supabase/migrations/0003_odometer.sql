-- Odometer readings: a lightweight history of "I'm at X km today" so RevTrack can work out km driven.

create table public.odometer_readings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  reading    int  not null check (reading >= 0),
  read_on    date not null default current_date,
  created_at timestamptz not null default now()
);

create index odometer_vehicle_date_idx on public.odometer_readings (vehicle_id, read_on desc);
create index odometer_user_idx on public.odometer_readings (user_id);

alter table public.odometer_readings enable row level security;
revoke all on public.odometer_readings from anon;

create policy "odometer: select own" on public.odometer_readings
  for select to authenticated using (user_id = (select auth.uid()));

create policy "odometer: insert own" on public.odometer_readings
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and v.user_id = (select auth.uid())
    )
  );

create policy "odometer: delete own" on public.odometer_readings
  for delete to authenticated using (user_id = (select auth.uid()));
