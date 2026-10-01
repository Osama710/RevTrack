import type { Vehicle } from "@/types/db";
import { VEHICLE_COLS } from "@/types/db";
import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

const VEHICLE_COLS_BASE = "id, kind, name, make, model, year, current_mileage";

const defaults = (): Pick<Vehicle, "plate" | "engine_no" | "chassis_no" | "color" | "cplc_status" | "cplc_checked_on"> => ({
  plate: null,
  engine_no: null,
  chassis_no: null,
  color: null,
  cplc_status: "unverified",
  cplc_checked_on: null,
});

/** Full vehicle row when migrations are applied; falls back to base columns so the app still loads. */
export async function fetchVehicles(supabase: Client): Promise<Vehicle[]> {
  const full = await supabase.from("vehicles").select(VEHICLE_COLS).order("created_at");
  if (!full.error) return (full.data ?? []) as Vehicle[];

  const base = await supabase.from("vehicles").select(VEHICLE_COLS_BASE).order("created_at");
  if (base.error) return [];

  return (base.data ?? []).map((v) => ({ ...defaults(), ...v })) as Vehicle[];
}
