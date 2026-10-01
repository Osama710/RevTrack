import { GarageProvider } from "@/components/garage-context";
import { BottomDock } from "@/components/nav";
import { requireUser } from "@/lib/auth";
import { VEHICLE_COLS, type Vehicle } from "@/types/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("vehicles").select(VEHICLE_COLS).order("created_at");

  return (
    <GarageProvider vehicles={(data ?? []) as Vehicle[]}>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-grid" />
      {children}
      <BottomDock />
    </GarageProvider>
  );
}
