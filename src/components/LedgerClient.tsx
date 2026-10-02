"use client";

import Link from "next/link";
import { useMemo } from "react";
import EmptyGarage from "@/components/EmptyGarage";
import FinancialLedger from "@/components/FinancialLedger";
import { useGarage } from "@/components/garage-context";
import { IconFuel, IconPlus } from "@/components/icons";
import { KindStage, PageTop } from "@/components/nav";
import { km, money, shortDate } from "@/lib/format";
import { CATEGORY_META } from "@/lib/ledger";
import { vehicleStats } from "@/lib/vehicle-stats";
import type { FuelEntry, LogEntry, Reading, Vehicle } from "@/types/db";

interface Props {
  logs: LogEntry[];
  fuel: FuelEntry[];
  readings: Reading[];
  currency: string;
}

export default function LedgerClient({ logs, fuel, readings, currency }: Props) {
  const { vehicle, kind } = useGarage();

  return (
    <main className="page-main relative">
      <PageTop />
      {vehicle ? (
        <KindStage stageKey={`${kind}:${vehicle.id}`}>
          <LedgerBody vehicle={vehicle} logs={logs} fuel={fuel} readings={readings} currency={currency} />
        </KindStage>
      ) : (
        <KindStage stageKey={`${kind}:none`}>
          <EmptyGarage kind={kind} />
        </KindStage>
      )}
    </main>
  );
}

function LedgerBody({ vehicle, logs, fuel, readings, currency }: Props & { vehicle: Vehicle }) {
  const stats = useMemo(() => vehicleStats(vehicle, logs, fuel, readings), [vehicle, logs, fuel, readings]);

  const entries = useMemo(() => {
    const items = [
      ...stats.logs.map((l) => ({
        id: `l${l.id}`,
        date: l.serviced_on,
        title: l.service_type,
        label: CATEGORY_META[l.expense_type].label,
        color: CATEGORY_META[l.expense_type].color,
        sub: `${km(l.mileage)} km`,
        cost: Number(l.cost),
        href: `/logs/${l.id}/edit`,
      })),
      ...stats.fuel.map((f) => ({
        id: `f${f.id}`,
        date: f.filled_on,
        title: `Fuel at ${f.station}`,
        label: "Fuel",
        color: CATEGORY_META.fuel.color,
        sub: `${Number(f.liters).toFixed(1)} L${f.area ? ` · ${f.area}` : ""}`,
        cost: Number(f.total_cost),
        href: `/fuel/${f.id}/edit`,
      })),
    ];
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 25);
  }, [stats.logs, stats.fuel]);

  return (
    <div>
      <h1 className="mt-3 font-display text-2xl font-semibold">Ledger</h1>
      <p className="mb-4 text-sm text-dim">{vehicle.name}</p>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Link href={`/logs/new?vehicle=${vehicle.id}&type=fuel`} className="flex min-h-14 items-center gap-3 cut px-4 font-semibold active:bg-obsidian-800">
          <IconFuel className="size-5 text-mint" /> Fuel up
        </Link>
        <Link href={`/logs/new?vehicle=${vehicle.id}`} className="flex min-h-14 items-center gap-3 cut px-4 font-semibold active:bg-obsidian-800">
          <IconPlus className="size-5 text-mint" /> Add expense
        </Link>
      </div>

      <FinancialLedger ledger={stats.ledger} currency={currency} />

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold">All entries</h2>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-dim">Nothing logged for this vehicle yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {entries.map((e) => (
              <li key={e.id}>
                <Link href={e.href} className="flex min-h-16 items-center gap-3 rounded-2xl border border-line px-4 py-3 transition-colors active:bg-obsidian-800">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: e.color }} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{e.title}</span>
                    <span className="block text-xs text-dim">
                      {shortDate(e.date)} · {e.label} · {e.sub}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-dim">{money(e.cost, currency)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
