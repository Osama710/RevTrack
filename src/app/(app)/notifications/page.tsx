import Link from "next/link";
import PushToggle from "@/components/PushToggle";
import { buildAlerts } from "@/lib/alerts";
import { requireUser } from "@/lib/auth";
import { DOC_COLS, FUEL_COLS, LOG_COLS, TASK_COLS, VEHICLE_COLS, type DocumentRow, type FuelEntry, type LogEntry, type Reading, type Task, type Vehicle } from "@/types/db";

export default async function NotificationsPage() {
  const { supabase } = await requireUser();
  const [v, l, f, r, t, d] = await Promise.all([
    supabase.from("vehicles").select(VEHICLE_COLS),
    supabase.from("maintenance_logs").select(LOG_COLS),
    supabase.from("fuel_entries").select(FUEL_COLS),
    supabase.from("odometer_readings").select("vehicle_id, reading, read_on"),
    supabase.from("tasks").select(TASK_COLS).eq("status", "pending"),
    supabase.from("documents").select(DOC_COLS),
  ]);
  const failed = v.error ?? l.error ?? f.error ?? t.error ?? d.error;
  if (failed) throw new Error(failed.message);

  const alerts = buildAlerts({
    vehicles: (v.data ?? []) as Vehicle[],
    logs: (l.data ?? []) as LogEntry[],
    fuel: (f.data ?? []) as FuelEntry[],
    readings: (r.data ?? []) as Reading[],
    tasks: (t.data ?? []) as Task[],
    docs: (d.data ?? []) as DocumentRow[],
  });

  return (
    <main className="relative mx-auto max-w-md px-5 pb-56 pt-[calc(env(safe-area-inset-top)+20px)]">
      <h1 className="font-display text-2xl font-semibold">Alerts</h1>
      <p className="mb-5 text-sm text-dim">Everything that needs your attention.</p>

      {alerts.length === 0 ? (
        <p className="rounded-2xl border border-line bg-obsidian-900 p-5 text-sm text-dim">All clear. Nothing is due or overdue.</p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.key}>
              <Link href={a.url} className={`block rounded-2xl border bg-obsidian-900 px-4 py-3.5 active:bg-obsidian-800 ${a.severity === "urgent" ? "border-redline/50" : "border-line"}`}>
                <span className={`text-xs font-semibold ${a.severity === "urgent" ? "text-redline" : "text-mint"}`}>{a.severity === "urgent" ? "Urgent" : "Coming up"}</span>
                <span className="mt-0.5 block font-semibold">{a.title}</span>
                <span className="block text-sm text-dim">{a.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <PushToggle publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} />
      </div>
    </main>
  );
}
