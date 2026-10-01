import DashboardClient from "@/components/dashboard/DashboardClient";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { fetchFuel, fetchLogs, fetchPendingTasks } from "@/lib/safe-query";
import type { Reading } from "@/types/db";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();

  const [logs, fuel, tasks, readings, docs, profile] = await Promise.all([
    fetchLogs(supabase),
    fetchFuel(supabase),
    fetchPendingTasks(supabase),
    supabase.from("odometer_readings").select("vehicle_id, reading, read_on").order("read_on", { ascending: false }).limit(400),
    supabase.from("documents").select("doc_type, expires_on").eq("doc_type", "driving_license").not("expires_on", "is", null),
    getProfile(supabase, user.id),
  ]);

  const expiries = ((docs.data ?? []) as { expires_on: string }[]).map((d) => d.expires_on).sort();

  return (
    <DashboardClient
      logs={logs}
      fuel={fuel}
      tasks={tasks}
      readings={(readings.data ?? []) as Reading[]}
      licenseExpiry={expiries[0] ?? null}
      currency={profile.currency}
    />
  );
}
