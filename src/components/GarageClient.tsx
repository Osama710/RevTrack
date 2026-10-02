"use client";

import Link from "next/link";
import EmptyGarage from "@/components/EmptyGarage";
import { useGarage } from "@/components/garage-context";
import { IconChat, IconChevron, IconPlus, IconShield, IconUser } from "@/components/icons";
import { KindStage, PageTop } from "@/components/nav";
import { DOC_LABELS, daysUntil } from "@/lib/docs";
import { km } from "@/lib/format";
import type { CplcStatus, DocumentRow, Vehicle } from "@/types/db";

const CPLC: Record<CplcStatus, { text: string; cls: string }> = {
  unverified: { text: "CPLC not verified", cls: "text-dim border-line" },
  clear: { text: "CPLC clear", cls: "text-mint border-mint/40" },
  stolen_reported: { text: "Reported stolen", cls: "text-redline border-redline/50" },
};

export default function GarageClient({ docs }: { docs: DocumentRow[] }) {
  const { kind, vehicle, kindVehicles } = useGarage();
  const shown = docs.filter((d) => d.vehicle_id === null || d.vehicle_id === vehicle?.id);

  return (
    <main className="page-main relative">
      <PageTop />
      <KindStage stageKey={`${kind}:${vehicle?.id ?? "none"}`}>
        <GarageBody kind={kind} vehicles={kindVehicles} vehicle={vehicle} docs={shown} />
      </KindStage>
    </main>
  );
}

function GarageBody({ kind, vehicles, vehicle, docs }: { kind: "car" | "bike"; vehicles: Vehicle[]; vehicle: Vehicle | null; docs: DocumentRow[] }) {
  return (
    <div>
      <div className="mt-3 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Garage</h1>
        <Link href="/settings" aria-label="Settings and account" className="grid size-12 place-items-center rounded-full border border-line text-dim active:bg-obsidian-800">
          <IconUser />
        </Link>
      </div>

      <a href="/excise" className="mt-4 flex min-h-20 items-center gap-4 rounded-2xl border border-mint/40 bg-obsidian-900 px-4 active:bg-obsidian-800">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-mint text-obsidian-950"><IconShield /></span>
        <span>
          <span className="block font-display text-lg font-semibold">Excise Safe Mode</span>
          <span className="block text-sm text-dim">Papers ready for a roadside check</span>
        </span>
        <IconChevron className="ml-auto size-5 text-dim" />
      </a>
      <Link href="/ustad" className="mt-3 flex min-h-14 items-center gap-3 cut px-4 font-semibold active:bg-obsidian-800">
        <IconChat className="size-5 text-mint" /> Ask AI Ustad about a problem
      </Link>

      <h2 className="mt-10 font-display text-lg font-semibold">{kind === "car" ? "Cars" : "Bikes"}</h2>
      {vehicles.length === 0 ? (
        <EmptyGarage kind={kind} />
      ) : (
        <ul className="mt-3 space-y-2">
          {vehicles.map((v) => (
            <li key={v.id}>
              <Link href={`/vehicles/${v.id}`} className="flex min-h-20 items-center gap-3 cut px-4 py-3 active:bg-obsidian-800">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg font-semibold">{v.name}</span>
                  <span className="block text-sm text-dim">
                    {[v.plate, `${km(v.current_mileage)} km`].filter(Boolean).join(" · ")}
                  </span>
                  <span className={`mt-1.5 inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${CPLC[v.cplc_status].cls}`}>{CPLC[v.cplc_status].text}</span>
                </span>
                <IconChevron className="size-5 shrink-0 text-dim" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href={`/vehicles/new?kind=${kind}`} className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-full border border-line font-semibold active:bg-obsidian-800">
        <IconPlus className="size-5" /> Add a {kind}
      </Link>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Document wallet</h2>
        <Link href={`/documents/new${vehicle ? `?vehicle=${vehicle.id}` : ""}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-mint">Add document</Link>
      </div>
      {docs.length === 0 ? (
        <p className="mt-1 text-sm text-dim">Keep your licence, registration, token tax and more here, with a photo of each.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {docs.map((d) => {
            const left = d.expires_on ? daysUntil(d.expires_on) : null;
            return (
              <li key={d.id}>
                <Link href={`/documents/${d.id}`} className="flex min-h-16 items-center gap-3 rounded-2xl border border-line px-4 py-3 active:bg-obsidian-800">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{d.title}</span>
                    <span className="block text-xs text-dim">{DOC_LABELS[d.doc_type]}{d.image_path ? " · photo saved" : ""}</span>
                  </span>
                  <span className={`shrink-0 text-sm ${left !== null && left < 30 ? "font-semibold text-redline" : "text-dim"}`}>
                    {left === null ? "No expiry" : left < 0 ? "Expired" : `${left} days`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
