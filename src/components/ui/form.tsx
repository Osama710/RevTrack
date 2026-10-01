import Link from "next/link";

export const inputClass =
  "input-cut h-12 w-full px-4 text-bone placeholder:text-dim transition-[border-color,box-shadow] duration-200";

export const cardClass = "cut";

export const buttonClass = "btn-cut h-14 w-full text-lg";

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
      <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-wide">{title}</h1>
      {error && (
        <p role="alert" className="cut mt-4 px-4 py-3 text-sm text-redline [--panel:rgb(255_61_110/0.08)]">
          {error}
        </p>
      )}
      {message && <p className="cut mt-4 px-4 py-3 text-sm text-mint [--panel:rgb(200_255_46/0.06)]">{message}</p>}
      <div className="mt-6">{children}</div>
    </main>
  );
}
