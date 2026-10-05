"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { CATEGORIES, CATEGORY_META, type Ledger } from "@/lib/ledger";
import { money } from "@/lib/format";

gsap.registerPlugin(useGSAP);

const card = "cut";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div data-stat className={`${card} p-4`}>
      <p className="text-sm text-dim">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-dim">{hint}</p>}
    </div>
  );
}

const R = 38;
const CIRC = 2 * Math.PI * R;

export default function FinancialLedger({ ledger, currency }: { ledger: Ledger; currency: string }) {
  const root = useRef<HTMLDivElement>(null);
  const { fuel } = ledger;
  const active = CATEGORIES.filter((c) => ledger.byCategory[c] > 0);
  const maxMonth = Math.max(1, ...ledger.months.map((m) => m.total));
  const maxKmPerL = Math.max(1, ...ledger.stations.map((s) => s.avgKmPerL ?? 0));

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from("[data-stat]", { autoAlpha: 0, y: 22, duration: 0.5, stagger: 0.08, clearProps: "opacity,visibility,transform" })
          .from("[data-seg]", { autoAlpha: 0, duration: 0.4, stagger: 0.1 }, "-=0.2")
          .from("[data-bar]", { scaleY: 0, duration: 0.6, stagger: 0.05 }, "-=0.3")
          .from("[data-hbar]", { scaleX: 0, duration: 0.6, stagger: 0.07 }, "-=0.4");
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  // Donut segments laid end to end.
  let offset = 0;
  const segments = active.map((c) => {
    const len = (ledger.byCategory[c] / ledger.total) * CIRC;
    const seg = { c, len, offset };
    offset += len;
    return seg;
  });

  const perKm = ledger.costPerKmOverall;

  return (
    <div ref={root} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Monthly average" value={money(ledger.avgMonthly, currency)} hint="All spending" />
        <Stat label="This month" value={money(ledger.thisMonth, currency)} />
        <Stat label="Cost per km" value={perKm === null ? "No data" : `${currency} ${perKm.toFixed(1)}`} hint="Running plus upkeep" />
        <Stat
          label="Petrol economy"
          value={fuel.kmPerL === null ? "No data" : `${fuel.kmPerL.toFixed(1)} km/L`}
          hint={fuel.kmPerKg !== null ? `LPG ${fuel.kmPerKg.toFixed(1)} km/kg` : "Petrol fill to fill"}
        />
      </div>

      <div data-stat className={`${card} p-4`}>
        <p className="text-sm text-dim">Total cost of ownership</p>
        <p className="mt-1 font-display text-3xl font-bold tabular-nums">{money(ledger.total, currency)}</p>
      </div>

      {/* Breakdown */}
      <section data-stat className={`${card} p-4`}>
        <h2 className="font-display text-lg font-semibold">Where the money goes</h2>
        {ledger.total <= 0 ? (
          <p className="mt-2 text-sm text-dim">Log a service, part or fuel fill and the breakdown appears here.</p>
        ) : (
          <div className="mt-4 flex min-w-0 items-center gap-3 sm:gap-5">
            <svg viewBox="0 0 100 100" className="size-24 shrink-0 sm:size-32" role="img" aria-label="Spending split by category">
              <title>Spending split by category</title>
              <circle cx="50" cy="50" r={R} fill="none" stroke="#26262a" strokeWidth="14" />
              {segments.map(({ c, len, offset: off }) => (
                <circle
                  key={c}
                  data-seg
                  cx="50"
                  cy="50"
                  r={R}
                  fill="none"
                  stroke={CATEGORY_META[c].color}
                  strokeWidth="14"
                  strokeDasharray={`${Math.max(len - 1.5, 0)} ${CIRC}`}
                  strokeDashoffset={-off}
                  transform="rotate(-90 50 50)"
                />
              ))}
            </svg>
            <ul className="min-w-0 flex-1 space-y-2">
              {active.map((c) => (
                <li key={c} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-3 shrink-0 rounded-full" style={{ background: CATEGORY_META[c].color }} aria-hidden />
                    <span className="truncate">{CATEGORY_META[c].label}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-dim">
                    {Math.round((ledger.byCategory[c] / ledger.total) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {ledger.total > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-line pt-3 text-sm">
            {active.map((c) => (
              <li key={c} className="flex justify-between">
                <span className="text-dim">{CATEGORY_META[c].label}</span>
                <span className="tabular-nums">{money(ledger.byCategory[c], currency)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Monthly chart */}
      <section data-stat className={`${card} p-4`}>
        <h2 className="font-display text-lg font-semibold">Last six months</h2>
        <svg viewBox="0 0 320 160" className="mt-3 w-full" role="img" aria-label="Monthly spending, stacked by category">
          <title>Monthly spending, stacked by category</title>
          <line x1="0" y1="130" x2="320" y2="130" stroke="#26262a" />
          {ledger.months.map((m, i) => {
            const x = 12 + i * 52;
            let y = 130;
            return (
              <g key={m.key}>
                {CATEGORIES.map((c) => {
                  const h = (m.byCategory[c] / maxMonth) * 110;
                  if (h <= 0) return null;
                  y -= h;
                  return (
                    <rect
                      key={c}
                      data-bar
                      x={x}
                      y={y}
                      width="36"
                      height={h}
                      rx="3"
                      fill={CATEGORY_META[c].color}
                      style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
                    />
                  );
                })}
                <text x={x + 18} y="150" textAnchor="middle" fontSize="11" fill="#9a9aa2">
                  {m.label}
                </text>
              </g>
            );
          })}
        </svg>
        <table className="sr-only">
          <caption>Monthly spending</caption>
          <tbody>
            {ledger.months.map((m) => (
              <tr key={m.key}>
                <th scope="row">{m.label}</th>
                <td>{money(m.total, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-dim">
          {CATEGORIES.map((c) => (
            <li key={c} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: CATEGORY_META[c].color }} aria-hidden />
              {CATEGORY_META[c].label}
            </li>
          ))}
        </ul>
      </section>

      {/* Fuel run-rate */}
      <section data-stat className={`${card} p-4`}>
        <h2 className="font-display text-lg font-semibold">Fuel run-rate</h2>
        {fuel.kmPerL === null && fuel.kmPerKg === null ? (
          <p className="mt-2 text-sm text-dim">Log two full petrol or LPG fills (same type) to measure economy and cost per km.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {fuel.kmPerL !== null && (
              <dl className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <dt className="text-xs text-dim">Petrol</dt>
                  <dd className="font-display text-xl font-bold tabular-nums">{fuel.kmPerL.toFixed(1)}</dd>
                  <dd className="text-xs text-dim">km/L</dd>
                </div>
                <div>
                  <dt className="text-xs text-dim">Petrol cost</dt>
                  <dd className="font-display text-xl font-bold tabular-nums">{fuel.costPerKmPetrol === null ? "-" : fuel.costPerKmPetrol.toFixed(1)}</dd>
                  <dd className="text-xs text-dim">{currency}/km</dd>
                </div>
                <div>
                  <dt className="text-xs text-dim">On petrol</dt>
                  <dd className="font-display text-xl font-bold tabular-nums">{Math.round(fuel.totalKmPetrol).toLocaleString("en-US")}</dd>
                  <dd className="text-xs text-dim">km</dd>
                </div>
              </dl>
            )}
            {fuel.kmPerKg !== null && (
              <dl className="grid grid-cols-3 gap-3 text-center border-t border-line/60 pt-4">
                <div>
                  <dt className="text-xs text-dim">LPG</dt>
                  <dd className="font-display text-xl font-bold tabular-nums">{fuel.kmPerKg.toFixed(1)}</dd>
                  <dd className="text-xs text-dim">km/kg</dd>
                </div>
                <div>
                  <dt className="text-xs text-dim">LPG cost</dt>
                  <dd className="font-display text-xl font-bold tabular-nums">{fuel.costPerKmLpg === null ? "-" : fuel.costPerKmLpg.toFixed(1)}</dd>
                  <dd className="text-xs text-dim">{currency}/km</dd>
                </div>
                <div>
                  <dt className="text-xs text-dim">On LPG</dt>
                  <dd className="font-display text-xl font-bold tabular-nums">{Math.round(fuel.totalKmLpg).toLocaleString("en-US")}</dd>
                  <dd className="text-xs text-dim">km</dd>
                </div>
              </dl>
            )}
          </div>
        )}
      </section>

      {/* Station quality */}
      <section data-stat className={`${card} p-4`}>
        <h2 className="font-display text-lg font-semibold">Petrol station quality</h2>
        {ledger.stations.length === 0 ? (
          <p className="mt-2 text-sm text-dim">Tag each fill with its station and area to see which pumps give you the best mileage.</p>
        ) : (
          <>
            {ledger.insight && <p className="mt-2 rounded-xl border border-mint/30 bg-mint/5 px-3 py-2 text-sm text-mint">{ledger.insight}</p>}
            <ul className="mt-3 space-y-4">
              {ledger.stations.map((s) => (
                <li key={s.station}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold">{s.station}</span>
                    <span className="tabular-nums text-sm">
                      {s.avgKmPerL === null ? <span className="text-dim">Not enough fills</span> : `${s.avgKmPerL.toFixed(1)} km/L`}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-obsidian-700">
                    <div
                      data-hbar
                      className="h-full rounded-full bg-mint"
                      style={{ width: `${((s.avgKmPerL ?? 0) / maxKmPerL) * 100}%`, transformOrigin: "left" }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-dim">
                    {s.fills} fill{s.fills === 1 ? "" : "s"}
                    {s.avgPricePerL !== null && ` · ${currency} ${Math.round(s.avgPricePerL)}/L`}
                    {s.areas.length > 0 && ` · ${s.areas.join(", ")}`}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
