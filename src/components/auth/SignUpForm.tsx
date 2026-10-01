"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, buttonClass, inputClass } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";

export default function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setPending(true);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    if (!email) {
      setError("Enter your email.");
      setPending(false);
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      setPending(false);
      return;
    }

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError) {
      setError(authError.message);
      setPending(false);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    router.push("/login?message=" + encodeURIComponent("Check your email to confirm your account, then sign in."));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <p role="alert" className="cut px-4 py-3 text-sm text-redline [--panel:rgb(255_61_110/0.1)]">
          {error}
        </p>
      )}
      <Field label="Email">
        <input name="email" type="email" required autoComplete="email" inputMode="email" placeholder="you@example.com" className={inputClass} disabled={pending} />
      </Field>
      <Field label="Password" hint="At least 8 characters.">
        <input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="••••••••" className={inputClass} disabled={pending} />
      </Field>
      <button type="submit" disabled={pending} className={`${buttonClass} disabled:opacity-60`}>
        {pending ? "Creating…" : "Start tracking"}
      </button>
    </form>
  );
}
