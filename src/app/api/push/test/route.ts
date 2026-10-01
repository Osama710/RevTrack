import { pushConfigured, sendPush } from "@/lib/push";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!pushConfigured()) return Response.json({ error: "Push isn't set up yet. Add the VAPID keys in Vercel." }, { status: 503 });

  const { data: subs } = await supabase.from("push_subscriptions").select("endpoint, p256dh, auth");
  if (!subs?.length) return Response.json({ error: "Turn notifications on for this device first." }, { status: 400 });

  let sent = 0;
  for (const s of subs) {
    const r = await sendPush(s, { title: "RevTrack", body: "Notifications are working on this device.", url: "/notifications", tag: "test" });
    if (r === "ok") sent++;
    if (r === "gone") await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
  }
  return sent ? Response.json({ sent }) : Response.json({ error: "Couldn't deliver. Turn notifications off and on again." }, { status: 502 });
}
