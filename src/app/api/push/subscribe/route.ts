import { createClient } from "@/lib/supabase/server";

type Body = { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
const bad = (msg: string, status = 400) => Response.json({ error: msg }, { status });

async function parse(req: Request): Promise<Body | null> {
  try {
    return (await req.json()) as Body;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return bad("Unauthorized", 401);

  const b = await parse(req);
  const endpoint = b?.endpoint, p256dh = b?.keys?.p256dh, auth = b?.keys?.auth;
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://") || endpoint.length > 1000) return bad("Invalid subscription");
  if (typeof p256dh !== "string" || p256dh.length > 200 || typeof auth !== "string" || auth.length > 100) return bad("Invalid subscription");

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ user_id: user.id, endpoint, p256dh, auth, user_agent: (req.headers.get("user-agent") ?? "").slice(0, 300) }, { onConflict: "user_id,endpoint" });
  if (error) return bad("Couldn't save the subscription", 500);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return bad("Unauthorized", 401);

  const b = await parse(req);
  if (typeof b?.endpoint !== "string") return bad("Invalid request");
  await supabase.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", b.endpoint);
  return Response.json({ ok: true });
}
