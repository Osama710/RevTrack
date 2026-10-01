import { GarageProvider } from "@/components/garage-context";
import { BottomDock } from "@/components/nav";
import { ProfileProvider } from "@/components/profile-context";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { fetchVehicles } from "@/lib/vehicles";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const [vehicles, profile] = await Promise.all([fetchVehicles(supabase), getProfile(supabase, user.id)]);

  return (
    <ProfileProvider value={{ name: profile.displayName }}>
      <GarageProvider vehicles={vehicles}>
        <div aria-hidden className="aurora noise" />
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-grid opacity-50" />
        {children}
        <BottomDock />
      </GarageProvider>
    </ProfileProvider>
  );
}
