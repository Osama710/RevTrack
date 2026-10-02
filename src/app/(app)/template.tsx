import type { ReactNode } from "react";

/** No per-route GSAP — keeps navigation snappy. */
export default function Template({ children }: { children: ReactNode }) {
  return children;
}
