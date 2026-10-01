import LedgerClient from "@/components/LedgerClient";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { fetchFuel, fetchLogs } from "@/lib/safe-query";
import type { Reading } from "@/types/db";

export default async function LedgerPage() {
  const { supabase, user } = await requireUser();
  const [logs, fuel, readings, profile] = await Promise.all([
    fetchLogs(supabase, 1000),
    fetchFuel(supabase, 1000),
    supabase.from("odometer_readings").select("vehicle_id, reading, read_on").order("read_on", { ascending: false }).limit(500),
    getProfile(supabase, user.id),
  ]);

  return (
    <LedgerClient
      logs={logs}
      fuel={fuel}
      readings={(readings.data ?? []) as Reading[]}
      currency={profile.currency}
    />
  );
}
