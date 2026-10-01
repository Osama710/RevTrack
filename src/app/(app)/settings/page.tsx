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

  return (
    <FormPage title="Settings" error={sp.error} message={sp.message}>
      <section>
        <h2 className="font-display text-lg font-semibold">Profile</h2>
        <p className="mt-1 break-all text-sm text-dim">{user.email}</p>
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
        <h2 className="font-display text-lg font-semibold">Password</h2>
        <form action={updatePassword} className="mt-4 space-y-5">
          <Field label="New password" hint="At least 8 characters.">
            <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
          </Field>
          <button type="submit" className="h-14 w-full rounded-full border border-line font-display text-lg font-semibold transition-transform active:scale-[0.98]">Update password</button>
        </form>
      </section>

      <section className="mt-10 grid gap-2">
        <Link href="/vehicles/new" className="flex h-14 items-center rounded-2xl border border-line px-4 font-semibold active:bg-obsidian-800">Add a vehicle</Link>
        <Link href="/tasks/new" className="flex h-14 items-center rounded-2xl border border-line px-4 font-semibold active:bg-obsidian-800">Add a task</Link>
      </section>

      <SignOutForm action={signOut} />
    </FormPage>
  );
}
