import { GarageProvider } from "@/components/garage-context";
import { BottomDock } from "@/components/nav";
import { ProfileProvider } from "@/components/profile-context";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { VEHICLE_COLS, type Vehicle } from "@/types/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireUser();
  const [{ data }, profile] = await Promise.all([
    supabase.from("vehicles").select(VEHICLE_COLS).order("created_at"),
    getProfile(supabase),
  ]);

  return (
    <ProfileProvider value={{ name: profile.displayName }}>
      <GarageProvider vehicles={(data ?? []) as Vehicle[]}>
        <div aria-hidden className="aurora noise" />
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-grid opacity-50" />
        {children}
        <BottomDock />
      </GarageProvider>
    </ProfileProvider>
  );
}
