"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import AppLink from "@/components/ui/AppLink";
import { useProfile } from "@/components/profile-context";
import { useGarage } from "@/components/garage-context";
import { IconBell, IconBike, IconCar, IconDash, IconGarage, IconLedger, IconPlus } from "@/components/icons";
import type { VehicleKind } from "@/types/db";

const KINDS: { key: VehicleKind; label: string; Icon: typeof IconCar }[] = [
  { key: "car", label: "Cars", Icon: IconCar },
  { key: "bike", label: "Bikes", Icon: IconBike },
];

/** Sticky glass header: profile avatar + greeting + alerts, then a kind switch and a rail of vehicle chips. */
export function PageTop() {
  const { kind, setKind, counts, kindVehicles, vehicle, selectVehicle } = useGarage();
  const { name } = useProfile();
  const initial = (name?.trim()[0] ?? "R").toUpperCase();

  return (
    <header className="sticky top-0 z-30 -mx-4 border-b border-line/60 bg-obsidian-950/80 px-4 pb-2.5 pt-[calc(env(safe-area-inset-top)+8px)] backdrop-blur-lg">
      <div className="flex items-center gap-2.5">
        <AppLink href="/settings" aria-label="Your profile" className="cut cut-sm cut-hot grid size-9 shrink-0 place-items-center">
          <span className="relative grid size-[calc(100%-2px)] place-items-center bg-obsidian-900 font-display text-sm font-bold text-grad [clip-path:polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,6px_100%,0_calc(100%-6px))]">
            {initial}
          </span>
        </AppLink>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-[10px] font-medium uppercase tracking-wider text-dim">Salam</p>
          <p className="truncate font-display text-base font-semibold">{name ?? "Rider"}</p>
        </div>
        <AppLink href="/notifications" aria-label="Alerts" className="cut cut-sm grid size-9 place-items-center text-bone">
          <IconBell className="size-4" />
        </AppLink>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
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
                onClick={() => setKind(key)}
                className={`relative grid h-9 w-10 place-items-center transition-colors duration-150 ${active ? "text-obsidian-950" : "text-dim"}`}
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
                className={`cut cut-sm h-9 shrink-0 px-3 font-display text-xs font-semibold uppercase tracking-wide ${on ? "cut-lime" : "text-dim"}`}
              >
                {v.name}
              </button>
            );
          })}
          <AppLink href="/vehicles/new" aria-label="Add vehicle" className="cut cut-sm grid h-9 w-9 shrink-0 place-items-center text-mint">
            <IconPlus className="size-4" />
          </AppLink>
        </div>
      </div>
    </header>
  );
}

export function KindStage({ stageKey, children }: { stageKey: string; children: ReactNode }) {
  return <div key={stageKey}>{children}</div>;
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
        <AppLink
          href={href}
          aria-current={active ? "page" : undefined}
          className={`relative flex min-h-12 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors active:scale-95 ${active ? "text-mint" : "text-dim"}`}
        >
          {active && (
            <motion.span layoutId="dock-active" className="absolute inset-x-3 top-0 h-0.5 bg-mint shadow-[0_0_14px_2px_#c8ff2e]" transition={{ type: "spring", stiffness: 500, damping: 36 }} />
          )}
          <Icon className="size-5" />
          {label}
        </AppLink>
      </li>
    );
  };

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)]">
      <ul className="cut mx-auto grid max-w-md grid-cols-5 items-center px-0.5 backdrop-blur-xl [--c:12px] [--panel:rgb(12_12_20/0.92)]">
        {LEFT.map(tab)}
        <li className="grid place-items-center">
          <AppLink
            href="/logs/new"
            aria-label="Add an expense"
            className="fab-pulse cut cut-lime relative grid size-10 place-items-center transition-transform active:scale-95"
          >
            <IconPlus className="size-5" />
          </AppLink>
        </li>
        {RIGHT.map(tab)}
      </ul>
    </nav>
  );
}
