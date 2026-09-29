import Link from "next/link";
import { signIn } from "../actions";
import { Field, FormPage, buttonClass, inputClass } from "@/components/ui/form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const sp = await searchParams;
  return (
    <FormPage title="Sign in to RevTrack" back={null} error={sp.error} message={sp.message}>
      <form action={signIn} className="space-y-5">
        <Field label="Email">
          <input name="email" type="email" required autoComplete="email" inputMode="email" className={inputClass} />
        </Field>
        <Field label="Password">
          <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
        </Field>
        <button type="submit" className={buttonClass}>Sign in</button>
      </form>
      <p className="mt-6 text-center text-sm text-dim">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-mint">Create an account</Link>
      </p>
    </FormPage>
  );
}
