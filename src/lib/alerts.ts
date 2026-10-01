import { DOC_LABELS, daysUntil } from "@/lib/docs";
import { pointsFor, velocity } from "@/lib/odometer";
import { predictNext } from "@/lib/predict";
import type { DocumentRow, FuelEntry, LogEntry, Reading, Task, Vehicle } from "@/types/db";

export type Severity = "urgent" | "soon";

export interface Alert {
  /** Stable key so the daily job never sends the same reminder twice. */
  key: string;
  severity: Severity;
  title: string;
  body: string;
  url: string;
}

export interface AlertInput {
  vehicles: Vehicle[];
  logs: LogEntry[];
  fuel: FuelEntry[];
  readings: Reading[];
  tasks: Task[];
  docs: DocumentRow[];
}

const km = (n: number) => Math.round(n).toLocaleString("en-US");

export function buildAlerts({ vehicles, logs, fuel, readings, tasks, docs }: AlertInput, now = new Date()): Alert[] {
  const alerts: Alert[] = [];
  const nameOf = new Map(vehicles.map((v) => [v.id, v.name]));

  for (const v of vehicles) {
    const vLogs = logs.filter((l) => l.vehicle_id === v.id);
    const { kmPerDay } = velocity(pointsFor(v.id, logs, fuel, readings), now);
    for (const p of predictNext(v, vLogs, now, kmPerDay)) {
      if (p.status === "ok") continue;
      const overdue = p.status === "overdue";
      alerts.push({
        key: `svc:${v.id}:${p.serviceType.toLowerCase()}:${p.status}:${p.dueDate}`,
        severity: overdue ? "urgent" : "soon",
        title: overdue ? `${v.name}: ${p.serviceType} is overdue` : `${v.name}: ${p.serviceType} coming up`,
        body: overdue
          ? p.kmLeft <= 0
            ? `${km(-p.kmLeft)} km past the ${km(p.dueMileage)} km mark.`
            : `${-p.daysLeft} days past its date.`
          : `Due at ${km(p.dueMileage)} km${p.etaDays !== null ? `, about ${p.etaDays} days at your pace` : ""}.`,
        url: `/vehicles/${v.id}`,
      });
    }
  }

  for (const d of docs) {
    if (!d.expires_on) continue;
    const left = daysUntil(d.expires_on, now);
    if (left > 30) continue;
    const bucket = left <= 0 ? "expired" : left <= 7 ? "7" : "30";
    const label = d.title || DOC_LABELS[d.doc_type];
    alerts.push({
      key: `doc:${d.id}:${bucket}`,
      severity: left <= 7 ? "urgent" : "soon",
      title: left <= 0 ? `${label} has expired` : `${label} expires in ${left} day${left === 1 ? "" : "s"}`,
      body: left <= 0 ? "Renew it as soon as you can." : "Start the renewal so you are not caught out.",
      url: "/garage",
    });
  }

  for (const t of tasks) {
    if (!t.due_date) continue;
    const left = daysUntil(t.due_date, now);
    if (left > 3) continue;
    alerts.push({
      key: `task:${t.id}:${left <= 0 ? "due" : "near"}`,
      severity: left <= 0 ? "urgent" : "soon",
      title: left < 0 ? `Task overdue: ${t.title}` : left === 0 ? `Task due today: ${t.title}` : `Task due soon: ${t.title}`,
      body: nameOf.get(t.vehicle_id) ?? "Your vehicle",
      url: `/tasks/${t.id}/edit`,
    });
  }

  return alerts.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "urgent" ? -1 : 1));
}
