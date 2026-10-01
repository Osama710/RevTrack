"use client";

import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { addChecklist } from "@/app/(app)/actions";
import { completeTask } from "@/app/(app)/dashboard/actions";
import EmptyGarage from "@/components/EmptyGarage";
import Gauge from "@/components/Gauge";
import { useGarage } from "@/components/garage-context";
import { IconChat, IconChevron, IconFuel, IconOdo, IconPlus, IconShield } from "@/components/icons";
import { KindStage, PageTop } from "@/components/nav";
import { CATEGORY_META } from "@/lib/ledger";
import { CHECKLISTS } from "@/lib/checklists";
import { daysUntil } from "@/lib/docs";
import { km, money, shortDate } from "@/lib/format";
import { worstOf, type Prediction } from "@/lib/predict";
import { vehicleStats } from "@/lib/vehicle-stats";
import type { FuelEntry, LogEntry, Reading, Task, Vehicle } from "@/types/db";

gsap.registerPlugin(useGSAP);

const MINT = "#c8ff2e";
type Result = { ok: true } | { ok: false; error: string };

interface Props {
  logs: LogEntry[];
  fuel: FuelEntry[];
  tasks: Task[];
  readings: Reading[];
  /** Nearest driving-licence expiry date, if a licence is on file. */
  licenseExpiry: string | null;
  currency: string;
}

export default function DashboardClient(props: Props) {
  const { vehicle, kind } = useGarage();
  const router = useRouter();
  const [logs, setLogs] = useState(props.logs);
  const [tasks, setTasks] = useState(props.tasks);

  // Take the server's word whenever the page is refreshed.
  useEffect(() => setLogs(props.logs), [props.logs]);
  useEffect(() => setTasks(props.tasks), [props.tasks]);

  const handleComplete = async (task: Task): Promise<Result> => {
    if (!vehicle) return { ok: false, error: "No vehicle selected." };
    const res = await completeTask({ taskId: task.id, mileage: vehicle.current_mileage });
    if (!res.ok) return { ok: false, error: res.error };
    setLogs((prev) => [res.log, ...prev]);
    return { ok: true };
  };

  const handleRemove = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    router.refresh(); // pulls the new odometer and history
  };

  return (
    <main className="relative mx-auto max-w-md px-5 pb-56">
      <PageTop />
      {vehicle ? (
        <KindStage stageKey={`${kind}:${vehicle.id}`}>
          <DashboardBody
            vehicle={vehicle}
            logs={logs}
            fuel={props.fuel}
            readings={props.readings}
            tasks={tasks.filter((t) => t.vehicle_id === vehicle.id)}
            currency={props.currency}
            licenseExpiry={props.licenseExpiry}
            onComplete={handleComplete}
            onRemove={handleRemove}
          />
        </KindStage>
      ) : (
        <KindStage stageKey={`${kind}:none`}>
          <EmptyGarage kind={kind} />
        </KindStage>
      )}
    </main>
  );
}

interface BodyProps {
  vehicle: Vehicle;
  logs: LogEntry[];
  fuel: FuelEntry[];
  readings: Reading[];
  tasks: Task[];
  currency: string;
  licenseExpiry: string | null;
  onComplete: (t: Task) => Promise<Result>;
  onRemove: (id: string) => void;
}

function dueText(p: Prediction) {
  if (p.status === "overdue") return p.kmLeft <= 0 ? `${km(-p.kmLeft)} km overdue` : `${-p.daysLeft} days overdue`;
  return `${km(p.kmLeft)} km or ${shortDate(p.dueDate)}`;
}

