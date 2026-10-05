"use client";

import { useState } from "react";
import { Field, inputClass } from "@/components/ui/form";
import { KARACHI_AREAS } from "@/lib/service-types";
import type { FuelKind } from "@/types/db";

export default function FuelKindFields({
  defaultKind = "petrol",
  defaults,
}: {
  defaultKind?: FuelKind;
  defaults: {
    liters?: number;
    total_cost?: number;
    station?: string;
    area?: string | null;
    full_tank?: boolean;
    notes?: string | null;
  };
}) {
  const [kind, setKind] = useState<FuelKind>(defaultKind === "lpg" ? "lpg" : "petrol");
  const isLpg = kind === "lpg";

  return (
    <>
      <div role="radiogroup" aria-label="Fuel type" className="cut cut-sm grid grid-cols-2 gap-1 p-1">
        {(["petrol", "lpg"] as const).map((k) => {
          const on = kind === k;
          return (
            <label
              key={k}
              className={`grid min-h-11 cursor-pointer place-items-center text-xs font-semibold uppercase tracking-wide transition-colors ${
                on ? "bg-mint text-obsidian-950" : "text-dim"
              }`}
            >
              <input type="radio" name="fuel_kind" value={k} checked={on} onChange={() => setKind(k)} className="sr-only" />
              {k === "petrol" ? "Petrol" : "LPG"}
            </label>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={isLpg ? "Kilograms (kg)" : "Litres"}>
          <input
            name="liters"
            type="number"
            inputMode="decimal"
            min={0.1}
            max={isLpg ? 50 : 500}
            step="0.01"
            required
            defaultValue={defaults.liters ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Total cost">
          <input
            name="total_cost"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            required
            defaultValue={defaults.total_cost ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label={isLpg ? "LPG dealer" : "Petrol station"} hint={isLpg ? "Shop or brand name." : "Pick one or type your own."}>
        <input name="station" list={isLpg ? undefined : "fuel-stations"} required maxLength={40} defaultValue={defaults.station ?? ""} className={inputClass} />
      </Field>

      <Field label="Area" hint={isLpg ? "Optional — where you filled." : "Helps compare petrol quality between parts of Karachi."}>
        <input name="area" list="karachi-areas" maxLength={60} defaultValue={defaults.area ?? ""} className={inputClass} />
        <datalist id="karachi-areas">{KARACHI_AREAS.map((s) => <option key={s} value={s} />)}</datalist>
      </Field>

      <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-line px-4">
        <input type="checkbox" name="full_tank" defaultChecked={defaults.full_tank ?? true} className="size-5 accent-[#c8ff2e]" />
        <span>
          <span className="block text-sm font-semibold">{isLpg ? "Full cylinder" : "Filled to the brim"}</span>
          <span className="block text-xs text-dim">
            {isLpg ? "Needed to measure km/kg on LPG fills." : "Needed to measure km/L on petrol fills."}
          </span>
        </span>
      </label>
    </>
  );
}
