import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Returns a Supabase client and the verified user, or sends the visitor to /login. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}
