"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useProfile } from "@/components/profile-context";
import { useGarage } from "@/components/garage-context";
import { IconBell, IconBike, IconCar, IconDash, IconGarage, IconLedger, IconPlus } from "@/components/icons";
import type { VehicleKind } from "@/types/db";

gsap.registerPlugin(useGSAP);

const KINDS: { key: VehicleKind; label: string; Icon: typeof IconCar }[] = [
  { key: "car", label: "Cars", Icon: IconCar },
  { key: "bike", label: "Bikes", Icon: IconBike },
];

/** Sticky glass header: profile avatar + greeting + alerts, then a kind switch and a rail of vehicle chips. */
export function PageTop() {
  const { kind, setKind, counts, kindVehicles, vehicle, selectVehicle } = useGarage();
  const { name } = useProfile();
  const root = useRef<HTMLElement>(null);
  const initial = (name?.trim()[0] ?? "R").toUpperCase();

  // Icon pops with a little overshoot whenever the kind flips.
  useGSAP(
    () => {
      gsap.fromTo("[data-kind-active] svg", { scale: 0.4, rotate: -35 }, { scale: 1, rotate: 0, duration: 0.45, ease: "back.out(2.4)" });
      gsap.from("[data-chip]", { autoAlpha: 0, x: 16, duration: 0.3, stagger: 0.05, ease: "power3.out", clearProps: "all" });
    },
    { scope: root, dependencies: [kind] }
  );

  return (
    <header ref={root} className="sticky top-0 z-30 -mx-5 bg-obsidian-950/70 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+10px)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <Link href="/settings" aria-label="Your profile" className="cut cut-sm cut-hot grid size-12 shrink-0 place-items-center">
          <span className="relative grid size-[calc(100%-3px)] place-items-center bg-obsidian-900 font-display text-xl font-bold text-grad [clip-path:polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,8px_100%,0_calc(100%-8px))]">
            {initial}
          </span>
        </Link>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-xs font-medium tracking-wide text-dim">Salam,</p>
          <p className="truncate font-display text-lg font-bold">{name ?? "Rider"}</p>
        </div>
        <Link href="/notifications" aria-label="Alerts" className="cut cut-sm grid size-12 place-items-center text-bone">
          <IconBell className="size-5" />
        </Link>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div role="tablist" aria-label="Vehicle type" className="cut cut-sm flex shrink-0 p-0.5">
          {KINDS.map(({ key, label, Icon }) => {
            const active = kind === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`${label} (${counts[key]})`}
                data-kind-active={active ? "" : undefined}
                onClick={() => setKind(key)}
                className={`relative grid h-11 w-12 place-items-center transition-colors duration-150 ${active ? "text-obsidian-950" : "text-dim"}`}
              >
                {active && (
                  <motion.span
                    layoutId="kind-pill"
                    className="absolute inset-0 bg-mint [clip-path:polygon(0_0,calc(100%-7px)_0,100%_7px,100%_100%,7px_100%,0_calc(100%-7px))]"
                    transition={{ type: "spring", stiffness: 500, damping: 36 }}
                  />
                )}
                <Icon className="relative size-5" />
              </button>
            );
          })}
        </div>

        <div className="-mr-5 flex min-w-0 flex-1 gap-2 overflow-x-auto pr-5 [scrollbar-width:none]">
          {kindVehicles.map((v) => {
            const on = v.id === vehicle?.id;
            return (
              <button
                key={v.id}
                data-chip
                type="button"
                onClick={() => selectVehicle(v.id)}
                aria-pressed={on}
                className={`cut cut-sm h-12 shrink-0 px-4 font-display text-sm font-semibold uppercase tracking-wide ${on ? "cut-lime" : "text-dim"}`}
              >
                {v.name}
              </button>
            );
          })}
          <Link data-chip href="/vehicles/new" aria-label="Add vehicle" className="cut cut-sm grid h-12 w-12 shrink-0 place-items-center text-mint">
            <IconPlus className="size-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/** GSAP rise when car/bike or vehicle changes — no exit wait. */
export function KindStage({ stageKey, children }: { stageKey: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(ref.current, { autoAlpha: 0, y: 14, scale: 0.98, duration: 0.22, ease: "power3.out", clearProps: "all" });
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [stageKey] }
  );
  return <div ref={ref}>{children}</div>;
}

const LEFT = [
  { href: "/dashboard", label: "Home", Icon: IconDash },
  { href: "/ledger", label: "Ledger", Icon: IconLedger },
];
const RIGHT = [
  { href: "/garage", label: "Garage", Icon: IconGarage },
  { href: "/notifications", label: "Alerts", Icon: IconBell },
];

/** Floating cut-corner dock with the primary action built into the centre. */
export function BottomDock() {
  const path = usePathname();
  if (![...LEFT, ...RIGHT].some((t) => t.href === path)) return null;

  const tab = ({ href, label, Icon }: (typeof LEFT)[number]) => {
    const active = path === href;
    return (
      <li key={href}>
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold uppercase tracking-wider transition-colors active:scale-90 ${active ? "text-mint" : "text-dim"}`}
        >
          {active && (
            <motion.span layoutId="dock-active" className="absolute inset-x-3 top-0 h-0.5 bg-mint shadow-[0_0_14px_2px_#c8ff2e]" transition={{ type: "spring", stiffness: 500, damping: 36 }} />
          )}
          <Icon className={`size-6 transition-transform duration-200 ${active ? "-translate-y-0.5" : ""}`} />
          {label}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)]">
      <ul className="cut cut-lg mx-auto grid max-w-md grid-cols-5 items-center px-1 backdrop-blur-xl [--panel:rgb(12_12_20/0.88)]">
        {LEFT.map(tab)}
        <li className="grid place-items-center">
          <Link
            href="/logs/new"
            aria-label="Add an expense"
            className="fab-pulse cut cut-lime relative grid size-12 place-items-center transition-transform active:scale-90"
          >
            <IconPlus />
          </Link>
        </li>
        {RIGHT.map(tab)}
      </ul>
    </nav>
  );
}
