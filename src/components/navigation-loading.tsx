"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import CarLoader from "@/components/CarLoader";

type NavCtx = { start: () => void; busy: boolean };

const Ctx = createContext<NavCtx>({ start: () => {}, busy: false });

export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setBusy(false);
    if (timer.current) clearTimeout(timer.current);
  }, [pathname]);

  const start = useCallback(() => {
    setBusy(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setBusy(false), 12_000);
  }, []);

  return (
    <Ctx.Provider value={{ start, busy }}>
      {children}
      {busy && <CarLoader fullscreen label="On the road…" />}
    </Ctx.Provider>
  );
}

export function useNavLoading() {
  return useContext(Ctx);
}
