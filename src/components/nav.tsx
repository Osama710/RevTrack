"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useGarage } from "@/components/garage-context";
import { IconBell, IconBike, IconCar, IconDash, IconGarage, IconLedger, IconPlus } from "@/components/icons";
import type { VehicleKind } from "@/types/db";

const KINDS: { key: VehicleKind; label: string; Icon: typeof IconCar }[] = [
  { key: "car", label: "Cars", Icon: IconCar },
  { key: "bike", label: "Bikes", Icon: IconBike },
];

/** Sticky top bar: the Cars / Bikes capsule, plus vehicle chips when there is more than one of the kind. */
export function PageTop() {
  const { kind, setKind, counts, kindVehicles, vehicle, selectVehicle } = useGarage();

  return (
    <header className="sticky top-0 z-30 -mx-5 bg-obsidian-950/85 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] backdrop-blur-md">
      <div role="tablist" aria-label="Vehicle type" className="flex rounded-full border border-line bg-obsidian-900 p-1">
        {KINDS.map(({ key, label, Icon }) => {
          const active = kind === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setKind(key)}
              className={`relative flex h-12 flex-1 items-center justify-center rounded-full font-display font-semibold transition-colors duration-200 active:opacity-80 ${
                active ? "text-obsidian-950" : "text-dim"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="kind-pill"
                  className="absolute inset-0 rounded-full bg-mint"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <Icon className="size-5" />
                {label}
                <span className="text-xs font-medium opacity-70">{counts[key]}</span>
              </span>
            </button>
          );
        })}
      </div>

      {kindVehicles.length > 1 && (
        <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
          {kindVehicles.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => selectVehicle(v.id)}
              aria-pressed={v.id === vehicle?.id}
              className={`h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors active:opacity-80 ${
                v.id === vehicle?.id ? "border-bone bg-bone text-obsidian-950" : "border-line text-dim"
              }`}
            >
              {v.name}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

/** Slides content in and out when the car/bike or vehicle changes. Children must be driven by props, not context. */
export function KindStage({ stageKey, children }: { stageKey: string; children: ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={stageKey}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
        exit={{ opacity: 0, x: -16, transition: { duration: 0.14 } }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

const TABS = [
  { href: "/dashboard", label: "Dashboard", Icon: IconDash },
  { href: "/ledger", label: "Ledger", Icon: IconLedger },
  { href: "/garage", label: "Garage", Icon: IconGarage },
  { href: "/notifications", label: "Alerts", Icon: IconBell },
];

/** Fixed bottom dock: four tabs and one primary action, all inside thumb reach. */
export function BottomDock() {
  const path = usePathname();
  if (!TABS.some((t) => t.href === path)) return null;

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)]">
      <div className="mx-auto max-w-md">
        <div className="mb-3 flex justify-end pr-1">
          <Link
            href="/logs/new"
            aria-label="Add an expense"
            className="grid size-14 place-items-center rounded-full bg-mint text-obsidian-950 shadow-[0_8px_30px_rgb(0_245_160/0.25)] transition-transform active:scale-90"
          >
            <IconPlus />
          </Link>
        </div>
        <ul className="grid grid-cols-4 rounded-3xl border border-line bg-obsidian-900/95 p-1.5 backdrop-blur-md">
          {TABS.map(({ href, label, Icon }) => {
            const active = path === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-semibold transition-colors active:opacity-70 ${
                    active ? "text-mint" : "text-dim"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="dock-active"
                      className="absolute inset-0 rounded-2xl bg-mint/10"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon className="relative size-6" />
                  <span className="relative">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
