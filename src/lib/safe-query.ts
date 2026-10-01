import type { FuelEntry, LogEntry, Task } from "@/types/db";
import { FUEL_COLS, LOG_COLS, TASK_COLS } from "@/types/db";
import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

const LOG_COLS_BASE = "id, vehicle_id, service_type, serviced_on, cost, mileage, notes";
const TASK_COLS_BASE = "id, vehicle_id, title, service_type, due_date, target_mileage, notes";

export async function fetchLogs(supabase: Client, limit = 400): Promise<LogEntry[]> {
  const full = await supabase.from("maintenance_logs").select(LOG_COLS).order("serviced_on", { ascending: false }).limit(limit);
  if (!full.error) return (full.data ?? []) as LogEntry[];

  const base = await supabase.from("maintenance_logs").select(LOG_COLS_BASE).order("serviced_on", { ascending: false }).limit(limit);
  if (base.error) return [];

  return (base.data ?? []).map((row) => ({ ...row, expense_type: "maintenance" as const, notes: row.notes ?? null })) as LogEntry[];
}

export async function fetchFuel(supabase: Client, limit = 400): Promise<FuelEntry[]> {
  const { data, error } = await supabase.from("fuel_entries").select(FUEL_COLS).order("filled_on", { ascending: false }).limit(limit);
  if (error) return [];
  return (data ?? []) as FuelEntry[];
}

export async function fetchPendingTasks(supabase: Client): Promise<Task[]> {
  const full = await supabase
    .from("tasks")
    .select(TASK_COLS)
    .eq("status", "pending")
    .order("due_date", { ascending: true, nullsFirst: false });
  if (!full.error) return (full.data ?? []) as Task[];

  const base = await supabase
    .from("tasks")
    .select(TASK_COLS_BASE)
    .eq("status", "pending")
    .order("due_date", { ascending: true, nullsFirst: false });
  if (base.error) return [];

  return (base.data ?? []).map((row) => ({ ...row, checklist: null })) as Task[];
}
