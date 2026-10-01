"use client";

import { useState } from "react";
import { Field, inputClass } from "@/components/ui/form";

interface V {
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  plate: string | null;
  engine_no: string | null;
  chassis_no: string | null;
  color: string | null;
}

/** Packages the details a stolen-vehicle report needs into text and a shareable image. Nothing is stored. */
export default function SosShare({ vehicle }: { vehicle: V }) {
  const [lastSeen, setLastSeen] = useState("");
  const [contact, setContact] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const lines = (
    [
      ["Number plate", vehicle.plate],
      ["Vehicle", [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ")],
      ["Colour", vehicle.color],
      ["Engine no.", vehicle.engine_no],
      ["Chassis no.", vehicle.chassis_no],
      ["Last seen", lastSeen.trim()],
      ["Contact", contact.trim()],
    ] as [string, string | null][]
  ).filter((l): l is [string, string] => !!l[1]);

  const text = ["STOLEN VEHICLE - PLEASE HELP", ...lines.map(([k, v]) => `${k}: ${v}`), "Please report to Police (15) or your nearest CPLC office."].join("\n");

  async function shareText() {
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setMsg("Copied. Paste it into WhatsApp or a message.");
      }
    } catch {
      /* dismissed */
    }
  }

  async function shareImage() {
    const W = 1080;
    const H = 400 + lines.length * 120;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    if (!g) return;
    g.fillStyle = "#050506";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#ff3366";
    g.fillRect(0, 0, W, 170);
    g.fillStyle = "#f5f5f5";
    g.font = "bold 64px system-ui, sans-serif";
    g.fillText("STOLEN VEHICLE", 60, 105);
    lines.forEach(([k, v], i) => {
      const y = 260 + i * 120;
      g.fillStyle = "#9a9aa2";
      g.font = "32px system-ui, sans-serif";
      g.fillText(k, 60, y);
      g.fillStyle = "#f5f5f5";
      g.font = "bold 46px system-ui, sans-serif";
      g.fillText(v.length > 34 ? `${v.slice(0, 33)}...` : v, 60, y + 52);
    });
    g.fillStyle = "#00f5a0";
    g.font = "30px system-ui, sans-serif";
    g.fillText("Report to Police (15) or your nearest CPLC office", 60, H - 50);

    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
    if (!blob) return;
    const file = new File([blob], "stolen-vehicle.png", { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text });
        return;
      }
    } catch {
      return; // dismissed
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "stolen-vehicle.png";
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg("Image saved to your downloads.");
  }

  return (
    <details className="mt-8 rounded-2xl border border-redline/40 px-4 open:pb-4">
      <summary className="flex min-h-14 cursor-pointer items-center font-semibold text-redline">Emergency: report vehicle stolen</summary>
      <p className="text-sm text-dim">Builds a clean block with your plate, engine and chassis numbers to send to family, police or CPLC.</p>
      {!vehicle.plate && !vehicle.engine_no && !vehicle.chassis_no && (
        <p className="mt-2 text-sm text-redline">Add the plate, engine and chassis numbers in Edit first, so this has something to share.</p>
      )}
      <div className="mt-4 space-y-4">
        <Field label="Last seen (optional)"><input value={lastSeen} onChange={(e) => setLastSeen(e.target.value)} maxLength={120} className={inputClass} /></Field>
        <Field label="Contact number (optional)"><input value={contact} onChange={(e) => setContact(e.target.value)} maxLength={30} inputMode="tel" className={inputClass} /></Field>
        <pre className="whitespace-pre-wrap rounded-xl border border-line bg-obsidian-950 p-3 text-sm">{text}</pre>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={shareText} className="h-12 rounded-full bg-redline font-display font-semibold text-bone active:scale-[0.98]">Share text</button>
          <button type="button" onClick={shareImage} className="h-12 rounded-full border border-redline/60 font-display font-semibold text-redline active:scale-[0.98]">Share image</button>
        </div>
        {msg && <p role="status" className="text-sm text-mint">{msg}</p>}
      </div>
    </details>
  );
}
