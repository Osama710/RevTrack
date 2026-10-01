"use client";

import { createContext, useContext, type ReactNode } from "react";

const ProfileContext = createContext<{ name: string | null }>({ name: null });

export function ProfileProvider({ children, name }: { children: ReactNode; name: string | null }) {
  return <ProfileContext.Provider value={{ name }}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  return useContext(ProfileContext);
}
