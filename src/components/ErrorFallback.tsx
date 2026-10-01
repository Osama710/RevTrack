"use client";

export default function ErrorFallback({ reset, title = "Something went wrong" }: { reset: () => void; title?: string }) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-content-center gap-4 px-5 text-center">
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-dim">Your data is safe. Try again, and if it keeps happening, go back to the dashboard.</p>
      <div className="grid gap-2">
        <button type="button" onClick={reset} className="btn-cut h-14 px-8 text-lg">
          Try again
        </button>
        <a href="/dashboard" className="cut grid h-14 place-items-center font-display font-semibold">
          Back to dashboard
        </a>
      </div>
    </main>
  );
}
