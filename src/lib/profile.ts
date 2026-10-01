import type { createClient } from "@/lib/supabase/server";

export const CURRENCIES = ["Rs", "$", "€", "£", "AED", "SAR"] as const;

type Client = Awaited<ReturnType<typeof createClient>>;

/** Never throws: before the profiles migration is run, or if the row is missing, sensible defaults apply. */
export async function getProfile(supabase: Client) {
  const { data } = await supabase.from("profiles").select("display_name, currency").maybeSingle();
  return {
    displayName: (data?.display_name ?? null) as string | null,
    currency: (data?.currency ?? "Rs") as string,
  };
}
