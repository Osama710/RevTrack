import AuthShell, { AuthSwitchLink } from "@/components/auth/AuthShell";
import SignInForm from "@/components/auth/SignInForm";

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
      <SignInForm />
    </AuthShell>
  );
}
