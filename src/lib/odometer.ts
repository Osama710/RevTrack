import type { FuelEntry, LogEntry, Reading } from "@/types/db";

export interface Point {
  date: string; // YYYY-MM-DD
  km: number;
}

export interface Velocity {
  /** Average km per day over the last 90 days, or null when there isn't enough data. */
  kmPerDay: number | null;
  /** Km driven since the start of this month, or null when there isn't enough data. */
  kmThisMonth: number | null;
}

const DAY = 86_400_000;
const parse = (d: string) => new Date(`${d}T00:00:00`).getTime();

/** Every dated odometer value we know for one vehicle: readings, service logs and fuel fills. */
export function pointsFor(
  vehicleId: string,
  logs: Pick<LogEntry, "vehicle_id" | "serviced_on" | "mileage">[],
  fuel: Pick<FuelEntry, "vehicle_id" | "filled_on" | "odometer">[],
  readings: Reading[]
): Point[] {
  return [
    ...readings.filter((r) => r.vehicle_id === vehicleId).map((r) => ({ date: r.read_on, km: r.reading })),
    ...logs.filter((l) => l.vehicle_id === vehicleId).map((l) => ({ date: l.serviced_on, km: l.mileage })),
    ...fuel.filter((f) => f.vehicle_id === vehicleId).map((f) => ({ date: f.filled_on, km: f.odometer })),
  ];
}

/** Works from any mix of odometer readings, service-log mileages and fuel fills. */
export function velocity(points: Point[], now = new Date()): Velocity {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date) || a.km - b.km);
  if (sorted.length < 2) return { kmPerDay: null, kmThisMonth: null };

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const last = sorted[sorted.length - 1];

  // Baseline for the 90-day window: the newest point on or before the window start, else the oldest point inside it.
  const windowStart = today - 90 * DAY;
  const before = [...sorted].reverse().find((p) => parse(p.date) <= windowStart);
  const first = before ?? sorted.find((p) => parse(p.date) > windowStart);
  let kmPerDay: number | null = null;
  if (first && first !== last) {
    const days = (parse(last.date) - parse(first.date)) / DAY;
    if (days >= 3 && last.km >= first.km) kmPerDay = (last.km - first.km) / days;
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const baseline =
    [...sorted].reverse().find((p) => parse(p.date) < monthStart) ?? sorted.find((p) => parse(p.date) >= monthStart);
  const kmThisMonth = baseline && baseline !== last && last.km >= baseline.km ? last.km - baseline.km : null;

  return { kmPerDay, kmThisMonth };
}
