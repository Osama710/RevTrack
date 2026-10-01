import AuthShell, { AuthSwitchLink } from "@/components/auth/AuthShell";
import SignUpForm from "@/components/auth/SignUpForm";

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
      <SignUpForm />
    </AuthShell>
  );
}
