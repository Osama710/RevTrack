"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";

gsap.registerPlugin(useGSAP);

/** Re-mounts on every navigation: snappy clip-wipe so route changes feel instant. */
export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(ref.current, { autoAlpha: 0, y: 8, clipPath: "inset(0 0 4% 0)", duration: 0.18, ease: "power2.out", clearProps: "all" });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );
  return <div ref={ref}>{children}</div>;
}
