import Link from "next/link";

export const inputClass =
  "h-12 w-full rounded-xl border border-line bg-obsidian-900 px-4 text-bone placeholder:text-dim transition-[border-color,box-shadow] duration-200 focus:border-mint focus:outline-none focus:ring-4 focus:ring-mint/15";

export const buttonClass =
  "h-14 w-full rounded-full bg-mint font-display text-lg font-semibold text-obsidian-950 transition-transform active:scale-[0.98]";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-dim">{hint}</span>}
    </label>
  );
}

export function FormPage({
  title,
  error,
  message,
  back = "/dashboard",
  children,
}: {
  title: string;
  error?: string;
  message?: string;
  back?: string | null;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 pb-[calc(env(safe-area-inset-bottom)+32px)] pt-[calc(env(safe-area-inset-top)+20px)]">
      {back && (
        <Link href={back} className="inline-flex h-11 items-center text-sm text-dim">
          Back
        </Link>
      )}
      <h1 className="mt-2 font-display text-3xl font-semibold">{title}</h1>
      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-redline/50 px-4 py-3 text-sm text-redline">
          {error}
        </p>
      )}
      {message && <p className="mt-4 rounded-xl border border-mint/40 px-4 py-3 text-sm text-mint">{message}</p>}
      <div className="mt-6">{children}</div>
    </main>
  );
}
