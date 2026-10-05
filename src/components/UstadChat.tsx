"use client";

import { clearUstadHistory } from "@/app/(app)/actions";
import { useEffect, useRef, useState } from "react";
import BackLink from "@/components/ui/BackLink";
import UstadThinking from "@/components/UstadThinking";
import UstadComposer from "@/components/ustad/UstadComposer";
import UstadMessage, { type ChatMsg } from "@/components/ustad/UstadMessage";
import { useGarage } from "@/components/garage-context";

const QUICK = ["Gaari garam ho rahi hai", "Engine start nahi ho raha", "Brake ki awaaz", "AC thanda nahi"];

function msgId() {
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeMsgs(rows: { role: string; content: string }[]): ChatMsg[] {
  return rows
    .map((m) => ({
      id: msgId(),
      role: (m.role === "assistant" ? "assistant" : "user") as ChatMsg["role"],
      content: typeof m.content === "string" ? m.content.trim() : "",
    }))
    .filter((m) => m.content.length > 0);
}

export default function UstadChat({ initial }: { initial: { role: string; content: string }[] }) {
  const { vehicle } = useGarage();
  const [msgs, setMsgs] = useState<ChatMsg[]>(() => normalizeMsgs(initial));
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inflight = useRef<AbortController | null>(null);
  const lastQuestion = useRef<string | null>(null);

  useEffect(() => {
    const el = end.current;
    if (!el || typeof el.scrollIntoView !== "function") return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [msgs, sending, error]);

  useEffect(() => () => inflight.current?.abort(), []);

  async function requestUstad(message: string, addUserBubble: boolean) {
    inflight.current?.abort();
    const ac = new AbortController();
    inflight.current = ac;

    if (addUserBubble) {
      setMsgs((m) => [...m, { id: msgId(), role: "user", content: message }]);
      setInput("");
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (el) {
          el.style.height = "auto";
          el.style.overflowY = "hidden";
        }
      });
    }
    lastQuestion.current = message;
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
      if (!res.ok || !data.reply) throw new Error(data.error ?? "Ustad is in the workshop, try again in a minute.");
      setMsgs((m) => [...m, { id: msgId(), role: "assistant", content: data.reply as string }]);
    } catch (e) {
      if (ac.signal.aborted) return;
      setError(e instanceof Error ? e.message : "Ustad is in the workshop, try again in a minute.");
    } finally {
      if (inflight.current === ac) inflight.current = null;
      if (!ac.signal.aborted) setSending(false);
    }
  }

  function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;
    void requestUstad(message, true);
  }

  function retryLast() {
    const q = lastQuestion.current;
    if (!q || sending) return;
    void requestUstad(q, false);
  }

  function editMessage(index: number) {
    const msg = msgs[index];
    if (!msg || msg.role !== "user" || sending) return;
    setMsgs((m) => m.slice(0, index));
    setInput(msg.content);
    lastQuestion.current = msg.content;
    setError(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function clearChat() {
    if (clearing || sending) return;
    setClearing(true);
    setError(null);
    setMsgs([]);
    lastQuestion.current = null;
    try {
      await clearUstadHistory();
    } catch {
      setError("Couldn't clear history. Try again.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="app-viewport relative flex h-dvh min-w-0 flex-col overflow-x-hidden bg-obsidian-950">
      <header className="flex items-start justify-between gap-2 border-b border-line/60 bg-obsidian-950/90 px-4 pb-2.5 pt-[calc(env(safe-area-inset-top)+8px)] backdrop-blur-md">
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

      <div role="log" aria-live="polite" className="ustad-thread min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto px-3 py-4">
        {msgs.length === 0 && !sending && (
          <div className="cut p-4">
            <p className="font-mono text-[11px] text-mint">ustad@revtrack</p>
            <p className="mt-2 text-sm text-dim">Masla Roman-Urdu mein likhein ya neeche se chunein.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  disabled={sending}
                  className="cut cut-sm px-3 py-2 text-xs text-dim transition-transform active:scale-[0.98] disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <UstadMessage key={m.id} msg={m} onEdit={m.role === "user" && !sending ? () => editMessage(i) : undefined} />
        ))}
        {sending && <UstadThinking />}
        {error && (
          <div role="alert" className="cut mx-1 px-3 py-2.5 text-xs [--panel:rgb(255_61_110/0.08)]">
            <p className="text-redline">{error}</p>
            {lastQuestion.current && (
              <button type="button" onClick={retryLast} disabled={sending} className="btn-cut-ghost mt-2 h-9 px-3 text-[11px] font-semibold uppercase">
                Dubara bhejein
              </button>
            )}
          </div>
        )}
        <div ref={end} />
      </div>

      <div className="shrink-0 border-t border-line/50 bg-gradient-to-t from-obsidian-950 via-obsidian-950/98 to-transparent">
        <UstadComposer
          value={input}
          onChange={setInput}
          onSend={() => send(input)}
          disabled={sending}
          inputRef={inputRef}
        />
      </div>
    </div>
  );
}
