"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const THRESHOLD = 68;
const MAX_PULL = 110;

function chainAtTop(target: EventTarget | null): boolean {
  if (typeof window !== "undefined" && window.scrollY > 2) return false;
  let el = target as HTMLElement | null;
  while (el && el !== document.documentElement) {
    const oy = getComputedStyle(el).overflowY;
    if ((oy === "auto" || oy === "scroll" || oy === "overlay") && el.scrollHeight > el.clientHeight + 2) {
      if (el.scrollTop > 2) return false;
    }
    el = el.parentElement;
  }
  return true;
}

export default function PullToRefresh({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const active = useRef(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  const trigger = useCallback(() => {
    setRefreshing(true);
    pullRef.current = THRESHOLD;
    setPull(THRESHOLD);
    router.refresh();
    window.setTimeout(() => {
      setRefreshing(false);
      pullRef.current = 0;
      setPull(0);
    }, 750);
  }, [router]);

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (refreshingRef.current) return;
      if (!chainAtTop(e.target)) return;
      startY.current = e.touches[0]?.clientY ?? 0;
      active.current = true;
    };

    const onMove = (e: TouchEvent) => {
      if (!active.current || refreshingRef.current) return;
      const y = e.touches[0]?.clientY ?? 0;
      const dy = y - startY.current;
      if (dy <= 0) {
        pullRef.current = 0;
        setPull(0);
        return;
      }
      if (!chainAtTop(e.target)) {
        active.current = false;
        pullRef.current = 0;
        setPull(0);
        return;
      }
      const next = Math.min(dy * 0.5, MAX_PULL);
      pullRef.current = next;
      setPull(next);
      if (dy > 8) e.preventDefault();
    };

    const onEnd = () => {
      if (!active.current) return;
      active.current = false;
      if (pullRef.current >= THRESHOLD && !refreshingRef.current) trigger();
      else {
        pullRef.current = 0;
        setPull(0);
      }
    };

    const opts = { passive: false } as const;
    document.addEventListener("touchstart", onStart, opts);
    document.addEventListener("touchmove", onMove, opts);
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, [trigger]);

  const ready = pull >= THRESHOLD;
  const show = pull > 4 || refreshing;

  return (
    <>
      <div
        aria-hidden={!show}
        className="ptr-indicator pointer-events-none fixed inset-x-0 z-[100] flex justify-center transition-opacity duration-150"
        style={{
          top: `calc(env(safe-area-inset-top) + 4px)`,
          opacity: show ? 1 : 0,
          transform: `translateY(${refreshing ? THRESHOLD * 0.35 : pull * 0.35}px)`,
        }}
      >
        <div className="cut cut-sm flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-dim [--panel:rgb(12_12_18/0.92)]">
          <span className={`ptr-spin size-3.5 rounded-full border-2 border-mint/30 border-t-mint ${refreshing ? "ptr-spin-on" : ""}`} />
          {refreshing ? "Refreshing…" : ready ? "Release to refresh" : "Pull to refresh"}
        </div>
      </div>
      {children}
    </>
  );
}
