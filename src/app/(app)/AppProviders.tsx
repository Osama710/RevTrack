import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { fetchVehicles } from "@/lib/vehicles";

export default async function AppProviders({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const [vehicles, profile] = await Promise.all([fetchVehicles(supabase), getProfile(supabase, user.id)]);

  return (
    <AppShell vehicles={vehicles} displayName={profile.displayName}>
      {children}
    </AppShell>
  );
}
