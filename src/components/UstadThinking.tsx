"use client";

import { useEffect, useMemo, useState } from "react";

export default function UstadThinking({ vehicleName }: { vehicleName?: string | null }) {
  const hints = useMemo(
    () => [
      "Masla parh raha hoon…",
      vehicleName ? `${vehicleName} ke hisaab se soch raha hoon…` : "Gaari ke masle samajh raha hoon…",
      "Mechanic ki tarah check kar raha hoon…",
      "Jawab likh raha hoon…",
    ],
    [vehicleName],
  );
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % hints.length), 2400);
    return () => clearInterval(t);
  }, [hints]);

  return (
    <div className="mr-4 cut cut-sm px-3 py-2.5 text-xs" aria-busy="true" aria-label="Ustad is thinking">
      <p className="mb-1 font-mono text-[10px] text-mint">ustad</p>
      <p className="text-dim">{hints[i]}</p>
      <p className="ustad-dots mt-2" aria-hidden>
        <span />
        <span />
        <span />
      </p>
    </div>
  );
}
