"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const go = (path: string, key: "error" | "message", msg: string): never =>
  redirect(`${path}?${key}=${encodeURIComponent(msg)}`);

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) go("/login", "error", "Enter your email and password.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) go("/login", "error", "Wrong email or password.");

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email) go("/signup", "error", "Enter your email.");
  if (password.length < 8) go("/signup", "error", "Use at least 8 characters for your password.");

  const h = await headers();
  const origin = h.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) go("/signup", "error", error.message);

  // With "Confirm email" turned off in Supabase, the user is signed in immediately.
  if (data.session) redirect("/dashboard");
  go("/login", "message", "Check your email to confirm your account, then sign in.");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
