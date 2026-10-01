"use client";

// Last line of defence: replaces the whole document, so it carries its own styles.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#050506", color: "#f5f5f5", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100dvh", display: "grid", placeContent: "center", gap: 16, padding: 24, textAlign: "center" }}>
          <h1 style={{ margin: 0 }}>RevTrack hit a problem</h1>
          <p style={{ margin: 0, color: "#9a9aa2" }}>Your data is safe. Reload to continue.</p>
          <button
            onClick={reset}
            style={{ height: 52, border: 0, borderRadius: 999, background: "#00f5a0", color: "#050506", fontWeight: 700, fontSize: 16, padding: "0 28px" }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
