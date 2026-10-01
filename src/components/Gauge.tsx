"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";

gsap.registerPlugin(useGSAP);

const R = 42;
const C = 2 * Math.PI * R;
const ARC = C * 0.75; // 270 degrees, open at the bottom

interface Props {
  label: string;
  /** 0 to 100, or null when there is no data yet. */
  value: number | null;
  caption: string;
  /** True when a high value is bad (brake wear). */
  invert?: boolean;
  delay?: number;
}

export default function Gauge({ label, value, caption, invert = false, delay = 0 }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const arc = useRef<SVGCircleElement>(null);
  const num = useRef<HTMLSpanElement>(null);

  const pct = value === null ? 0 : Math.max(0, Math.min(100, Math.round(value)));
  const bad = value !== null && (invert ? pct >= 80 : pct <= 20);
  const stroke = bad ? "#ff3d6e" : "#c8ff2e";
  const target = ARC * (1 - pct / 100);

  useGSAP(
    () => {
      const el = arc.current;
      if (!el || value === null) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(el, { strokeDashoffset: ARC }, { strokeDashoffset: target, duration: 1.1, delay: delay + 0.3, ease: "power3.out" });
        const counter = { v: 0 };
        gsap.to(counter, {
          v: pct,
          duration: 1.1,
          delay: delay + 0.3,
          ease: "power3.out",
          onUpdate: () => {
            if (num.current) num.current.textContent = String(Math.round(counter.v));
          },
        });
      });
      return () => mm.revert();
    },
    { dependencies: [pct, value === null], scope: root }
  );

  return (
    <div ref={root} className="text-center" role="img" aria-label={`${label}: ${value === null ? "no data yet" : `${pct} percent`}. ${caption}`}>
      <div className="relative mx-auto aspect-square w-full max-w-28">
        <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
          <circle cx="50" cy="50" r={R} fill="none" stroke="#26262a" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${ARC} ${C}`} transform="rotate(135 50 50)" />
          {value !== null && (
            <circle
              ref={arc}
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={stroke}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${ARC} ${C}`}
              strokeDashoffset={target}
              transform="rotate(135 50 50)"
            />
          )}
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          {value === null ? (
            <span className="text-sm text-dim">No data</span>
          ) : (
            <span className={`font-display text-2xl font-bold tabular-nums ${bad ? "text-redline" : "text-bone"}`}>
              <span key={pct} ref={num}>{pct}</span>
              <span className="text-sm font-medium text-dim">%</span>
            </span>
          )}
        </div>
      </div>
      <p className="mt-1 text-sm font-semibold">{label}</p>
      <p className="text-xs text-dim">{caption}</p>
    </div>
  );
}
