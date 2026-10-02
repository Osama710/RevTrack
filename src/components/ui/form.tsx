import BackLink from "@/components/ui/BackLink";
import SubmitButton from "@/components/ui/SubmitButton";

export const inputClass =
  "input-cut h-10 w-full px-3 text-sm text-bone placeholder:text-dim transition-[border-color,box-shadow] duration-200";

export const cardClass = "cut";

export const buttonClass = "btn-cut h-11 w-full text-sm font-semibold";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-dim">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-dim">{hint}</span>}
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
    <main className="page-main mx-auto min-h-dvh min-w-0 overflow-x-hidden pt-[calc(env(safe-area-inset-top)+12px)]">
      <div className="flex items-center gap-2">
        {back && <BackLink href={back} />}
        <h1 className="font-display text-lg font-bold uppercase tracking-wide">{title}</h1>
      </div>
      {error && (
        <p role="alert" className="cut mt-3 px-3 py-2.5 text-xs text-redline [--panel:rgb(255_61_110/0.08)]">
          {error}
        </p>
      )}
      {message && <p className="cut mt-3 px-3 py-2.5 text-xs text-mint [--panel:rgb(200_255_46/0.06)]">{message}</p>}
      <div className="mt-4">{children}</div>
    </main>
  );
}

export { SubmitButton };
