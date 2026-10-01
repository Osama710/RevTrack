import LedgerClient from "@/components/LedgerClient";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { FUEL_COLS, LOG_COLS, type FuelEntry, type LogEntry, type Reading } from "@/types/db";

export default async function LedgerPage() {
  const { supabase } = await requireUser();
  const [logs, fuel, readings, profile] = await Promise.all([
    supabase.from("maintenance_logs").select(LOG_COLS).order("serviced_on", { ascending: false }).limit(1000),
    supabase.from("fuel_entries").select(FUEL_COLS).order("filled_on", { ascending: false }).limit(1000),
    supabase.from("odometer_readings").select("vehicle_id, reading, read_on").order("read_on", { ascending: false }).limit(500),
    getProfile(supabase),
  ]);
  const failed = logs.error ?? fuel.error;
  if (failed) throw new Error(failed.message);

  return (
    <LedgerClient
      logs={(logs.data ?? []) as LogEntry[]}
      fuel={(fuel.data ?? []) as FuelEntry[]}
      readings={(readings.data ?? []) as Reading[]}
      currency={profile.currency}
    />
  );
}