function DashboardBody({ vehicle, logs, fuel, readings, tasks, currency, licenseExpiry, onComplete, onRemove }: BodyProps) {
  const root = useRef<HTMLDivElement>(null);
  const odo = useRef<HTMLSpanElement>(null);
  const inFlight = useRef<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => vehicleStats(vehicle, logs, fuel, readings), [vehicle, logs, fuel, readings]);
  const { predictions, ledger, kmPerDay } = stats;

  const oil = worstOf(predictions, ["Oil Change"]);
  const brakes = worstOf(predictions, ["Brake Pads"]);
  const suspension = worstOf(predictions, ["Wheel Alignment", "Wheel Balancing", "Suspension Check"]);
  const perKm = ledger.costPerKmOverall;

  const licenseDays = licenseExpiry ? daysUntil(licenseExpiry) : null;
  const licenseNote =
    licenseDays === null
      ? "Licence, vehicle papers and token tax, one tap"
      : licenseDays < 0
        ? `Licence expired ${-licenseDays} days ago`
        : `Licence valid for ${licenseDays} more days`;

  const recent = useMemo(() => {
    const items = [
      ...stats.logs.map((l) => ({
        id: `l${l.id}`,
        date: l.serviced_on,
        title: l.service_type,
        sub: `${CATEGORY_META[l.expense_type].label} · ${km(l.mileage)} km`,
        cost: Number(l.cost),
        href: `/logs/${l.id}/edit`,
        color: CATEGORY_META[l.expense_type].color,
      })),
      ...stats.fuel.map((f) => ({
        id: `f${f.id}`,
        date: f.filled_on,
        title: `Fuel at ${f.station}`,
        sub: `${Number(f.liters).toFixed(1)} L · ${km(f.odometer)} km`,
        cost: Number(f.total_cost),
        href: `/fuel/${f.id}/edit`,
        color: CATEGORY_META.fuel.color,
      })),
    ];
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [stats.logs, stats.fuel]);

  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from("[data-hero]", { autoAlpha: 0, y: 14, duration: 0.3, clearProps: "opacity,visibility,transform" })
          .from("[data-stat]", { autoAlpha: 0, y: 18, scale: 0.96, duration: 0.35, stagger: 0.05, clearProps: "opacity,visibility,transform" }, "-=0.2")
          .from("[data-reveal]", { autoAlpha: 0, y: 12, duration: 0.3, stagger: 0.04, clearProps: "opacity,visibility,transform" }, "-=0.2");

        const el = odo.current;
        if (el) {
          const counter = { v: 0 };
          gsap.to(counter, {
            v: vehicle.current_mileage,
            duration: 0.7,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = km(counter.v);
            },
          });
        }
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  /* Ring fills, check draws, title gets struck through, then the row fades away and the list closes up. */
  const complete = contextSafe(async (task: Task, btn: HTMLElement) => {
    if (inFlight.current.has(task.id)) return;
    inFlight.current.add(task.id);
    setError(null);

    const ring = btn.querySelector<HTMLElement>("[data-ring]");
    const check = btn.querySelector<SVGPathElement>("[data-check]");
    const strike = btn.querySelector<HTMLElement>("[data-strike]");
    const title = btn.querySelector<HTMLElement>("[data-title]");

    let tl: gsap.core.Timeline | null = null;
    if (ring && check && strike && title) {
      const len = check.getTotalLength();
      tl = gsap
        .timeline()
        .set(check, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 })
        .to(ring, { backgroundColor: MINT, borderColor: MINT, duration: 0.18 })
        .to(ring, { scale: 1.12, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out" }, "<")
        .to(check, { strokeDashoffset: 0, duration: 0.3, ease: "power2.out" }, "<0.05")
        .to(strike, { scaleX: 1, duration: 0.3, ease: "power2.out" }, "-=0.1")
        .to(title, { opacity: 0.45, duration: 0.2 }, "<")
        .to({}, { duration: 0.18 });
    }

    const res = await onComplete(task);
    inFlight.current.delete(task.id);

    if (!res.ok) {
      tl?.reverse();
      setError(res.error);
      return;
    }
    if (tl) await tl.then();
    onRemove(task.id);
  });

  const id = vehicle.id;

  return (
    <div ref={root}>
      {/* Hero */}
      <section data-hero className="cut cut-lg cut-hero relative mt-3 p-5">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-violet/30 blur-3xl" />
        <Link href={`/vehicles/${id}`} className="inline-flex min-h-11 items-center gap-1">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">{vehicle.name}</h1>
          <IconChevron className="size-5 text-mint" />
        </Link>
        <p className="text-sm text-dim">{[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || vehicle.plate || "Odometer"}</p>
        <div className="mt-3 flex items-baseline gap-2">
          <span key={`${id}-${vehicle.current_mileage}`} ref={odo} suppressHydrationWarning className="text-grad font-display text-6xl font-bold leading-none tabular-nums">
            {km(vehicle.current_mileage)}
          </span>
          <span className="font-display text-lg text-dim">KM</span>
        </div>
        <p className="mt-2 text-sm text-dim">
          {kmPerDay === null ? "Update your odometer to see your pace." : `About ${Math.round(kmPerDay)} km a day lately`}
        </p>
      </section>

      {/* Telemetry gauges */}
      <section data-stat className="mt-6 cut p-4">
        <div className="grid grid-cols-3 gap-2">
          <Gauge
            label="Oil life"
            value={oil ? oil.remainingPct : null}
            caption={oil ? `${km(Math.max(oil.kmLeft, 0))} km left` : "Log an oil change"}
            delay={0}
          />
          <Gauge
            label="Brake wear"
            invert
            value={brakes ? 100 - brakes.remainingPct : null}
            caption={brakes ? (brakes.status === "overdue" ? "Replace now" : `${km(Math.max(brakes.kmLeft, 0))} km left`) : "Log brake pads"}
            delay={0.12}
          />
          <Gauge
            label="Suspension"
            value={suspension ? suspension.remainingPct : null}
            caption={suspension ? "Rough-road pace" : "Log an alignment"}
            delay={0.24}
          />
        </div>
      </section>

      {/* Money */}
      <section className="mt-3 grid grid-cols-3 gap-3">
        <div data-stat className="cut p-3">
          <p className="text-xs text-dim">This month</p>
          <p className="mt-1 font-display text-lg font-bold tabular-nums">{money(ledger.thisMonth, currency)}</p>
        </div>
        <div data-stat className="cut p-3">
          <p className="text-xs text-dim">Monthly avg</p>
          <p className="mt-1 font-display text-lg font-bold tabular-nums">{money(ledger.avgMonthly, currency)}</p>
        </div>
        <div data-stat className="cut p-3">
          <p className="text-xs text-dim">Per km</p>
          <p className="mt-1 font-display text-lg font-bold tabular-nums">{perKm === null ? "-" : `${currency} ${perKm.toFixed(1)}`}</p>
        </div>
      </section>

      {/* Excise Safe Mode: a plain link so it still opens with no signal. */}
      <a
        data-reveal
        href="/excise"
        className="mt-4 flex cut cut-hot min-h-20 items-center gap-4 px-4"
      >
        <span className="cut cut-sm cut-lime grid size-12 shrink-0 place-items-center">
          <IconShield />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-lg font-semibold">Excise Safe Mode</span>
          <span className={`block text-sm ${licenseDays !== null && licenseDays < 30 ? "text-redline" : "text-dim"}`}>{licenseNote}</span>
        </span>
        <IconChevron className="ml-auto size-5 shrink-0 text-dim" />
      </a>

      {/* Quick actions */}
      <section data-reveal className="mt-3 grid grid-cols-2 gap-3">
        {[
          { href: `/logs/new?vehicle=${id}&type=fuel`, label: "Fuel up", Icon: IconFuel },
          { href: `/logs/new?vehicle=${id}`, label: "Add expense", Icon: IconPlus },
          { href: `/vehicles/${id}/odometer`, label: "Odometer", Icon: IconOdo },
          { href: "/ustad", label: "AI Ustad", Icon: IconChat },
        ].map(({ href, label, Icon }) => (
          <Link key={label} href={href} className="flex min-h-14 items-center gap-3 cut px-4 font-semibold transition-colors active:bg-obsidian-800">
            <Icon className="size-5 text-mint" />
            {label}
          </Link>
        ))}
      </section>

      {/* Predictions */}
      <section data-reveal className="mt-10">
        <h2 className="h-sec">Coming up</h2>
        {predictions.length === 0 ? (
          <p className="mt-2 text-sm text-dim">Log the same service twice and RevTrack learns how often you do it.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line cut">
            {predictions.slice(0, 4).map((p) => (
              <li key={p.serviceType} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="font-semibold">{p.serviceType}</p>
                  <p className="text-xs text-dim">
                    At {km(p.dueMileage)} km
                    {p.etaDays !== null && p.status !== "overdue" ? ` · about ${p.etaDays} days at your pace` : ""}
                    {p.accelerated ? " · rough-road interval" : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-right text-sm ${
                    p.status === "overdue" ? "font-semibold text-redline" : p.status === "soon" ? "font-semibold text-mint" : "text-dim"
                  }`}
                >
                  {dueText(p)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Checklist */}
      <section data-reveal className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="h-sec">To do</h2>
          <Link href={`/tasks/new?vehicle=${id}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-mint">
            Add task
          </Link>
        </div>

        {tasks.length === 0 ? (
          <p className="mt-1 text-sm text-dim">Nothing pending. Add planned work, or start a ready-made checklist.</p>
        ) : (
          <ul className="mt-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {tasks.map((t) => (
                <motion.li key={t.id} layout exit={{ opacity: 0, x: 32, transition: { duration: 0.25 } }} className="pb-2">
                  <button
                    type="button"
                    onClick={(e) => complete(t, e.currentTarget)}
                    aria-label={`Mark ${t.title} done`}
                    className="flex min-h-16 w-full items-center gap-4 cut px-4 py-2 text-left transition-colors active:bg-obsidian-800"
                  >
                    <span data-ring className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-dim">
                      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
                        <path data-check d="M5 12.5l4.5 4.5L19 7.5" stroke="#07070c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0" />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="relative inline-block max-w-full">
                        <span data-title className="block font-semibold">{t.title}</span>
                        <span data-strike aria-hidden className="absolute left-0 top-1/2 h-0.5 w-full bg-dim" style={{ transform: "scaleX(0)", transformOrigin: "left" }} />
                      </span>
                      <span className="block text-xs text-dim">
                        {t.due_date ? `Due ${shortDate(t.due_date)}` : "No date"}
                        {t.target_mileage ? ` · at ${km(t.target_mileage)} km` : ""}
                      </span>
                    </span>
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          {(["monsoon", "mechanic"] as const).map((k) => (
            <form key={k} action={addChecklist}>
              <input type="hidden" name="vehicle_id" value={id} />
              <input type="hidden" name="checklist" value={k} />
              <button type="submit" className="flex min-h-12 w-full items-center justify-center cut cut-sm px-3 text-center text-sm font-semibold">
                {CHECKLISTS[k].title}
              </button>
            </form>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-dim">Tap one to add a ready-made list to your to-do. Done items go straight into your history.</p>
      </section>

      {/* Recent */}
      <section data-reveal className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="h-sec">Recent activity</h2>
          <Link href="/ledger" className="inline-flex min-h-11 items-center text-sm font-semibold text-mint">
            Ledger
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-1 text-sm text-dim">Nothing logged yet. Tap the green plus to add your first expense.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {recent.map((r) => (
              <li key={r.id}>
                <Link href={r.href} className="cut flex min-h-16 items-center gap-3 px-4 py-3">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: r.color }} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{r.title}</span>
                    <span className="block text-xs text-dim">
                      {shortDate(r.date)} · {r.sub}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-dim">{money(r.cost, currency)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && (
        <p role="alert" className="fixed inset-x-5 bottom-[calc(env(safe-area-inset-bottom)+150px)] z-50 mx-auto max-w-md rounded-2xl border border-redline/50 bg-obsidian-900 px-4 py-3 text-sm text-redline">
          {error}
        </p>
      )}
    </div>
  );
}
