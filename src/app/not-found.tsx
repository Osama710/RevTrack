import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-content-center gap-4 px-5 text-center">
      <h1 className="font-display text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-dim">That page doesn&apos;t exist, or it isn&apos;t yours.</p>
      <Link href="/dashboard" className="grid h-14 place-items-center rounded-full bg-mint font-display text-lg font-semibold text-obsidian-950">
        Back to dashboard
      </Link>
    </main>
  );
}
