"use client";

import type { ReactNode } from "react";
import { GarageProvider } from "@/components/garage-context";
import { BottomDock } from "@/components/nav";
import { ProfileProvider } from "@/components/profile-context";
import type { Vehicle } from "@/types/db";

export default function AppShell({
  vehicles,
  displayName,
  children,
}: {
  vehicles: Vehicle[];
  displayName: string | null;
  children: ReactNode;
}) {
  return (
    <ProfileProvider name={displayName}>
      <GarageProvider vehicles={vehicles}>
        <div aria-hidden className="aurora noise" />
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-grid opacity-50" />
        {children}
        <BottomDock />
      </GarageProvider>
    </ProfileProvider>
  );
}
