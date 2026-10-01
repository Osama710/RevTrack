import { buildLedger } from "@/lib/ledger";
import { pointsFor, velocity } from "@/lib/odometer";
import { predictNext } from "@/lib/predict";
import type { FuelEntry, LogEntry, Reading, Vehicle } from "@/types/db";

/** Everything the dashboard, ledger and garage need to know about one vehicle. */
export function vehicleStats(vehicle: Vehicle, logs: LogEntry[], fuel: FuelEntry[], readings: Reading[], now = new Date()) {
  const vLogs = logs.filter((l) => l.vehicle_id === vehicle.id);
  const vFuel = fuel.filter((f) => f.vehicle_id === vehicle.id);
  const points = pointsFor(vehicle.id, vLogs, vFuel, readings);
  const { kmPerDay, kmThisMonth } = velocity(points, now);
  const kmDriven = points.length >= 2 ? Math.max(0, vehicle.current_mileage - Math.min(...points.map((p) => p.km))) : null;
  return {
    logs: vLogs,
    fuel: vFuel,
    kmPerDay,
    kmThisMonth,
    kmDriven,
    predictions: predictNext(vehicle, vLogs, now, kmPerDay),
    ledger: buildLedger(vLogs, vFuel, kmDriven, now),
  };
}
