"use client";

import { clearUstadHistory } from "@/app/(app)/actions";
import { useEffect, useRef, useState, type FormEvent } from "react";
import BackLink from "@/components/ui/BackLink";
import CarLoader from "@/components/CarLoader";
import { useGarage } from "@/components/garage-context";
import { IconSend } from "@/components/icons";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK = ["Gaari garam ho rahi hai", "Engine start nahi ho raha", "Brake ki awaaz", "AC thanda nahi"];

function normalizeMsgs(rows: Msg[]): Msg[] {
  return rows
    .map((m) => ({
      role: (m.role === "assistant" ? "assistant" : "user") as Msg["role"],
      content: typeof m.content === "string" ? m.content.trim() : "",
    }))
    .filter((m) => m.content.length > 0);
}

export default function UstadChat({ initial }: { initial: Msg[] }) {
  const { vehicle } = useGarage();
  const [msgs, setMsgs] = useState<Msg[]>(() => normalizeMsgs(initial));
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const inflight = useRef<AbortController | null>(null);

  useEffect(() => {
    const el = end.current;
    if (!el || typeof el.scrollIntoView !== "function") return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [msgs, sending]);

  useEffect(() => () => inflight.current?.abort(), []);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;

    inflight.current?.abort();
    const ac = new AbortController();
    inflight.current = ac;

    setMsgs((m) => [...m, { role: "user", content: message }]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/ustad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, vehicleId: vehicle?.id ?? null }),
        signal: ac.signal,
      });
      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      if (ac.signal.aborted) return;
      if (!res.ok || !data.reply) throw new Error(data.error ?? "Ustad couldn't answer.");
      setMsgs((m) => [...m, { role: "assistant", content: data.reply as string }]);
    } catch (e) {
      if (ac.signal.aborted) return;
      setError(e instanceof Error ? e.message : "Ustad couldn't answer.");
    } finally {
      if (inflight.current === ac) inflight.current = null;
      if (!ac.signal.aborted) setSending(false);
    }
  }

  async function clearChat() {
    if (clearing || sending) return;
    setClearing(true);
    setError(null);
    setMsgs([]);
    try {
      await clearUstadHistory();
    } catch {
      setError("Couldn't clear history. Try again.");
    } finally {
      setClearing(false);
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <div className="app-viewport relative flex h-dvh min-w-0 flex-col overflow-x-hidden">
      {sending && <CarLoader fullscreen label="Ustad soch raha hai… (30 sec tak lag sakta hai)" />}
      <header className="flex items-start justify-between gap-2 border-b border-line/60 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+8px)]">
        <div className="flex items-center gap-1">
          <BackLink href="/garage" />
          <div>
            <h1 className="font-display text-base font-bold uppercase tracking-wide">AI Ustad</h1>
            <p className="text-[10px] text-dim">{vehicle ? vehicle.name : "No vehicle selected"}</p>
          </div>
        </div>
        {msgs.length > 0 && (
          <button
            type="button"
            disabled={clearing || sending}
            onClick={() => void clearChat()}
            className="cut cut-sm px-3 py-2 text-[10px] font-semibold uppercase text-dim disabled:opacity-40"
          >
            Clear
          </button>
        )}
      </header>

      <div role="log" aria-live="polite" className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {msgs.length === 0 && (
          <div className="cut p-3">
            <p className="font-mono text-[11px] text-mint">ustad@revtrack</p>
            <p className="mt-1.5 text-xs text-dim">Masla Roman-Urdu mein likhein ya neeche se chunein.</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <button key={q} type="button" onClick={() => void send(q)} disabled={sending} className="cut cut-sm px-2.5 py-1.5 text-[11px] text-dim disabled:opacity-40">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div
            key={`${m.role}-${i}-${m.content.slice(0, 24)}`}
            className={
              m.role === "user"
                ? "ml-8 cut cut-sm px-3 py-2 text-xs [--panel:rgb(200_255_46/0.08)]"
                : "mr-4 cut cut-sm px-3 py-2 text-xs"
            }
          >
            {m.role === "assistant" && <p className="mb-0.5 font-mono text-[10px] text-mint">ustad</p>}
            <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
          </div>
        ))}
        {sending && msgs.length > 0 && msgs[msgs.length - 1]?.role === "user" && (
          <p className="text-[11px] text-dim">Ustad jawab likh raha hai…</p>
        )}
        {error && <p role="alert" className="cut px-3 py-2 text-xs text-redline [--panel:rgb(255_61_110/0.1)]">{error}</p>}
        <div ref={end} />
      </div>

      <form onSubmit={onSubmit} className="flex gap-2 border-t border-line/60 bg-obsidian-950/95 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
          enterKeyHint="send"
          disabled={sending}
          aria-label="Describe the problem"
          placeholder="Masla likhein…"
          className="input-cut h-10 min-w-0 flex-1 px-3 text-sm disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="Send"
          className="cut cut-lime grid size-10 shrink-0 place-items-center disabled:opacity-40"
        >
          <IconSend className="size-4" />
        </button>
      </form>
    </div>
  );
}
