import type { LogEntry, Vehicle, VehicleKind } from "@/types/db";

export type Status = "overdue" | "soon" | "ok";

export interface Prediction {
  serviceType: string;
  dueMileage: number;
  dueDate: string; // YYYY-MM-DD
  kmLeft: number;
  daysLeft: number;
  /** Days until the km limit at the driver's recent pace, or null when the pace is unknown. */
  etaDays: number | null;
  intervalKm: number;
  /** 0 = just serviced, 1 = due now, above 1 = overdue */
  progress: number;
  /** 100 = just serviced, 0 = due now */
  remainingPct: number;
  status: Status;
  basis: "history" | "default";
  /** True when the interval was shortened for rough Karachi roads. */
  accelerated: boolean;
}

interface Interval {
  km: number;
  days: number;
}

/** Used until a service type has two or more logs to learn from. Keys are lower-case. */
const DEFAULTS: Record<VehicleKind, Record<string, Interval>> = {
  car: {
    "oil change": { km: 5000, days: 180 },
    "brake pads": { km: 30000, days: 730 },
    "tire rotation": { km: 10000, days: 180 },
    "air filter": { km: 15000, days: 365 },
    "wheel alignment": { km: 8000, days: 180 },
    "wheel balancing": { km: 8000, days: 180 },
    "suspension check": { km: 15000, days: 365 },
    battery: { km: 40000, days: 730 },
    coolant: { km: 40000, days: 730 },
  },
  bike: {
    "oil change": { km: 3000, days: 180 },
    "chain service": { km: 1000, days: 60 },
    "brake pads": { km: 15000, days: 540 },
    "air filter": { km: 8000, days: 365 },
    "wheel alignment": { km: 6000, days: 180 },
    "suspension check": { km: 10000, days: 365 },
    battery: { km: 25000, days: 730 },
  },
};
const FALLBACK: Interval = { km: 5000, days: 180 };

/** Potholes, construction and speed breakers wear these faster, so their intervals are shortened. */
const ROUGH_ROAD = new Set(["wheel alignment", "wheel balancing", "suspension check"]);
export const ROUGH_ROAD_FACTOR = 0.6;

/** Checklist entries are not parts that wear out, so they never get a prediction. */
const EXCLUDED = new Set(["monsoon check", "mechanic check"]);

const DAY = 86_400_000;
const mean = (n: number[]) => n.reduce((a, b) => a + b, 0) / n.length;
const parse = (d: string) => new Date(`${d}T00:00:00`);
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);
const RANK: Record<Status, number> = { overdue: 0, soon: 1, ok: 2 };

/**
 * For every service type with at least one log, project the next due mileage and date from the
 * average gap between past services. `kmPerDay` (the driver's recent pace) turns the km limit into a day estimate.
 */
export function predictNext(
  vehicle: Vehicle,
  logs: Pick<LogEntry, "service_type" | "serviced_on" | "mileage">[],
  now = new Date(),
  kmPerDay: number | null = null
): Prediction[] {
  const byType = new Map<string, typeof logs>();
  for (const log of logs) {
    const key = log.service_type.trim().toLowerCase();
    if (!key || EXCLUDED.has(key)) continue;
    const list = byType.get(key);
    if (list) list.push(log);
    else byType.set(key, [log]);
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const out: Prediction[] = [];

  for (const [key, entries] of byType) {
    const sorted = [...entries].sort((a, b) => a.serviced_on.localeCompare(b.serviced_on));
    const last = sorted[sorted.length - 1];
    const defaults = DEFAULTS[vehicle.kind][key] ?? FALLBACK;

    const kmGaps: number[] = [];
    const dayGaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const km = sorted[i].mileage - sorted[i - 1].mileage;
      const days = Math.round((parse(sorted[i].serviced_on).getTime() - parse(sorted[i - 1].serviced_on).getTime()) / DAY);
      if (km > 0) kmGaps.push(km);
      if (days > 0) dayGaps.push(days);
    }

    const accelerated = ROUGH_ROAD.has(key);
    const factor = accelerated ? ROUGH_ROAD_FACTOR : 1;
    const intervalKm = Math.max(1, Math.round((kmGaps.length ? mean(kmGaps) : defaults.km) * factor));
    const intervalDays = Math.max(1, Math.round((dayGaps.length ? mean(dayGaps) : defaults.days) * factor));

    const dueMileage = last.mileage + intervalKm;
    const dueDate = new Date(parse(last.serviced_on).getTime() + intervalDays * DAY);
    const kmLeft = dueMileage - vehicle.current_mileage;
    const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / DAY);
    const etaDays = kmPerDay && kmPerDay > 0 && kmLeft > 0 ? Math.ceil(kmLeft / kmPerDay) : null;

    const progress = clamp(Math.max(1 - kmLeft / intervalKm, 1 - daysLeft / intervalDays), 0, 1.2);
    const status: Status =
      kmLeft <= 0 || daysLeft <= 0
        ? "overdue"
        : kmLeft <= 500 || daysLeft <= 14 || (etaDays !== null && etaDays <= 14)
          ? "soon"
          : "ok";

    out.push({
      serviceType: last.service_type.trim(),
      dueMileage,
      dueDate: iso(dueDate),
      kmLeft,
      daysLeft,
      etaDays,
      intervalKm,
      progress,
      remainingPct: Math.round(clamp(1 - progress, 0, 1) * 100),
      status,
      basis: kmGaps.length || dayGaps.length ? "history" : "default",
      accelerated,
    });
  }

  return out.sort((a, b) => RANK[a.status] - RANK[b.status] || b.progress - a.progress);
}

/** The most worn prediction among the given service names (case-insensitive), or undefined. */
export function worstOf(predictions: Prediction[], names: string[]): Prediction | undefined {
  const wanted = new Set(names.map((n) => n.toLowerCase()));
  return predictions
    .filter((p) => wanted.has(p.serviceType.toLowerCase()))
    .sort((a, b) => b.progress - a.progress)[0];
}
