import { createClient } from "@/lib/supabase/server";
import { DOC_COLS, VEHICLE_COLS } from "@/types/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [vehicles, documents] = await Promise.all([
    supabase.from("vehicles").select(VEHICLE_COLS).order("created_at"),
    supabase.from("documents").select(DOC_COLS).order("expires_on", { ascending: false, nullsFirst: false }),
  ]);
  if (vehicles.error || documents.error) return Response.json({ error: "Couldn't load your papers." }, { status: 500 });

  return Response.json({ vehicles: vehicles.data, documents: documents.data }, { headers: { "Cache-Control": "no-store" } });
}
