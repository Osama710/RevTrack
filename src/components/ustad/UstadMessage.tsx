"use client";

import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import UstadMarkdown from "@/components/ustad/UstadMarkdown";
import { IconCopy, IconPencil, IconShare } from "@/components/icons";

export type ChatMsg = { id: string; role: "user" | "assistant"; content: string };

function ActionBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-8 place-items-center rounded-sm text-dim transition-colors hover:bg-obsidian-800 hover:text-bone active:scale-95"
    >
      {children}
    </button>
  );
}

export default function UstadMessage({
  msg,
  onEdit,
}: {
  msg: ChatMsg;
  onEdit?: () => void;
}) {
  const [feedback, setFeedback] = useState<string | null>(null);

  const flash = (text: string) => {
    setFeedback(text);
    window.setTimeout(() => setFeedback(null), 1600);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content);
      flash("Copied");
    } catch {
      flash("Failed");
    }
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "AI Ustad", text: msg.content });
      } else {
        await navigator.clipboard.writeText(msg.content);
        flash("Copied");
      }
    } catch {
      /* user cancelled share */
    }
  };

  if (msg.role === "user") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="flex justify-end pl-6"
      >
        <div className="group max-w-[92%]">
          <div className="cut cut-sm px-3.5 py-2.5 [--panel:rgb(200_255_46/0.1)]">
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-bone [overflow-wrap:anywhere]">{msg.content}</p>
          </div>
          <div className="mt-1 flex items-center justify-end gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
            {onEdit && (
              <ActionBtn label="Edit message" onClick={onEdit}>
                <IconPencil className="size-3.5" />
              </ActionBtn>
            )}
            <ActionBtn label="Copy message" onClick={() => void copy()}>
              <IconCopy className="size-3.5" />
            </ActionBtn>
            {feedback && <span className="px-1 text-[10px] font-medium text-mint">{feedback}</span>}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="flex gap-2.5 pr-1"
    >
      <span
        className="ustad-avatar mt-0.5 grid size-8 shrink-0 place-items-center font-display text-xs font-bold text-obsidian-950"
        aria-hidden
      >
        U
      </span>
      <div className="group min-w-0 flex-1">
        <p className="mb-1 font-mono text-[10px] font-medium uppercase tracking-wider text-mint">Ustad</p>
        <div className="cut cut-sm px-3.5 py-3 [--panel:rgb(17_17_26/0.95)]">
          <UstadMarkdown content={msg.content} />
        </div>
        <div className="mt-1.5 flex items-center gap-0.5">
          <ActionBtn label="Copy reply" onClick={() => void copy()}>
            <IconCopy className="size-3.5" />
          </ActionBtn>
          <ActionBtn label="Share reply" onClick={() => void share()}>
            <IconShare className="size-3.5" />
          </ActionBtn>
          {feedback && <span className="px-1 text-[10px] font-medium text-mint">{feedback}</span>}
        </div>
      </div>
    </motion.div>
  );
}
