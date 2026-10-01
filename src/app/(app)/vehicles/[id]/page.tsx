import Link from "next/link";
import { notFound } from "next/navigation";
import { FormPage } from "@/components/ui/form";
import { requireUser } from "@/lib/auth";
import { UUID_RE } from "@/lib/form";
import { km, shortDate } from "@/lib/format";
import { velocity } from "@/lib/odometer";
import { getProfile } from "@/lib/profile";
import SosShare from "@/components/SosShare";
import { VEHICLE_COLS, type LogEntry, type Task } from "@/types/db";

const row = "flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-line px-4 py-3 transition-colors active:bg-obsidian-800";

export default async function VehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const { supabase } = await requireUser();

  const [v, l, t, profile, readings] = await Promise.all([
    supabase.from("vehicles").select(VEHICLE_COLS).eq("id", id).maybeSingle(),
    supabase.from("maintenance_logs").select("id, vehicle_id, service_type, serviced_on, cost, mileage, notes, expense_type").eq("vehicle_id", id).order("serviced_on", { ascending: false }).limit(500),
    supabase.from("tasks").select("id, vehicle_id, title, service_type, due_date, target_mileage, notes").eq("vehicle_id", id).eq("status", "pending").order("due_date", { ascending: true, nullsFirst: false }),
    getProfile(supabase),
    supabase.from("odometer_readings").select("reading, read_on").eq("vehicle_id", id).order("read_on", { ascending: false }).limit(500),
  ]);
  if (!v.data) notFound();

  const vehicle = v.data;
  const logs = (l.data ?? []) as LogEntry[];
  const tasks = (t.data ?? []) as Task[];
  const { kmPerDay, kmThisMonth } = velocity([
    ...(readings.data ?? []).map((r: { reading: number; read_on: string }) => ({ date: r.read_on, km: r.reading })),
    ...logs.map((x) => ({ date: x.serviced_on, km: x.mileage })),
  ]);
  const spent = logs.reduce((sum, x) => sum + Number(x.cost), 0);
  const subtitle = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");

  return (
    <FormPage title={vehicle.name}>
      {subtitle && <p className="-mt-4 mb-4 text-sm text-dim">{subtitle}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div className="cut p-4">
          <p className="text-sm text-dim">Odometer</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums">{km(vehicle.current_mileage)} <span className="text-base font-medium text-dim">km</span></p>
        </div>
        <div className="cut p-4">
          <p className="text-sm text-dim">Total spent</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums">{profile.currency} {spent.toLocaleString("en-US")}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="cut p-4">
          <p className="text-sm text-dim">Driven this month</p>
          <p className="mt-1 font-display text-xl font-bold tabular-nums">{kmThisMonth === null ? "Not enough data" : `${km(kmThisMonth)} km`}</p>
        </div>
        <div className="cut p-4">
          <p className="text-sm text-dim">Average per day</p>
          <p className="mt-1 font-display text-xl font-bold tabular-nums">{kmPerDay === null ? "Not enough data" : `${km(kmPerDay)} km`}</p>
        </div>
      </div>
      <Link href={`/vehicles/${id}/odometer`} className="mt-3 flex h-12 items-center justify-center rounded-full border border-mint/50 font-display text-sm font-semibold text-mint active:scale-[0.98]">
        Update odometer
      </Link>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Link href={`/logs/new?vehicle=${id}`} className="grid h-12 place-items-center rounded-full bg-mint font-display text-sm font-semibold text-obsidian-950 active:scale-95">Log service</Link>
        <Link href={`/tasks/new?vehicle=${id}`} className="grid h-12 place-items-center rounded-full border border-line font-display text-sm font-semibold active:scale-95">Add task</Link>
        <Link href={`/vehicles/${id}/edit`} className="grid h-12 place-items-center rounded-full border border-line font-display text-sm font-semibold active:scale-95">Edit</Link>
      </div>

      <SosShare vehicle={vehicle} />

      <h2 className="mt-10 font-display text-lg font-semibold">To do</h2>
      {tasks.length === 0 ? (
        <p className="mt-2 text-sm text-dim">Nothing pending.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {tasks.map((x) => (
            <li key={x.id}>
              <Link href={`/tasks/${x.id}/edit`} className={row}>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{x.title}</span>
                  <span className="block text-xs text-dim">{x.due_date ? `Due ${shortDate(x.due_date)}` : "No date"}</span>
                </span>
                <span className="text-sm text-dim">Edit</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 font-display text-lg font-semibold">Service history</h2>
      {logs.length === 0 ? (
        <p className="mt-2 text-sm text-dim">No services logged yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {logs.map((x) => (
            <li key={x.id}>
              <Link href={`/logs/${x.id}/edit`} className={row}>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{x.service_type}</span>
                  <span className="block text-xs text-dim">{shortDate(x.serviced_on)} · {km(x.mileage)} km</span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-dim">{profile.currency} {Number(x.cost).toLocaleString("en-US")}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </FormPage>
  );
}
