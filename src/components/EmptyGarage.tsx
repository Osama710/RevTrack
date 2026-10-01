import Link from "next/link";
import type { VehicleKind } from "@/types/db";

export default function EmptyGarage({ kind }: { kind: VehicleKind }) {
  const word = kind === "car" ? "car" : "bike";
  return (
    <section className="mt-10 rounded-3xl border border-dashed border-line p-8 text-center">
      <h1 className="font-display text-2xl font-semibold">No {word}s yet</h1>
      <p className="mx-auto mt-2 max-w-[28ch] text-sm text-dim">Add your first {word} to start tracking services, fuel and papers.</p>
      <Link
        href={`/vehicles/new?kind=${kind}`}
        className="mt-6 inline-flex h-12 items-center rounded-full bg-mint px-6 font-display font-semibold text-obsidian-950 transition-transform active:scale-95"
      >
        Add a {word}
      </Link>
    </section>
  );
}
