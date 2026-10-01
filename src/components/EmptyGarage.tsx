"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { useRef } from "react";
import type { VehicleKind } from "@/types/db";

gsap.registerPlugin(useGSAP);

export default function EmptyGarage({ kind }: { kind: VehicleKind }) {
  const word = kind === "car" ? "car" : "bike";
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-empty]", { autoAlpha: 0, y: 20, duration: 0.4, stagger: 0.08, ease: "back.out(1.4)", clearProps: "all" });
    },
    { scope: ref }
  );

  return (
    <section ref={ref} className="cut cut-lg cut-hero relative mt-8 p-8 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-obsidian-950/40 [clip-path:inherit]" />
      <p data-empty className="relative font-mono text-xs tracking-widest text-mint">GARAGE EMPTY</p>
      <h1 data-empty className="relative mt-2 font-display text-3xl font-bold uppercase">No {word}s yet</h1>
      <p data-empty className="relative mx-auto mt-2 max-w-[28ch] text-sm text-dim">
        Drop your first {word} in — track fuel, papers, and vibes.
      </p>
      <Link
        data-empty
        href={`/vehicles/new?kind=${kind}`}
        className="btn-cut relative mt-8 inline-flex h-12 items-center px-8 text-base"
      >
        Add a {word}
      </Link>
    </section>
  );
}
