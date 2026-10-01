"use client";

export default function ErrorFallback({ reset, title = "Something went wrong" }: { reset: () => void; title?: string }) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-content-center gap-4 px-5 text-center">
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-dim">Your data is safe. Try again, and if it keeps happening, go back to the dashboard.</p>
      <div className="grid gap-2">
        <button type="button" onClick={reset} className="h-14 rounded-full bg-mint font-display text-lg font-semibold text-obsidian-950 transition-transform active:scale-[0.98]">
          Try again
        </button>
        <a href="/dashboard" className="grid h-14 place-items-center rounded-full border border-line font-display font-semibold">
          Back to dashboard
        </a>
      </div>
    </main>
  );
}
