"use client";

import { useEffect, useState } from "react";

type State = "loading" | "nokey" | "unsupported" | "denied" | "off" | "on";

function toKey(b64: string): ArrayBuffer {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out.buffer as ArrayBuffer;
}

export default function PushToggle({ publicKey }: { publicKey: string }) {
  const [state, setState] = useState<State>("loading");
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!publicKey) return setState("nokey");
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setState("unsupported");
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return setState("unsupported");
      if (Notification.permission === "denied") return setState("denied");
      setState((await reg.pushManager.getSubscription()) ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, [publicKey]);

  async function enable() {
    setBusy(true);
    setMsg(null);
    try {
      if ((await Notification.requestPermission()) !== "granted") return setState("denied");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(publicKey) });
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }) });
      if (!res.ok) {
        await sub.unsubscribe();
        throw new Error("Couldn't save this device. Try again.");
      }
      setState("on");
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : "Couldn't turn notifications on.", bad: true });
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    const res = await fetch("/api/push/test", { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setMsg(res.ok ? { text: "Sent. It should appear in a moment.", bad: false } : { text: data.error ?? "Couldn't send.", bad: true });
    setBusy(false);
  }

  const note: Record<State, string> = {
    loading: "Checking this device...",
    nokey: "Push isn't set up yet. Add the VAPID keys in Vercel.",
    unsupported: "Open the installed RevTrack app to turn on notifications. On iPhone, add it to your Home Screen first.",
    denied: "Notifications are blocked. Allow them in your browser or phone settings, then come back.",
    off: "Get a nudge when a service, licence or token tax is coming due.",
    on: "On for this device. You'll get reminders about upcoming and overdue items.",
  };

  return (
    <section className="rounded-2xl border border-line bg-obsidian-900 p-4">
      <h2 className="font-display text-lg font-semibold">Push reminders</h2>
      <p className="mt-1 text-sm text-dim">{note[state]}</p>
      {(state === "off" || state === "on") && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" disabled={busy} onClick={state === "off" ? enable : disable} className={`h-12 rounded-full font-display font-semibold disabled:opacity-50 active:scale-[0.98] ${state === "off" ? "col-span-2 bg-mint text-obsidian-950" : "border border-line"}`}>
            {state === "off" ? "Turn on notifications" : "Turn off"}
          </button>
          {state === "on" && (
            <button type="button" disabled={busy} onClick={test} className="h-12 rounded-full border border-mint/50 font-display font-semibold text-mint disabled:opacity-50 active:scale-[0.98]">
              Send a test
            </button>
          )}
        </div>
      )}
      {msg && <p role="status" className={`mt-2 text-sm ${msg.bad ? "text-redline" : "text-mint"}`}>{msg.text}</p>}
    </section>
  );
}
