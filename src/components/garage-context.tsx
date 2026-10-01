"use client";

import { MotionConfig } from "framer-motion";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Vehicle, VehicleKind } from "@/types/db";

interface Garage {
  vehicles: Vehicle[];
  kind: VehicleKind;
  setKind: (k: VehicleKind) => void;
  kindVehicles: Vehicle[];
  vehicle: Vehicle | null;
  selectVehicle: (id: string) => void;
  counts: Record<VehicleKind, number>;
}

const Ctx = createContext<Garage | null>(null);
const STORE = "revtrack.garage";

export function GarageProvider({ vehicles, children }: { vehicles: Vehicle[]; children: ReactNode }) {
  const [kind, setKind] = useState<VehicleKind>(vehicles[0]?.kind ?? "car");
  const [sel, setSel] = useState<Record<VehicleKind, string | null>>({ car: null, bike: null });
  const [ready, setReady] = useState(false);

  // Restore the last car/bike and vehicle after mount, so server and client markup match on first paint.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const s = JSON.parse(raw) as { kind?: string; sel?: { car?: string | null; bike?: string | null } };
        if (s.kind === "car" || s.kind === "bike") setKind(s.kind);
        setSel({ car: s.sel?.car ?? null, bike: s.sel?.bike ?? null });
      }
    } catch {
      /* storage unavailable */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORE, JSON.stringify({ kind, sel }));
    } catch {
      /* storage unavailable */
    }
  }, [kind, sel, ready]);

  const value = useMemo<Garage>(() => {
    const kindVehicles = vehicles.filter((v) => v.kind === kind);
    const vehicle = kindVehicles.find((v) => v.id === sel[kind]) ?? kindVehicles[0] ?? null;
    return {
      vehicles,
      kind,
      setKind,
      kindVehicles,
      vehicle,
      selectVehicle: (id: string) => setSel((s) => ({ ...s, [kind]: id })),
      counts: { car: vehicles.filter((v) => v.kind === "car").length, bike: vehicles.filter((v) => v.kind === "bike").length },
    };
  }, [vehicles, kind, sel]);

  return (
    <Ctx.Provider value={value}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </Ctx.Provider>
  );
}

export function useGarage(): Garage {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useGarage must be used inside GarageProvider");
  }
  return ctx;
}
