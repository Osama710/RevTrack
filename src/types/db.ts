export type VehicleKind = "car" | "bike";

export interface Vehicle {
  id: string;
  kind: VehicleKind;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  current_mileage: number;
}

export interface LogEntry {
  id: string;
  vehicle_id: string;
  service_type: string;
  serviced_on: string; // YYYY-MM-DD
  cost: number;
  mileage: number;
  notes: string | null;
}

export interface Task {
  id: string;
  vehicle_id: string;
  title: string;
  service_type: string;
  due_date: string | null;
  target_mileage: number | null;
  notes: string | null;
}
