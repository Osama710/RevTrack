import DashboardClient from "@/components/dashboard/DashboardClient";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { FUEL_COLS, LOG_COLS, TASK_COLS, type FuelEntry, type LogEntry, type Reading, type Task } from "@/types/db";

export default async function DashboardPage() {
  const { supabase } = await requireUser();

  // RLS scopes every query to auth.uid(); no manual user_id filter needed.
  const [logs, fuel, tasks, readings, docs, profile] = await Promise.all([
    supabase.from("maintenance_logs").select(LOG_COLS).order("serviced_on", { ascending: false }).limit(400),
    supabase.from("fuel_entries").select(FUEL_COLS).order("filled_on", { ascending: false }).limit(400),
    supabase.from("tasks").select(TASK_COLS).eq("status", "pending").order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("odometer_readings").select("vehicle_id, reading, read_on").order("read_on", { ascending: false }).limit(400),
    supabase.from("documents").select("doc_type, expires_on").eq("doc_type", "driving_license").not("expires_on", "is", null),
    getProfile(supabase),
  ]);

  const failed = logs.error ?? fuel.error ?? tasks.error;
  if (failed) throw new Error(failed.message);

  const expiries = ((docs.data ?? []) as { expires_on: string }[]).map((d) => d.expires_on).sort();

  return (
    <DashboardClient
      logs={(logs.data ?? []) as LogEntry[]}
      fuel={(fuel.data ?? []) as FuelEntry[]}
      tasks={(tasks.data ?? []) as Task[]}
      readings={(readings.data ?? []) as Reading[]}
      licenseExpiry={expiries[0] ?? null}
      currency={profile.currency}
    />
  );
}
