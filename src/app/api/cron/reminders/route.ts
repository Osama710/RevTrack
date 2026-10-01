import { timingSafeEqual } from "node:crypto";
import { buildAlerts } from "@/lib/alerts";
import { pushConfigured, sendPush } from "@/lib/push";
import { createAdminClient } from "@/lib/supabase/admin";
import { DOC_COLS, FUEL_COLS, LOG_COLS, TASK_COLS, VEHICLE_COLS, type DocumentRow, type FuelEntry, type LogEntry, type Reading, type Task, type Vehicle } from "@/types/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_USERS = 500;
const MAX_PER_USER = 3;

function authorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const a = Buffer.from(req.headers.get("authorization") ?? "");
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Called daily by Vercel Cron. Sends each user their newest urgent or upcoming reminders, once each.
export async function GET(req: Request) {
  if (!authorised(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!pushConfigured()) return Response.json({ error: "VAPID keys are missing" }, { status: 503 });

  const admin = createAdminClient();
  const { data: subs, error } = await admin.from("push_subscriptions").select("user_id, endpoint, p256dh, auth");
  if (error) return Response.json({ error: "Couldn't read subscriptions" }, { status: 500 });

  const byUser = new Map<string, { endpoint: string; p256dh: string; auth: string }[]>();
  for (const s of subs ?? []) byUser.set(s.user_id, [...(byUser.get(s.user_id) ?? []), s]);

  let sent = 0;
  for (const [uid, userSubs] of [...byUser].slice(0, MAX_USERS)) {
    const [v, l, f, r, t, d] = await Promise.all([
      admin.from("vehicles").select(VEHICLE_COLS).eq("user_id", uid),
      admin.from("maintenance_logs").select(LOG_COLS).eq("user_id", uid),
      admin.from("fuel_entries").select(FUEL_COLS).eq("user_id", uid),
      admin.from("odometer_readings").select("vehicle_id, reading, read_on").eq("user_id", uid),
      admin.from("tasks").select(TASK_COLS).eq("user_id", uid).eq("status", "pending"),
      admin.from("documents").select(DOC_COLS).eq("user_id", uid),
    ]);

    const alerts = buildAlerts({
      vehicles: (v.data ?? []) as Vehicle[],
      logs: (l.data ?? []) as LogEntry[],
      fuel: (f.data ?? []) as FuelEntry[],
      readings: (r.data ?? []) as Reading[],
      tasks: (t.data ?? []) as Task[],
      docs: (d.data ?? []) as DocumentRow[],
    });
    if (!alerts.length) continue;

    const { data: done } = await admin.from("push_log").select("dedupe_key").eq("user_id", uid).in("dedupe_key", alerts.map((a) => a.key));
    const already = new Set((done ?? []).map((x: { dedupe_key: string }) => x.dedupe_key));

    for (const a of alerts.filter((x) => !already.has(x.key)).slice(0, MAX_PER_USER)) {
      let delivered = false;
      for (const s of userSubs) {
        const res = await sendPush(s, { title: a.title, body: a.body, url: a.url, tag: a.key.slice(0, 60) });
        if (res === "ok") delivered = true;
        if (res === "gone") await admin.from("push_subscriptions").delete().eq("user_id", uid).eq("endpoint", s.endpoint);
      }
      if (delivered) {
        sent++;
        await admin.from("push_log").upsert({ user_id: uid, dedupe_key: a.key });
      }
    }
  }
  return Response.json({ users: byUser.size, sent });
}
