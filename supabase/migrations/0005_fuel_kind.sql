-- Petrol (litres) vs LPG (kg stored in liters column for quantity)
alter table public.fuel_entries
  add column if not exists fuel_kind text not null default 'petrol'
  check (fuel_kind in ('petrol', 'lpg'));
