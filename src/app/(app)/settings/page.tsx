import Link from "next/link";
import { signOut } from "../../(auth)/actions";
import { updatePassword, updateProfile } from "../actions";
import SignOutForm from "@/components/SignOutForm";
import { Field, FormPage, buttonClass, inputClass } from "@/components/ui/form";
import { requireUser } from "@/lib/auth";
import { CURRENCIES, getProfile } from "@/lib/profile";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const sp = await searchParams;
  const { supabase, user } = await requireUser();
  const profile = await getProfile(supabase);

  const initial = (profile.displayName?.trim()[0] ?? user.email?.[0] ?? "R").toUpperCase();

  return (
    <FormPage title="Settings" error={sp.error} message={sp.message}>
      <section className="cut cut-lg cut-hero relative mb-8 flex items-center gap-4 p-5">
        <span className="grid size-16 shrink-0 place-items-center bg-obsidian-950/80 font-display text-2xl font-bold text-grad [clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="font-display text-xl font-bold">{profile.displayName ?? "Rider"}</p>
          <p className="truncate text-sm text-dim">{user.email}</p>
          <p className="mt-1 text-xs text-mint">{profile.currency} · Tap avatar on Home anytime</p>
        </div>
      </section>
      <section>
        <h2 className="h-sec">Edit profile</h2>
        <form action={updateProfile} className="mt-4 space-y-5">
          <Field label="Name">
            <input name="display_name" maxLength={60} defaultValue={profile.displayName ?? ""} autoComplete="name" className={inputClass} />
          </Field>
          <Field label="Currency" hint="Shown next to costs.">
            <select name="currency" defaultValue={profile.currency} className={inputClass}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <button type="submit" className={buttonClass}>Save profile</button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="h-sec">Password</h2>
        <form action={updatePassword} className="mt-4 space-y-5">
          <Field label="New password" hint="At least 8 characters.">
            <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
          </Field>
          <button type="submit" className="btn-cut-ghost h-14 w-full text-lg font-semibold">Update password</button>
        </form>
      </section>

      <section className="mt-10 grid gap-2">
        <Link href="/vehicles/new" className="cut flex h-14 items-center px-4 font-semibold">Add a vehicle</Link>
        <Link href="/tasks/new" className="cut flex h-14 items-center px-4 font-semibold">Add a task</Link>
      </section>

      <SignOutForm action={signOut} />
    </FormPage>
  );
}
