import Link from "next/link";
import { signOut } from "../../(auth)/actions";
import { requireUser } from "@/lib/auth";
import { FormPage } from "@/components/ui/form";

export default async function SettingsPage() {
  const { user } = await requireUser();

  return (
    <FormPage title="Settings">
      <div className="rounded-2xl border border-line bg-obsidian-900 px-4 py-4">
        <p className="text-sm text-dim">Signed in as</p>
        <p className="mt-0.5 break-all font-semibold">{user.email}</p>
      </div>
      <div className="mt-4 grid gap-2">
        <Link href="/vehicles/new" className="flex h-14 items-center rounded-2xl border border-line px-4 font-semibold active:bg-obsidian-800">Add a vehicle</Link>
        <Link href="/tasks/new" className="flex h-14 items-center rounded-2xl border border-line px-4 font-semibold active:bg-obsidian-800">Add a task</Link>
      </div>
      <form action={signOut} className="mt-8">
        <button type="submit" className="h-14 w-full rounded-full border border-redline/60 font-display font-semibold text-redline transition-transform active:scale-[0.98]">
          Sign out
        </button>
      </form>
    </FormPage>
  );
}
