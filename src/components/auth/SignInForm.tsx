"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, buttonClass, inputClass } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";

export default function SignInForm() {
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
    if (!email || !password) {
      setError("Enter your email and password.");
      setPending(false);
      return;
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("Wrong email or password.");
      setPending(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <p role="alert" className="cut px-4 py-3 text-sm text-redline [--panel:rgb(255_61_110/0.1)]">
          {error}
        </p>
      )}
      <Field label="Email">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          className={inputClass}
          disabled={pending}
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
          disabled={pending}
        />
      </Field>
      <button type="submit" disabled={pending} className={`${buttonClass} disabled:opacity-60`}>
        {pending ? "Signing in…" : "Enter RevTrack"}
      </button>
    </form>
  );
}
