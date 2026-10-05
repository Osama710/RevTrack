"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { IconSend, IconSmile } from "@/components/icons";

const EMOJIS = [
  "🚗", "🏍️", "⛽", "🔧", "🛞", "🔥", "❄️", "💨",
  "⚠️", "✅", "🙏", "👍", "😅", "😰", "🤔", "💡",
  "🔋", "🌡️", "🛣️", "🚦",
];

const MAX_H = 144;

function resizeField(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  const next = Math.min(el.scrollHeight, MAX_H);
  el.style.height = `${next}px`;
  el.style.overflowY = el.scrollHeight > MAX_H ? "auto" : "hidden";
}

export default function UstadComposer({
  value,
  onChange,
  onSend,
  disabled,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    resizeField(inputRef.current);
  }, [value, inputRef]);

  useEffect(() => {
    if (!emojiOpen) return;
    const close = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      setEmojiOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [emojiOpen]);

  const insertEmoji = useCallback(
    (emoji: string) => {
      const el = inputRef.current;
      if (!el) {
        onChange(value + emoji);
        return;
      }
      const start = el.selectionStart ?? value.length;
      const end = el.selectionEnd ?? value.length;
      const next = value.slice(0, start) + emoji + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + emoji.length;
        el.setSelectionRange(pos, pos);
        resizeField(el);
      });
    },
    [value, onChange, inputRef],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
    if (e.key === "Escape") setEmojiOpen(false);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!disabled && value.trim()) onSend();
  };

  return (
    <div ref={panelRef} className="ustad-composer-wrap px-3 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2">
      <form onSubmit={onSubmit} className="cut ustad-composer [--panel:rgb(12_12_18/0.98)]">
        {emojiOpen && (
          <div className="border-b border-line/50 px-2 py-2" role="listbox" aria-label="Emoji">
            <div className="grid max-h-28 grid-cols-8 gap-0.5 overflow-y-auto overscroll-contain">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  role="option"
                  className="grid h-9 place-items-center rounded-sm text-lg transition-colors hover:bg-obsidian-800 active:scale-95"
                  onClick={() => insertEmoji(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-end gap-1 p-2">
          <button
            type="button"
            disabled={disabled}
            aria-label="Add emoji"
            aria-expanded={emojiOpen}
            onClick={() => setEmojiOpen((o) => !o)}
            className="mb-0.5 grid size-9 shrink-0 place-items-center text-dim transition-colors hover:text-mint disabled:opacity-40"
          >
            <IconSmile className="size-5" />
          </button>

          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={2000}
            disabled={disabled}
            enterKeyHint="send"
            aria-label="Message Ustad"
            placeholder="Masla likhein…"
            className="ustad-composer-input min-w-0 flex-1 bg-transparent text-sm leading-relaxed text-bone placeholder:text-dim disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={disabled || !value.trim()}
            aria-label="Send"
            className="cut cut-lime mb-0.5 grid size-9 shrink-0 place-items-center disabled:opacity-35"
          >
            <IconSend className="size-4" />
          </button>
        </div>
      </form>
      <p className="mt-1.5 px-1 text-center text-[10px] leading-snug text-dim/90">
        Enter bhejein · Shift+Enter nayi line · Text only (photos jald)
      </p>
    </div>
  );
}
