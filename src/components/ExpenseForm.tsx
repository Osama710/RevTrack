"use client";

import { useState } from "react";
import { FuelForm, LogForm } from "@/components/forms";
import { CATEGORY_META, type Category } from "@/lib/ledger";

type Action = (formData: FormData) => void | Promise<void>;
type VehicleOption = { id: string; name: string; kind: string };

const MODES: Category[] = ["maintenance", "tuning", "parts", "fuel"];

/** One entry point for every kind of spending: the type switcher decides which fields appear. */
export default function ExpenseForm({
  vehicles,
  vehicleId,
  odometer,
  today,
  initialMode,
  itemName,
  logAction,
  fuelAction,
}: {
  vehicles: VehicleOption[];
  vehicleId: string;
  odometer: number;
  today: string;
  initialMode: Category;
  itemName?: string;
  logAction: Action;
  fuelAction: Action;
}) {
  const [mode, setMode] = useState<Category>(initialMode);

  return (
    <div>
      <div role="tablist" aria-label="Expense type" className="grid grid-cols-4 gap-1 cut p-1">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`min-h-12 rounded-xl px-1 text-xs font-semibold transition-colors active:opacity-80 ${
              mode === m ? "bg-mint text-obsidian-950" : "text-dim"
            }`}
          >
            {m === "parts" ? "Parts" : CATEGORY_META[m].label}
          </button>
        ))}
      </div>

      <div className="mt-6" key={mode}>
        {mode === "fuel" ? (
          <FuelForm action={fuelAction} submitLabel="Save fuel" vehicles={vehicles} defaults={{ vehicle_id: vehicleId, filled_on: today, odometer }} />
        ) : (
          <LogForm
            action={logAction}
            submitLabel="Save expense"
            vehicles={vehicles}
            expenseType={mode}
            typeMode="hidden"
            defaults={{ vehicle_id: vehicleId, serviced_on: today, cost: 0, mileage: odometer, service_type: itemName }}
          />
        )}
      </div>
    </div>
  );
}
