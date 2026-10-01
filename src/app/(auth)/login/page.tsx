import AuthShell, { AuthSwitchLink } from "@/components/auth/AuthShell";
import { signIn } from "../actions";
import { Field, buttonClass, inputClass } from "@/components/ui/form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const sp = await searchParams;
  return (
    <AuthShell
      mode="login"
      title="Sign in"
      subtitle="Track fuel, fixes, and papers for every car and bike you ride."
      error={sp.error}
      message={sp.message}
      footer={
        <>
          New here? <AuthSwitchLink href="/signup">Create an account</AuthSwitchLink>
        </>
      }
    >
      <form action={signIn} className="space-y-5">
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
        <Field label="Password">
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className={inputClass}
          />
        </Field>
        <button type="submit" className={buttonClass}>Enter RevTrack</button>
      </form>
    </AuthShell>
  );
}
