import type { FuelEntry, FuelKind } from "@/types/db";

export function fuelKindLabel(kind: FuelKind): string {
  return kind === "lpg" ? "LPG" : "Petrol";
}

export function fuelQuantityLabel(f: Pick<FuelEntry, "fuel_kind" | "liters">): string {
  const q = Number(f.liters).toFixed(1);
  return f.fuel_kind === "lpg" ? `${q} kg` : `${q} L`;
}
