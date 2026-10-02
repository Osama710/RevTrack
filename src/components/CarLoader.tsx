"use client";

export default function CarLoader({ label = "Loading…", fullscreen = false }: { label?: string; fullscreen?: boolean }) {
  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[120] flex flex-col items-center justify-center gap-3 bg-obsidian-950/85 backdrop-blur-md"
          : "inline-flex flex-col items-center gap-2"
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <svg viewBox="0 0 120 48" className="h-10 w-24 text-mint" aria-hidden>
        <path
          d="M8 32h8l3-9h34l4 9h12v-6H92l-4-10H28l-4 10H8v6z"
          fill="currentColor"
          opacity="0.9"
        />
        <g className="loader-wheel" style={{ transformOrigin: "28px 32px" }}>
          <circle cx="28" cy="32" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M28 25v14M21 32h14" stroke="currentColor" strokeWidth="1.5" />
        </g>
        <g className="loader-wheel" style={{ transformOrigin: "88px 32px" }}>
          <circle cx="88" cy="32" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M88 25v14M81 32h14" stroke="currentColor" strokeWidth="1.5" />
        </g>
        <path d="M44 23h20" stroke="var(--color-ice)" strokeWidth="2" strokeLinecap="round" className="loader-dash" />
      </svg>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-dim">{label}</p>
    </div>
  );
}
