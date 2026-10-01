"use client";

export default function ErrorFallback({
  reset,
  title = "Something went wrong",
  detail,
}: {
  reset: () => void;
  title?: string;
  detail?: string;
}) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-content-center gap-4 px-5 text-center">
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      {detail && (
        <p className="cut mx-auto max-w-sm px-4 py-3 text-left text-xs text-dim [word-break:break-word]">{detail}</p>
      )}
      <p className="text-sm text-dim">Your data is safe. Try again, or head back to the dashboard.</p>
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
