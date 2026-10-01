"use client";

import { createContext, useContext } from "react";

const Ctx = createContext<{ name: string | null }>({ name: null });
export const ProfileProvider = Ctx.Provider;
export const useProfile = () => useContext(Ctx);
