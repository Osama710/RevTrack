"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useGarage } from "@/components/garage-context";
import { IconSend } from "@/components/icons";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK = ["Gaari garam ho rahi hai", "Petrol pump se awaaz aa rahi hai", "Engine start nahi ho raha", "Brake lagane par awaaz aati hai", "AC thanda nahi kar raha"];

export default function UstadChat({ initial, clearAction }: { initial: Msg[]; clearAction: (fd: FormData) => void | Promise<void> }) {
  const { vehicle } = useGarage();
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
    <div className="mx-auto flex h-dvh max-w-md flex-col">
      <header className="flex items-center justify-between gap-3 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+12px)]">
        <div>
          <Link href="/garage" className="inline-flex min-h-11 items-center text-sm text-dim">Back</Link>
          <h1 className="font-display text-2xl font-semibold">AI Ustad</h1>
          <p className="text-xs text-dim">Roman-Urdu diagnostic terminal{vehicle ? ` · ${vehicle.name}` : ""}</p>
        </div>
        {msgs.length > 0 && (
          <form action={clearAction} onSubmit={() => setMsgs([])}>
            <button type="submit" className="min-h-11 rounded-full border border-line px-4 text-sm text-dim active:bg-obsidian-800">Clear</button>
          </form>
        )}
      </header>

      <div role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-5 pb-4">
        {msgs.length === 0 && (
          <div className="cut p-4">
            <p className="font-mono text-sm text-mint">ustad@revtrack:~$</p>
            <p className="mt-2 text-sm text-dim">Assalam o alaikum. Gaari ka masla Roman-Urdu mein likhein, ya neeche se chunein.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button key={q} type="button" onClick={() => void send(q)} className="min-h-11 rounded-full border border-line px-3 text-sm active:bg-obsidian-800">{q}</button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-10 rounded-2xl rounded-br-md border border-mint/30 bg-mint/10 px-4 py-3 text-sm" : "mr-6 rounded-2xl rounded-bl-md border border-line bg-obsidian-900 px-4 py-3 text-sm"}>
            {m.role === "assistant" && <p className="mb-1 font-mono text-xs text-mint">ustad</p>}
            <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
          </div>
        ))}
        {sending && <p className="font-mono text-sm text-mint" aria-label="Ustad is typing">ustad soch raha hai...</p>}
        {error && <p role="alert" className="rounded-xl border border-redline/50 px-4 py-3 text-sm text-redline">{error}</p>}
        <div ref={end} />
      </div>

      <form onSubmit={onSubmit} className="flex gap-2 border-t border-line bg-obsidian-950/95 px-5 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
          enterKeyHint="send"
          aria-label="Describe the problem"
          placeholder="Masla likhein..."
          className="h-12 min-w-0 flex-1 rounded-full border border-line bg-obsidian-900 px-5 text-bone placeholder:text-dim focus:border-mint focus:outline-none"
        />
        <button type="submit" disabled={sending || !input.trim()} aria-label="Send" className="grid size-12 shrink-0 place-items-center rounded-full bg-mint text-obsidian-950 disabled:opacity-40 active:scale-90">
          <IconSend />
        </button>
      </form>
    </div>
  );
}
