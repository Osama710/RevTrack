"use client";

import { clearSnapshot } from "@/lib/excise-store";

/** Signing out also wipes the offline copy of your papers from this device. */
export default function SignOutForm({ action }: { action: () => void | Promise<void> }) {
  return (
    <form action={action} onSubmit={() => void clearSnapshot()} className="mt-8">
      <button type="submit" className="h-14 w-full rounded-full border border-redline/60 font-display font-semibold text-redline transition-transform active:scale-[0.98]">
        Sign out
      </button>
    </form>
  );
}
