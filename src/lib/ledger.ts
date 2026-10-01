import type { FuelEntry, LogEntry } from "@/types/db";

export type Category = "maintenance" | "tuning" | "parts" | "fuel";

export const CATEGORY_META: Record<Category, { label: string; color: string }> = {
  maintenance: { label: "Maintenance", color: "#00f5a0" },
  tuning: { label: "Tuning", color: "#ff3366" },
  parts: { label: "Parts & DIY", color: "#7dd3fc" },
  fuel: { label: "Fuel", color: "#fbbf24" },
};
export const CATEGORIES = Object.keys(CATEGORY_META) as Category[];

export interface MonthBucket {
  key: string; // YYYY-MM
  label: string;
  total: number;
  byCategory: Record<Category, number>;
}

export interface StationStat {
  station: string;
  areas: string[];
  fills: number;
  measured: number;
  avgKmPerL: number | null;
  avgPricePerL: number | null;
  totalSpent: number;
}

export interface FuelRow extends FuelEntry {
  kmPerL: number | null;
}

export interface Ledger {
  total: number;
  thisMonth: number;
  avgMonthly: number;
  byCategory: Record<Category, number>;
  months: MonthBucket[];
  fuel: { kmPerL: number | null; costPerKm: number | null; totalLiters: number; totalKm: number; rows: FuelRow[] };
  stations: StationStat[];
  /** Everything spent divided by km driven, or null when km driven is unknown. */
  costPerKmOverall: number | null;
  insight: string | null;
}

const emptyCats = (): Record<Category, number> => ({ maintenance: 0, tuning: 0, parts: 0, fuel: 0 });
const monthKey = (d: string) => d.slice(0, 7);
const round2 = (n: number) => Math.round(n * 100) / 100;

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "short" });
}

/** Fuel economy is measured fill to fill: both fills full, distance since the last one over litres added. */
export function fuelRows(fuel: FuelEntry[]): FuelRow[] {
  const sorted = [...fuel].sort((a, b) => a.odometer - b.odometer || a.filled_on.localeCompare(b.filled_on));
  return sorted.map((cur, i) => {
    const prev = sorted[i - 1];
    let kmPerL: number | null = null;
    if (prev && prev.full_tank && cur.full_tank && cur.odometer > prev.odometer && cur.liters > 0) {
      kmPerL = (cur.odometer - prev.odometer) / cur.liters;
    }
    return { ...cur, kmPerL };
  });
}

export function buildLedger(logs: LogEntry[], fuel: FuelEntry[], kmDriven: number | null, now = new Date()): Ledger {
  const byCategory = emptyCats();
  const months = new Map<string, MonthBucket>();

  const bucket = (key: string) => {
    let b = months.get(key);
    if (!b) {
      b = { key, label: monthLabel(key), total: 0, byCategory: emptyCats() };
      months.set(key, b);
    }
    return b;
  };
  const add = (cat: Category, date: string, cost: number) => {
    byCategory[cat] += cost;
    const b = bucket(monthKey(date));
    b.total += cost;
    b.byCategory[cat] += cost;
  };

  for (const l of logs) add(l.expense_type, l.serviced_on, Number(l.cost));
  for (const f of fuel) add("fuel", f.filled_on, Number(f.total_cost));

  const total = CATEGORIES.reduce((s, c) => s + byCategory[c], 0);

  // Last six calendar months, oldest first, including empty ones so the chart keeps its shape.
  const recent: MonthBucket[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    recent.push(months.get(key) ?? { key, label: monthLabel(key), total: 0, byCategory: emptyCats() });
  }

  const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const keys = [...months.keys()].sort();
  let spanMonths = 1;
  if (keys.length) {
    const [fy, fm] = keys[0].split("-").map(Number);
    spanMonths = Math.max(1, (now.getFullYear() - fy) * 12 + (now.getMonth() + 1 - fm) + 1);
  }

  // Fuel efficiency
  const rows = fuelRows(fuel);
  let totalKm = 0;
  let totalLiters = 0;
  let measuredCost = 0;
  for (const r of rows) {
    if (r.kmPerL !== null) {
      const prevOdo = r.odometer - r.kmPerL * r.liters;
      totalKm += r.odometer - prevOdo;
      totalLiters += r.liters;
      measuredCost += Number(r.total_cost);
    }
  }

  // Station quality: does one brand or area consistently give better mileage?
  const groups = new Map<string, FuelRow[]>();
  for (const r of rows) {
    const key = r.station.trim();
    const list = groups.get(key);
    if (list) list.push(r);
    else groups.set(key, [r]);
  }
  const stations: StationStat[] = [...groups.entries()].map(([station, list]) => {
    const measured = list.filter((r) => r.kmPerL !== null);
    const priced = list.filter((r) => r.liters > 0);
    return {
      station,
      areas: [...new Set(list.map((r) => r.area?.trim()).filter((a): a is string => !!a))],
      fills: list.length,
      measured: measured.length,
      avgKmPerL: measured.length ? measured.reduce((s, r) => s + (r.kmPerL as number), 0) / measured.length : null,
      avgPricePerL: priced.length ? priced.reduce((s, r) => s + Number(r.total_cost) / r.liters, 0) / priced.length : null,
      totalSpent: list.reduce((s, r) => s + Number(r.total_cost), 0),
    };
  });
  stations.sort((a, b) => (b.avgKmPerL ?? -1) - (a.avgKmPerL ?? -1) || b.fills - a.fills);

  const reliable = stations.filter((s) => s.measured >= 2 && s.avgKmPerL !== null);
  let insight: string | null = null;
  if (reliable.length >= 2) {
    const best = reliable[0];
    const worst = reliable[reliable.length - 1];
    const gain = ((best.avgKmPerL as number) / (worst.avgKmPerL as number) - 1) * 100;
    if (gain >= 3) {
      insight = `${best.station} averages ${(best.avgKmPerL as number).toFixed(1)} km/L, about ${Math.round(gain)}% better than ${worst.station} at ${(worst.avgKmPerL as number).toFixed(1)} km/L.`;
    }
  }

  return {
    total: round2(total),
    thisMonth: round2(months.get(nowKey)?.total ?? 0),
    avgMonthly: round2(total / spanMonths),
    byCategory,
    months: recent,
    fuel: {
      kmPerL: totalLiters > 0 ? totalKm / totalLiters : null,
      costPerKm: totalKm > 0 ? measuredCost / totalKm : null,
      totalLiters,
      totalKm,
      rows: rows.slice().reverse(),
    },
    stations,
    costPerKmOverall: kmDriven && kmDriven > 0 ? total / kmDriven : null,
    insight,
  };
}
