export type VehicleKind = "car" | "bike";
export type ExpenseType = "maintenance" | "tuning" | "parts";
export type CplcStatus = "unverified" | "clear" | "stolen_reported";
export type DocType = "driving_license" | "registration" | "token_tax" | "cplc" | "insurance" | "fitness" | "other";

export interface Vehicle {
  id: string;
  kind: VehicleKind;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  current_mileage: number;
  plate: string | null;
  engine_no: string | null;
  chassis_no: string | null;
  color: string | null;
  cplc_status: CplcStatus;
  cplc_checked_on: string | null;
}

export interface LogEntry {
  id: string;
  vehicle_id: string;
  service_type: string;
  serviced_on: string; // YYYY-MM-DD
  cost: number;
  mileage: number;
  notes: string | null;
  expense_type: ExpenseType;
}

export interface FuelEntry {
  id: string;
  vehicle_id: string;
  filled_on: string;
  odometer: number;
  liters: number;
  total_cost: number;
  station: string;
  area: string | null;
  full_tank: boolean;
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
  checklist: "monsoon" | "mechanic" | null;
}

export interface DocumentRow {
  id: string;
  vehicle_id: string | null;
  doc_type: DocType;
  title: string;
  doc_number: string | null;
  issued_on: string | null;
  expires_on: string | null;
  image_path: string | null;
  notes: string | null;
}

export interface Reading {
  vehicle_id: string;
  reading: number;
  read_on: string;
}

/** Column lists kept in one place so every page selects the same shape. */
export const VEHICLE_COLS =
  "id, kind, name, make, model, year, current_mileage, plate, engine_no, chassis_no, color, cplc_status, cplc_checked_on";
export const LOG_COLS = "id, vehicle_id, service_type, serviced_on, cost, mileage, notes, expense_type";
export const FUEL_COLS = "id, vehicle_id, filled_on, odometer, liters, total_cost, station, area, full_tank, notes";
export const TASK_COLS = "id, vehicle_id, title, service_type, due_date, target_mileage, notes, checklist";
export const DOC_COLS = "id, vehicle_id, doc_type, title, doc_number, issued_on, expires_on, image_path, notes";
