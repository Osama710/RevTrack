import NotificationsClient from "@/components/NotificationsClient";
import { buildAlerts } from "@/lib/alerts";
import { requireUser } from "@/lib/auth";
import { DOC_COLS, FUEL_COLS, LOG_COLS, TASK_COLS, VEHICLE_COLS, type DocumentRow, type FuelEntry, type LogEntry, type Reading, type Task, type Vehicle } from "@/types/db";

export default async function NotificationsPage() {
  const { supabase } = await requireUser();
  const [v, l, f, r, t, d] = await Promise.all([
    supabase.from("vehicles").select(VEHICLE_COLS),
    supabase.from("maintenance_logs").select(LOG_COLS),
    supabase.from("fuel_entries").select(FUEL_COLS),
    supabase.from("odometer_readings").select("vehicle_id, reading, read_on"),
    supabase.from("tasks").select(TASK_COLS).eq("status", "pending"),
    supabase.from("documents").select(DOC_COLS),
  ]);
  const failed = v.error ?? l.error ?? f.error ?? t.error ?? d.error;
  if (failed) throw new Error(failed.message);

  const alerts = buildAlerts({
    vehicles: (v.data ?? []) as Vehicle[],
    logs: (l.data ?? []) as LogEntry[],
    fuel: (f.data ?? []) as FuelEntry[],
    readings: (r.data ?? []) as Reading[],
    tasks: (t.data ?? []) as Task[],
    docs: (d.data ?? []) as DocumentRow[],
  });

  return <NotificationsClient alerts={alerts} publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} />;
}
