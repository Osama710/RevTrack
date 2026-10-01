"use client";

import { useEffect, useMemo, useState } from "react";
import { DOC_LABELS, daysUntil } from "@/lib/docs";
import { loadSnapshot, saveSnapshot, warmOfflineCache, type Snapshot } from "@/lib/excise-store";
import { shortDate } from "@/lib/format";
import type { CplcStatus, DocumentRow, Vehicle } from "@/types/db";

type Status = "loading" | "online" | "offline" | "error";

const CPLC: Record<CplcStatus, { text: string; cls: string }> = {
  unverified: { text: "CPLC not verified", cls: "border-line text-dim" },
  clear: { text: "CPLC clear", cls: "border-mint text-mint" },
  stolen_reported: { text: "Reported stolen", cls: "border-redline text-redline" },
};

function Expiry({ date }: { date: string | null }) {
  if (!date) return <p className="text-sm text-dim">No expiry date</p>;
  const left = daysUntil(date);
  const bad = left < 30;
  return (
    <p className={`font-display text-2xl font-bold ${bad ? "text-redline" : "text-mint"}`}>
      {left < 0 ? `Expired ${-left} days ago` : left === 0 ? "Expires today" : `${left} days left`}
      <span className="ml-2 text-sm font-medium text-dim">until {shortDate(date)}</span>
    </p>
  );
}

export default function ExciseView() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [zoom, setZoom] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      const cached = await loadSnapshot();
      if (cached && live) setSnap(cached);
      if (!navigator.onLine) return live && setStatus(cached ? "offline" : "error");
      try {
        const res = await fetch("/api/excise", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { vehicles: Vehicle[]; documents: DocumentRow[] };
        const images: Record<string, Blob> = {};
        await Promise.all(
          data.documents.filter((d) => d.image_path).map(async (d) => {
            try {
              const r = await fetch(`/api/documents/${d.id}/image`, { cache: "no-store" });
              if (r.ok) images[d.id] = await r.blob();
              else if (cached?.images[d.id]) images[d.id] = cached.images[d.id];
            } catch {
              if (cached?.images[d.id]) images[d.id] = cached.images[d.id];
            }
          })
        );
        const next: Snapshot = { savedAt: new Date().toISOString(), vehicles: data.vehicles, documents: data.documents, images };
        await saveSnapshot(next);
        if (live) {
          setSnap(next);
          setStatus("online");
        }
        void warmOfflineCache();
      } catch {
        if (live) setStatus(cached ? "offline" : "error");
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const urls = useMemo(() => {
    const out: Record<string, string> = {};
    if (snap) for (const [id, blob] of Object.entries(snap.images)) out[id] = URL.createObjectURL(blob);
    return out;
  }, [snap]);
  useEffect(() => () => Object.values(urls).forEach((u) => URL.revokeObjectURL(u)), [urls]);

  const docs = snap?.documents ?? [];
  const licences = docs.filter((d) => d.doc_type === "driving_license");
  const tokens = docs.filter((d) => d.doc_type === "token_tax").sort((a, b) => (b.expires_on ?? b.issued_on ?? "").localeCompare(a.expires_on ?? a.issued_on ?? ""));

  const Photo = ({ d }: { d: DocumentRow }) =>
    urls[d.id] ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={urls[d.id]} alt={d.title} onClick={() => setZoom(urls[d.id])} className="mt-3 max-h-56 w-full rounded-xl border border-line bg-black object-contain" />
    ) : null;

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-obsidian-950 px-5 pb-16 pt-[calc(env(safe-area-inset-top)+16px)]">
      <div className="flex items-center justify-between">
        <a href="/dashboard" className="inline-flex min-h-11 items-center text-sm text-dim">Exit</a>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${status === "online" ? "border-mint text-mint" : status === "error" ? "border-redline text-redline" : "border-line text-dim"}`}>
          {status === "online" ? "Up to date" : status === "offline" && snap ? `Offline copy · ${new Date(snap.savedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : status === "loading" ? "Loading..." : "Not available"}
        </span>
      </div>
      <h1 className="mt-3 font-display text-3xl font-bold">Excise Safe Mode</h1>

      {status === "error" && !snap && (
        <p className="mt-6 rounded-2xl border border-redline/50 p-4 text-sm text-redline">
          No papers saved on this phone yet. Open this screen once while online and a copy is kept for roadside checks. If you are signed out, <a href="/login" className="underline">sign in</a>.
        </p>
      )}

      {snap && (
        <div className="mt-5 space-y-4">
          <section className="rounded-2xl border border-line bg-obsidian-900 p-4">
            <h2 className="font-display text-lg font-semibold">Driving licence</h2>
            {licences.length === 0 ? <p className="mt-1 text-sm text-dim">No licence saved. Add it in Garage, then Document wallet.</p> : licences.map((d) => (
              <div key={d.id} className="mt-2">
                <Expiry date={d.expires_on} />
                {d.doc_number && <p className="mt-1 text-sm text-dim">No. {d.doc_number}</p>}
                <Photo d={d} />
              </div>
            ))}
          </section>

          {snap.vehicles.map((v) => {
            const vd = docs.filter((d) => d.vehicle_id === v.id && d.doc_type !== "token_tax" && d.doc_type !== "driving_license");
            return (
              <section key={v.id} className="rounded-2xl border border-line bg-obsidian-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-3xl font-bold tracking-wide">{v.plate ?? v.name}</p>
                    <p className="text-sm text-dim">{[v.year, v.make, v.model, v.color].filter(Boolean).join(" · ") || v.name}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${CPLC[v.cplc_status].cls}`}>{CPLC[v.cplc_status].text}</span>
                </div>
                {(v.engine_no || v.chassis_no) && (
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    {v.engine_no && <div><dt className="text-dim">Engine</dt><dd className="break-all font-semibold">{v.engine_no}</dd></div>}
                    {v.chassis_no && <div><dt className="text-dim">Chassis</dt><dd className="break-all font-semibold">{v.chassis_no}</dd></div>}
                  </dl>
                )}
                {v.cplc_checked_on && <p className="mt-2 text-xs text-dim">CPLC checked {shortDate(v.cplc_checked_on)}</p>}
                {vd.map((d) => (
                  <div key={d.id} className="mt-4 border-t border-line pt-3">
                    <p className="font-semibold">{d.title} <span className="text-sm font-normal text-dim">{DOC_LABELS[d.doc_type]}</span></p>
                    {d.expires_on && <Expiry date={d.expires_on} />}
                    <Photo d={d} />
                  </div>
                ))}
              </section>
            );
          })}

          <section className="rounded-2xl border border-line bg-obsidian-900 p-4">
            <h2 className="font-display text-lg font-semibold">Token tax history</h2>
            {tokens.length === 0 ? <p className="mt-1 text-sm text-dim">No token tax papers saved.</p> : (
              <ul className="mt-2 divide-y divide-line">
                {tokens.map((d) => (
                  <li key={d.id} className="py-3">
                    <p className="font-semibold">{d.title}</p>
                    <p className="text-sm text-dim">
                      {d.issued_on ? `Paid ${shortDate(d.issued_on)}` : "Date not set"}
                      {d.expires_on ? ` · valid to ${shortDate(d.expires_on)}` : ""}
                    </p>
                    <Photo d={d} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {zoom && (
        <button type="button" aria-label="Close photo" onClick={() => setZoom(null)} className="fixed inset-0 z-50 grid place-items-center bg-black p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="Document" className="max-h-full max-w-full object-contain" />
        </button>
      )}
    </main>
  );
}
