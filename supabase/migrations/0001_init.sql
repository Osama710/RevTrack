-- RevTrack initial schema
-- Every table is owned by a user (user_id) and locked down with RLS bound to auth.uid().

create extension if not exists "pgcrypto";

-- ───────────────────────── tables ─────────────────────────

create table public.vehicles (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind             text not null check (kind in ('car', 'bike')),
  name             text not null check (char_length(name) between 1 and 60),
  make             text check (char_length(make) <= 60),
  model            text check (char_length(model) <= 60),
  year             int  check (year between 1900 and 2100),
  current_mileage  int  not null default 0 check (current_mileage >= 0),
  created_at       timestamptz not null default now()
);

create table public.maintenance_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  vehicle_id   uuid not null references public.vehicles(id) on delete cascade,
  service_type text not null check (char_length(service_type) between 1 and 60),
  serviced_on  date not null default current_date,
  cost         numeric(12,2) not null default 0 check (cost >= 0),
  mileage      int  not null check (mileage >= 0),
  notes        text check (char_length(notes) <= 1000),
  created_at   timestamptz not null default now()
);

create table public.tasks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  vehicle_id     uuid not null references public.vehicles(id) on delete cascade,
  title          text not null check (char_length(title) between 1 and 120),
  service_type   text not null check (char_length(service_type) between 1 and 60),
  due_date       date,
  target_mileage int check (target_mileage >= 0),
  notes          text check (char_length(notes) <= 1000),
  status         text not null default 'pending' check (status in ('pending', 'done')),
  completed_at   timestamptz,
  log_id         uuid references public.maintenance_logs(id) on delete set null,
  created_at     timestamptz not null default now()
);

create index vehicles_user_idx on public.vehicles (user_id);
create index logs_vehicle_date_idx on public.maintenance_logs (vehicle_id, serviced_on desc);
create index logs_user_idx on public.maintenance_logs (user_id);
create index tasks_vehicle_status_idx on public.tasks (vehicle_id, status);
create index tasks_user_idx on public.tasks (user_id);

-- ───────────────────────── RLS ─────────────────────────

alter table public.vehicles         enable row level security;
alter table public.maintenance_logs enable row level security;
alter table public.tasks            enable row level security;

-- No access at all for the anon role.
revoke all on public.vehicles, public.maintenance_logs, public.tasks from anon;

-- vehicles
create policy "vehicles: select own" on public.vehicles
  for select to authenticated using (user_id = (select auth.uid()));
create policy "vehicles: insert own" on public.vehicles
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "vehicles: update own" on public.vehicles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "vehicles: delete own" on public.vehicles
  for delete to authenticated using (user_id = (select auth.uid()));

-- maintenance_logs (also proves the referenced vehicle belongs to the caller)
create policy "logs: select own" on public.maintenance_logs
  for select to authenticated using (user_id = (select auth.uid()));
create policy "logs: insert own" on public.maintenance_logs
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and v.user_id = (select auth.uid())
    )
  );
create policy "logs: update own" on public.maintenance_logs
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and v.user_id = (select auth.uid())
    )
  );
create policy "logs: delete own" on public.maintenance_logs
  for delete to authenticated using (user_id = (select auth.uid()));

-- tasks
create policy "tasks: select own" on public.tasks
  for select to authenticated using (user_id = (select auth.uid()));
create policy "tasks: insert own" on public.tasks
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and v.user_id = (select auth.uid())
    )
  );
create policy "tasks: update own" on public.tasks
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and v.user_id = (select auth.uid())
    )
  );
create policy "tasks: delete own" on public.tasks
  for delete to authenticated using (user_id = (select auth.uid()));

-- ───────────────────── complete a task atomically ─────────────────────
-- SECURITY INVOKER: runs as the caller, so every statement below is still filtered by RLS.
-- Archives the task into maintenance_logs, links them, and bumps the odometer, all or nothing.

create or replace function public.complete_task(
  p_task_id uuid,
  p_mileage int,
  p_cost    numeric default 0,
  p_notes   text    default null
)
returns public.maintenance_logs
language plpgsql
security invoker
set search_path = public
as $$
declare
  t public.tasks;
  l public.maintenance_logs;
begin
  select * into t
  from public.tasks
  where id = p_task_id and status = 'pending'
  for update;

  if not found then
    raise exception 'Task not found or already completed' using errcode = 'P0002';
  end if;

  insert into public.maintenance_logs (user_id, vehicle_id, service_type, serviced_on, cost, mileage, notes)
  values (auth.uid(), t.vehicle_id, t.service_type, current_date, p_cost, p_mileage, coalesce(p_notes, t.notes))
  returning * into l;

  update public.tasks
     set status = 'done', completed_at = now(), log_id = l.id
   where id = t.id;

  update public.vehicles
     set current_mileage = greatest(current_mileage, p_mileage)
   where id = t.vehicle_id;

  return l;
end;
$$;

revoke all on function public.complete_task(uuid, int, numeric, text) from public, anon;
grant execute on function public.complete_task(uuid, int, numeric, text) to authenticated;
