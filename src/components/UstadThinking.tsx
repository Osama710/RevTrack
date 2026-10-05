"use client";

import { motion } from "framer-motion";

export default function UstadThinking() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2.5 pr-1"
      aria-busy="true"
      aria-label="Ustad is thinking"
    >
      <span className="ustad-avatar ustad-avatar-pulse mt-0.5 grid size-8 shrink-0 place-items-center font-display text-xs font-bold text-obsidian-950">
        U
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="font-mono text-[10px] font-medium uppercase tracking-wider text-mint">Ustad</p>
        <div className="mt-2 cut cut-sm max-w-[14rem] px-3 py-2.5 [--panel:rgb(17_17_26/0.9)]">
          <p className="flex items-center gap-1 text-sm text-dim">
            Soch raha hoon
            <span className="ustad-dots" aria-hidden>
              <span />
              <span />
              <span />
            </span>
          </p>
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-obsidian-800">
            <div className="ustad-think-bar h-full rounded-full bg-gradient-to-r from-mint/20 via-mint to-mint/20" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
