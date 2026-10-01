import AuthShell, { AuthSwitchLink } from "@/components/auth/AuthShell";
import { signUp } from "../actions";
import { Field, buttonClass, inputClass } from "@/components/ui/form";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  return (
    <AuthShell
      mode="signup"
      title="Create account"
      subtitle="Built for Gen Z drivers — fast logging, sharp UI, zero spreadsheet energy."
      error={sp.error}
      footer={
        <>
          Already riding with us? <AuthSwitchLink href="/login">Sign in</AuthSwitchLink>
        </>
      }
    >
      <form action={signUp} className="space-y-5">
        <Field label="Email">
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            className={inputClass}
          />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••"
            className={inputClass}
          />
        </Field>
        <button type="submit" className={buttonClass}>Start tracking</button>
      </form>
    </AuthShell>
  );
}
