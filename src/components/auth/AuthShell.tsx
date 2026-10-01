"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { useRef, type ReactNode } from "react";

gsap.registerPlugin(useGSAP);

const PERKS = ["Fuel & service logs", "Excise papers offline", "AI Ustad", "Push reminders"];

export default function AuthShell({
  mode,
  title,
  subtitle,
  error,
  message,
  children,
  footer,
}: {
  mode: "login" | "signup";
  title: string;
  subtitle: string;
  error?: string;
  message?: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-auth-in]", { autoAlpha: 0, y: 22, duration: 0.55, stagger: 0.07, ease: "power3.out", clearProps: "all" });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <div ref={root} className="relative mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10 pt-[calc(env(safe-area-inset-top)+16px)]">
      <div aria-hidden className="aurora noise pointer-events-none fixed inset-0 -z-10" />
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-grid opacity-40" />

      <header data-auth-in className="mb-8">
        <p className="font-mono text-xs tracking-[0.35em] text-mint">REVTRACK</p>
        <h1 className="mt-2 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight">
          Your garage,
          <span className="text-grad"> unlocked</span>
        </h1>
        <p className="mt-3 max-w-[32ch] text-sm text-dim">{subtitle}</p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {PERKS.map((p) => (
            <li key={p} className="cut cut-sm px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-dim">
              {p}
            </li>
          ))}
        </ul>
      </header>

      <section data-auth-in className="cut cut-lg cut-hero relative p-5 [--panel:#0c0c14]">
        <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-violet/40 blur-3xl" />
        <h2 className="relative font-display text-xl font-bold uppercase tracking-wide">{title}</h2>
        <p className="relative mt-1 text-sm text-dim">{mode === "login" ? "Welcome back, rider." : "Takes under a minute."}</p>

        {error && (
          <p role="alert" className="relative mt-4 cut px-4 py-3 text-sm text-redline [--panel:rgb(255_61_110/0.1)]">
            {error}
          </p>
        )}
        {message && (
          <p className="relative mt-4 cut px-4 py-3 text-sm text-mint [--panel:rgb(200_255_46/0.08)]">{message}</p>
        )}

        <div className="relative mt-6">{children}</div>
      </section>

      <div data-auth-in className="mt-6 text-center text-sm text-dim">{footer}</div>

      <p data-auth-in className="mt-auto pt-8 text-center text-[11px] text-dim/80">
        By continuing you agree to keep your vehicle data private to your account.
      </p>
    </div>
  );
}

export function AuthSwitchLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-mint underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
