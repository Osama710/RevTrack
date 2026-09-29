import Link from "next/link";
import { signUp } from "../actions";
import { Field, FormPage, buttonClass, inputClass } from "@/components/ui/form";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  return (
    <FormPage title="Create your account" back={null} error={sp.error}>
      <form action={signUp} className="space-y-5">
        <Field label="Email">
          <input name="email" type="email" required autoComplete="email" inputMode="email" className={inputClass} />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
        </Field>
        <button type="submit" className={buttonClass}>Create account</button>
      </form>
      <p className="mt-6 text-center text-sm text-dim">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-mint">Sign in</Link>
      </p>
    </FormPage>
  );
}
