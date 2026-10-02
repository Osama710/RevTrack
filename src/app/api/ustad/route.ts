import { AiUnavailable, askUstad, type ChatTurn } from "@/lib/ai";
import { UUID_RE } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { VEHICLE_COLS } from "@/types/db";

export const runtime = "nodejs";
export const maxDuration = 30;

const HOURLY_LIMIT = 30;
const err = (message: string, status: number) => Response.json({ error: message }, { status });

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err("Please sign in again.", 401);

  let body: { message?: unknown; vehicleId?: unknown };
  try {
    body = await req.json();
  } catch {
    return err("Bad request.", 400);
  }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 1000) return err("Write a message of up to 1000 characters.", 400);
  const vehicleId = typeof body.vehicleId === "string" && UUID_RE.test(body.vehicleId) ? body.vehicleId : null;

  // Per-user hourly cap keeps the free AI quota from being burned by one account.
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count, error: countErr } = await supabase
    .from("ai_assistant_logs")
    .select("id", { count: "exact", head: true })
    .eq("role", "user")
    .gte("created_at", since);
  if (!countErr && (count ?? 0) >= HOURLY_LIMIT) return err("You've reached the hourly limit. Try again in a little while.", 429);

  let vehicleContext: string | undefined;
  if (vehicleId) {
    const [v, l] = await Promise.all([
      supabase.from("vehicles").select(VEHICLE_COLS).eq("id", vehicleId).maybeSingle(),
      supabase.from("maintenance_logs").select("service_type, serviced_on, mileage").eq("vehicle_id", vehicleId).order("serviced_on", { ascending: false }).limit(5),
    ]);
    if (v.data) {
      const recent = (l.data ?? []).map((x: { service_type: string; serviced_on: string; mileage: number }) => `${x.service_type} (${x.serviced_on}, ${x.mileage} km)`).join("; ");
      vehicleContext = `${v.data.kind === "bike" ? "Bike" : "Car"}: ${[v.data.year, v.data.make, v.data.model].filter(Boolean).join(" ") || v.data.name}. Odometer: ${v.data.current_mileage} km. Recent services: ${recent || "none logged"}.`;
    }
  }

  const { data: past } = await supabase
    .from("ai_assistant_logs")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);
  const history = ((past ?? []) as ChatTurn[]).reverse();

  await supabase.from("ai_assistant_logs").insert({ vehicle_id: vehicleId, role: "user", content: message });

  try {
    const reply = await askUstad({ history, message, vehicleContext });
    await supabase.from("ai_assistant_logs").insert({ vehicle_id: vehicleId, role: "assistant", content: reply.slice(0, 6000) });
    return Response.json({ reply });
  } catch (e) {
    return err(e instanceof AiUnavailable ? e.message : "Ustad couldn't answer. Try again shortly.", e instanceof AiUnavailable ? 503 : 500);
  }
}
