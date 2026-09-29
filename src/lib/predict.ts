import type { LogEntry, Vehicle, VehicleKind } from "@/types/db";

export type Status = "overdue" | "soon" | "ok";

export interface Prediction {
  serviceType: string;
  dueMileage: number;
  dueDate: string; // YYYY-MM-DD
  kmLeft: number;
  daysLeft: number;
  intervalKm: number;
  /** 0 = just serviced, 1 = due now, >1 = overdue */
  progress: number;
  status: Status;
  basis: "history" | "default";
}

interface Interval {
  km: number;
  days: number;
}

/** Used until a service type has two or more logs to learn from. */
const DEFAULTS: Record<VehicleKind, Record<string, Interval>> = {
  car: {
    "Oil Change": { km: 5000, days: 180 },
    "Brake Pads": { km: 30000, days: 730 },
    "Tire Rotation": { km: 10000, days: 180 },
    "Air Filter": { km: 15000, days: 365 },
  },
  bike: {
    "Oil Change": { km: 3000, days: 180 },
    "Chain Service": { km: 1000, days: 60 },
    "Brake Pads": { km: 15000, days: 540 },
    "Air Filter": { km: 8000, days: 365 },
  },
};
const FALLBACK: Interval = { km: 5000, days: 180 };

const DAY = 86_400_000;
const mean = (n: number[]) => n.reduce((a, b) => a + b, 0) / n.length;
const parse = (d: string) => new Date(`${d}T00:00:00`);
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const RANK: Record<Status, number> = { overdue: 0, soon: 1, ok: 2 };

/**
 * For every service type that has at least one log, project the next due
 * mileage and date from the average gap between past services.
 */
export function predictNext(vehicle: Vehicle, logs: LogEntry[], now = new Date()): Prediction[] {
  const byType = new Map<string, LogEntry[]>();
  for (const log of logs) {
    const list = byType.get(log.service_type);
    if (list) list.push(log);
    else byType.set(log.service_type, [log]);
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const out: Prediction[] = [];

  for (const [serviceType, entries] of byType) {
    const sorted = [...entries].sort((a, b) => a.serviced_on.localeCompare(b.serviced_on));
    const last = sorted[sorted.length - 1];
    const defaults = DEFAULTS[vehicle.kind][serviceType] ?? FALLBACK;

    const kmGaps: number[] = [];
    const dayGaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const km = sorted[i].mileage - sorted[i - 1].mileage;
      const days = Math.round((parse(sorted[i].serviced_on).getTime() - parse(sorted[i - 1].serviced_on).getTime()) / DAY);
      if (km > 0) kmGaps.push(km);
      if (days > 0) dayGaps.push(days);
    }

    const intervalKm = kmGaps.length ? Math.round(mean(kmGaps)) : defaults.km;
    const intervalDays = dayGaps.length ? Math.round(mean(dayGaps)) : defaults.days;

    const dueMileage = last.mileage + intervalKm;
    const dueDate = new Date(parse(last.serviced_on).getTime() + intervalDays * DAY);
    const kmLeft = dueMileage - vehicle.current_mileage;
    const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / DAY);

    const progress = Math.max(1 - kmLeft / intervalKm, 1 - daysLeft / intervalDays);
    const status: Status = kmLeft <= 0 || daysLeft <= 0 ? "overdue" : kmLeft <= 500 || daysLeft <= 14 ? "soon" : "ok";

    out.push({
      serviceType,
      dueMileage,
      dueDate: iso(dueDate),
      kmLeft,
      daysLeft,
      intervalKm,
      progress: Math.min(Math.max(progress, 0), 1.2),
      status,
      basis: kmGaps.length || dayGaps.length ? "history" : "default",
    });
  }

  return out.sort((a, b) => RANK[a.status] - RANK[b.status] || b.progress - a.progress);
}
