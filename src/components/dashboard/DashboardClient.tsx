"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { completeTask } from "@/app/(app)/dashboard/actions";
import { predictNext, type Prediction } from "@/lib/predict";
import type { LogEntry, Task, Vehicle, VehicleKind } from "@/types/db";

gsap.registerPlugin(useGSAP);

const CURRENCY = "Rs"; // change once, used everywhere
const KINDS: { key: VehicleKind; label: string; singular: string }[] = [
  { key: "car", label: "Cars", singular: "car" },
  { key: "bike", label: "Bikes", singular: "bike" },
];

const km = (n: number) => Math.round(n).toLocaleString("en-US");
const shortDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function dueText(p: Prediction) {
  if (p.status === "overdue") {
    return p.kmLeft <= 0 ? `${km(-p.kmLeft)} km overdue` : `${-p.daysLeft} days overdue`;
  }
  const kmPart = `${km(p.kmLeft)} km`;
  const datePart = `by ${shortDate(p.dueDate)}`;
  return `${kmPart} or ${datePart}`;
}

interface Props {
  vehicles: Vehicle[];
  logs: LogEntry[];
  tasks: Task[];
}

export default function DashboardClient({ vehicles: initialVehicles, logs: initialLogs, tasks: initialTasks }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef<Record<VehicleKind, HTMLButtonElement | null>>({ car: null, bike: null });
  const odo = useRef<HTMLSpanElement>(null);
  const indicatorPlaced = useRef(false);
  const inFlight = useRef<Set<string>>(new Set());

  const [vehicles, setVehicles] = useState(initialVehicles);
  const [logs, setLogs] = useState(initialLogs);
  const [tasks, setTasks] = useState(initialTasks);
  const [kind, setKind] = useState<VehicleKind>(initialVehicles[0]?.kind ?? "car");
  const [selected, setSelected] = useState<Record<VehicleKind, string | null>>(() => ({
    car: initialVehicles.find((v) => v.kind === "car")?.id ?? null,
    bike: initialVehicles.find((v) => v.kind === "bike")?.id ?? null,
  }));
  const [error, setError] = useState<string | null>(null);

  const kindVehicles = vehicles.filter((v) => v.kind === kind);
  const vehicle = kindVehicles.find((v) => v.id === selected[kind]) ?? kindVehicles[0] ?? null;
  const vLogs = useMemo(() => logs.filter((l) => l.vehicle_id === vehicle?.id), [logs, vehicle?.id]);
  const vTasks = useMemo(() => tasks.filter((t) => t.vehicle_id === vehicle?.id), [tasks, vehicle?.id]);
  const predictions = useMemo(() => (vehicle ? predictNext(vehicle, vLogs) : []), [vehicle, vLogs]);
  const urgent = predictions[0];
  const kindMeta = KINDS.find((k) => k.key === kind)!;

  const { contextSafe } = useGSAP(
    () => {
      /* Tab indicator: slides under the active tab. */
      const btn = tabRefs.current[kind];
      const ind = indicator.current;
      if (btn && ind) {
        const to = { x: btn.offsetLeft, width: btn.offsetWidth };
        if (indicatorPlaced.current) gsap.to(ind, { ...to, duration: 0.5, ease: "power3.out" });
        else {
          gsap.set(ind, to);
          indicatorPlaced.current = true;
        }
      }

      /* Panel: one staggered reveal on entry and on every tab / vehicle switch.
         Only transform + opacity move, so nothing reflows. */
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-reveal]", {
          autoAlpha: 0,
          y: 16,
          duration: 0.55,
          ease: "power3.out",
          stagger: 0.06,
          clearProps: "transform,opacity,visibility",
        });
        const el = odo.current;
        if (el && vehicle) {
          const counter = { v: 0 };
          gsap.to(counter, {
            v: vehicle.current_mileage,
            duration: 0.9,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = km(counter.v);
            },
          });
        }
      });
      return () => mm.revert();
    },
    { dependencies: [kind, vehicle?.id], scope: root, revertOnUpdate: true }
  );

  /* Completion: ring fills, check draws, row slides out and collapses, then the server confirms.
     If the server refuses, the timeline reverses and the row comes back. */
  const complete = contextSafe(async (task: Task, li: HTMLElement) => {
    if (!vehicle || inFlight.current.has(task.id)) return;
    inFlight.current.add(task.id);
    setError(null);

    const ring = li.querySelector<HTMLElement>("[data-ring]")!;
    const check = li.querySelector<SVGPathElement>("[data-check]")!;
    const len = check.getTotalLength();

    const tl = gsap.timeline();
    tl.set(check, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 })
      .to(ring, { backgroundColor: "#35f2b0", borderColor: "#35f2b0", scale: 1.08, duration: 0.18, ease: "power2.out" })
      .to(ring, { scale: 1, duration: 0.2, ease: "back.out(3)" })
      .to(check, { strokeDashoffset: 0, duration: 0.3, ease: "power2.out" }, "<")
      .to(li, { x: 28, autoAlpha: 0, duration: 0.3, ease: "power2.in" }, "+=0.2")
      .to(li, { height: 0, paddingBottom: 0, duration: 0.25, ease: "power2.inOut" });

    const res = await completeTask({ taskId: task.id, mileage: vehicle.current_mileage });
    inFlight.current.delete(task.id);

    if (!res.ok) {
      tl.reverse();
      setError(res.error);
      return;
    }

    await tl.then(); // never unmount mid-animation
    setLogs((prev) => [res.log, ...prev]);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    setVehicles((prev) =>
      prev.map((v) => (v.id === res.log.vehicle_id ? { ...v, current_mileage: Math.max(v.current_mileage, res.log.mileage) } : v))
    );
  });

  const addHref = vehicle ? `/logs/new?vehicle=${vehicle.id}` : `/vehicles/new?kind=${kind}`;

  return (
    <div ref={root} className="min-h-dvh bg-obsidian-950 font-body text-bone">
      <main className="mx-auto max-w-md px-5 pb-44 pt-[calc(env(safe-area-inset-top)+20px)]">
        {kindVehicles.length > 1 && (
          <div data-reveal className="-mx-5 mb-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {kindVehicles.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelected((s) => ({ ...s, [kind]: v.id }))}
                aria-pressed={v.id === vehicle?.id}
                className={`h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors ${
                  v.id === vehicle?.id ? "border-bone bg-bone text-obsidian-950" : "border-line text-dim active:bg-obsidian-800"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        )}

        {!vehicle ? (
          <section data-reveal className="mt-16 rounded-3xl border border-dashed border-line p-8 text-center">
            <h1 className="font-display text-2xl font-semibold">No {kindMeta.singular}s yet</h1>
            <p className="mx-auto mt-2 max-w-[26ch] text-sm text-dim">
              Add your first {kindMeta.singular} to start logging services.
            </p>
            <Link
              href={addHref}
              className="mt-6 inline-flex h-12 items-center rounded-full bg-mint px-6 font-display font-semibold text-obsidian-950 transition active:scale-95"
            >
              Add a {kindMeta.singular}
            </Link>
          </section>
        ) : (
          <>
            {/* Hero: odometer is the one loud element on the screen. */}
            <section data-reveal>
              <p className="text-sm text-dim">{[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || kindMeta.singular}</p>
              <h1 className="font-display text-2xl font-semibold">{vehicle.name}</h1>
              <div className="mt-6 flex items-baseline gap-2">
                <span
                  key={`${vehicle.id}-${vehicle.current_mileage}`}
                  ref={odo}
                  suppressHydrationWarning
                  className="font-display text-7xl font-bold tabular-nums leading-none"
                >
                  {km(vehicle.current_mileage)}
                </span>
                <span className="text-lg text-dim">km</span>
              </div>

              {urgent && (
                <div className="mt-6">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold">{urgent.serviceType}</span>
                    <span className={urgent.status === "overdue" ? "font-semibold text-redline" : "text-dim"}>{dueText(urgent)}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-obsidian-700">
                    <div
                      className={`h-full origin-left rounded-full ${urgent.status === "overdue" ? "bg-redline" : "bg-mint"}`}
                      style={{ width: `${Math.min(urgent.progress, 1) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Predictions */}
            <section data-reveal className="mt-10">
              <h2 className="font-display text-lg font-semibold">Coming up</h2>
              {predictions.length === 0 ? (
                <p className="mt-2 text-sm text-dim">
                  Log the same service twice and RevTrack learns how often you do it.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-obsidian-900">
                  {predictions.slice(0, 4).map((p) => (
                    <li key={p.serviceType} className="flex items-center justify-between gap-4 px-4 py-3.5">
                      <div>
                        <p className="font-semibold">{p.serviceType}</p>
                        <p className="text-xs text-dim">
                          At {km(p.dueMileage)} km · {p.basis === "history" ? "from your history" : "typical interval"}
                        </p>
                      </div>
                      <span className={`shrink-0 text-sm ${p.status === "overdue" ? "font-semibold text-redline" : p.status === "soon" ? "font-semibold text-mint" : "text-dim"}`}>
                        {dueText(p)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Checklist */}
            <section data-reveal className="mt-10">
              <h2 className="font-display text-lg font-semibold">To do</h2>
              {vTasks.length === 0 ? (
                <p className="mt-2 text-sm text-dim">Nothing pending. Add planned work and tick it off here.</p>
              ) : (
                <ul className="mt-3">
                  {vTasks.map((t) => (
                    <li key={t.id} className="overflow-hidden pb-2">
                      <button
                        type="button"
                        onClick={(e) => complete(t, e.currentTarget.closest("li") as HTMLElement)}
                        aria-label={`Mark ${t.title} done`}
                        className="flex min-h-16 w-full items-center gap-4 rounded-2xl border border-line bg-obsidian-900 px-4 text-left transition-colors active:bg-obsidian-800"
                      >
                        <span data-ring className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-dim">
                          <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
                            <path data-check d="M5 12.5l4.5 4.5L19 7.5" stroke="#0a0b0d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0" />
                          </svg>
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{t.title}</span>
                          <span className="block text-xs text-dim">
                            {t.due_date ? `Due ${shortDate(t.due_date)}` : "No date"}
                            {t.target_mileage ? ` · at ${km(t.target_mileage)} km` : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* History */}
            <section data-reveal className="mt-10">
              <h2 className="font-display text-lg font-semibold">Recent work</h2>
              {vLogs.length === 0 ? (
                <p className="mt-2 text-sm text-dim">No services logged yet. Tap + to add the first one.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {vLogs.slice(0, 5).map((l) => (
                    <li key={l.id} className="flex items-center justify-between rounded-2xl border border-line px-4 py-3.5">
                      <div>
                        <p className="font-semibold">{l.service_type}</p>
                        <p className="text-xs text-dim">
                          {shortDate(l.serviced_on)} · {km(l.mileage)} km
                        </p>
                      </div>
                      <span className="text-sm tabular-nums text-dim">
                        {CURRENCY} {l.cost.toLocaleString("en-US")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      {error && (
        <p
          role="alert"
          className="fixed inset-x-5 bottom-[calc(env(safe-area-inset-bottom)+92px)] z-30 mx-auto max-w-md rounded-2xl border border-redline/50 bg-obsidian-900 px-4 py-3 text-sm text-redline"
        >
          {error}
        </p>
      )}

      {/* Dock: tabs and primary action live in the thumb zone. */}
      <nav className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-obsidian-950 via-obsidian-950/90 to-transparent px-5 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-6">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div role="tablist" aria-label="Vehicle type" className="relative flex flex-1 rounded-full border border-line bg-obsidian-900 p-1">
            <span ref={indicator} aria-hidden className="absolute left-0 top-1 h-[calc(100%-8px)] w-0 rounded-full bg-mint" />
            {KINDS.map((k) => (
              <button
                key={k.key}
                ref={(el) => {
                  tabRefs.current[k.key] = el;
                }}
                role="tab"
                type="button"
                aria-selected={kind === k.key}
                onClick={() => setKind(k.key)}
                className={`relative z-10 h-12 flex-1 rounded-full font-display font-semibold transition-[color,transform] duration-200 active:scale-95 ${
                  kind === k.key ? "text-obsidian-950" : "text-dim"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
          <Link
            href="/settings"
            aria-label="Settings and account"
            className="grid size-14 shrink-0 place-items-center rounded-full border border-line bg-obsidian-900 text-dim transition-transform active:scale-90"
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
            </svg>
          </Link>
          <Link
            href={addHref}
            aria-label={vehicle ? "Log a service" : `Add a ${kindMeta.singular}`}
            className="grid size-14 shrink-0 place-items-center rounded-full bg-bone text-obsidian-950 transition-transform active:scale-90"
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
        </div>
      </nav>
    </div>
  );
}
