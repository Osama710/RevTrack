"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import BackLink from "@/components/ui/BackLink";
import CarLoader from "@/components/CarLoader";
import { useGarage } from "@/components/garage-context";
import { IconSend } from "@/components/icons";
import { useNavLoading } from "@/components/navigation-loading";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK = ["Gaari garam ho rahi hai", "Engine start nahi ho raha", "Brake ki awaaz", "AC thanda nahi"];

export default function UstadChat({ initial, clearAction }: { initial: Msg[]; clearAction: (fd: FormData) => void | Promise<void> }) {
  const { vehicle } = useGarage();
  const { start } = useNavLoading();
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth", block: "end" }), [msgs, sending]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;
    setMsgs((m) => [...m, { role: "user", content: message }]);
    setInput("");
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/ustad", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, vehicleId: vehicle?.id ?? null }) });
      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) throw new Error(data.error ?? "Ustad couldn't answer.");
      setMsgs((m) => [...m, { role: "assistant", content: data.reply as string }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ustad couldn't answer.");
    } finally {
      setSending(false);
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <div className="app-viewport relative flex h-dvh min-w-0 flex-col overflow-x-hidden">
      {sending && <CarLoader fullscreen label="Ustad soch raha hai…" />}
      <header className="flex items-start justify-between gap-2 border-b border-line/60 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+8px)]">
        <div className="flex items-center gap-1">
          <BackLink href="/garage" />
          <div>
            <h1 className="font-display text-base font-bold uppercase tracking-wide">AI Ustad</h1>
            <p className="text-[10px] text-dim">{vehicle ? vehicle.name : "No vehicle selected"}</p>
          </div>
        </div>
        {msgs.length > 0 && (
          <form
            action={clearAction}
            onSubmit={() => {
              start();
              setMsgs([]);
            }}
          >
            <button type="submit" className="cut cut-sm px-3 py-2 text-[10px] font-semibold uppercase text-dim">Clear</button>
          </form>
        )}
      </header>

      <div role="log" aria-live="polite" className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {msgs.length === 0 && (
          <div className="cut p-3">
            <p className="font-mono text-[11px] text-mint">ustad@revtrack</p>
            <p className="mt-1.5 text-xs text-dim">Masla Roman-Urdu mein likhein ya neeche se chunein.</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <button key={q} type="button" onClick={() => void send(q)} className="cut cut-sm px-2.5 py-1.5 text-[11px] text-dim">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div
            key={i}
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
        {error && <p role="alert" className="cut px-3 py-2 text-xs text-redline [--panel:rgb(255_61_110/0.1)]">{error}</p>}
        <div ref={end} />
      </div>

      <form onSubmit={onSubmit} className="flex gap-2 border-t border-line/60 bg-obsidian-950/95 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
          enterKeyHint="send"
          aria-label="Describe the problem"
          placeholder="Masla likhein…"
          className="input-cut h-10 min-w-0 flex-1 px-3 text-sm"
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
