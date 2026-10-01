"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Field, buttonClass, inputClass } from "@/components/ui/form";
import { DOC_LABELS, DOC_TYPES } from "@/lib/docs";
import { compressImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";
import type { DocType } from "@/types/db";

type Action = (formData: FormData) => void | Promise<void>;

export default function DocumentForm({
  action,
  id,
  userId,
  vehicles,
  submitLabel,
  defaults,
}: {
  action: Action;
  id?: string;
  userId: string;
  vehicles: { id: string; name: string }[];
  submitLabel: string;
  defaults?: {
    doc_type?: DocType;
    title?: string;
    vehicle_id?: string | null;
    doc_number?: string | null;
    issued_on?: string | null;
    expires_on?: string | null;
    image_path?: string | null;
    notes?: string | null;
  };
}) {
  const title = useRef<HTMLInputElement>(null);
  const [imagePath, setImagePath] = useState(defaults?.image_path ?? "");
  const [preview, setPreview] = useState<string | null>(defaults?.image_path && id ? `/api/documents/${id}/image` : null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; bad: boolean } | null>(null);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setNote({ text: "Uploading photo...", bad: false });
    try {
      const blob = await compressImage(file);
      if (blob.size > 4_500_000) throw new Error("That photo is too large. Try a smaller one.");
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error } = await createClient().storage.from("documents").upload(path, blob, { contentType: "image/jpeg", upsert: false });
      if (error) throw new Error("Upload failed. Check that 0004_garage_suite.sql has been run, then try again.");
      setImagePath(path);
      setPreview(URL.createObjectURL(blob));
      setNote({ text: "Photo attached. Save to keep it.", bad: false });
    } catch (err) {
      setNote({ text: err instanceof Error ? err.message : "Upload failed.", bad: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action={action} className="space-y-5">
      {id && <input type="hidden" name="id" value={id} />}
      <input type="hidden" name="image_path" value={imagePath} />

      <Field label="Type">
        <select
          name="doc_type"
          defaultValue={defaults?.doc_type ?? "driving_license"}
          onChange={(e) => {
            if (title.current && !title.current.value) title.current.value = DOC_LABELS[e.target.value as DocType];
          }}
          className={inputClass}
        >
          {DOC_TYPES.map((t) => (
            <option key={t} value={t}>{DOC_LABELS[t]}</option>
          ))}
        </select>
      </Field>
      <Field label="Title">
        <input ref={title} name="title" required maxLength={80} defaultValue={defaults?.title ?? DOC_LABELS[defaults?.doc_type ?? "driving_license"]} className={inputClass} />
      </Field>
      <Field label="Belongs to" hint="Leave as personal for a driving licence.">
        <select name="vehicle_id" defaultValue={defaults?.vehicle_id ?? ""} className={inputClass}>
          <option value="">Personal</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Number" hint="Optional. Shown in Excise Safe Mode.">
        <input name="doc_number" maxLength={60} defaultValue={defaults?.doc_number ?? ""} className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Issued"><input name="issued_on" type="date" defaultValue={defaults?.issued_on ?? ""} className={inputClass} /></Field>
        <Field label="Expires"><input name="expires_on" type="date" defaultValue={defaults?.expires_on ?? ""} className={inputClass} /></Field>
      </div>

      <Field label="Photo" hint="Front of the card or paper, in good light.">
        <input
          type="file"
          accept="image/*"
          onChange={onFile}
          className="block w-full rounded-xl border border-dashed border-line bg-obsidian-900 p-3 text-sm text-dim file:mr-3 file:h-10 file:rounded-full file:border-0 file:bg-mint file:px-4 file:font-semibold file:text-obsidian-950"
        />
      </Field>
      {note && (
        <p role="status" className={`text-sm ${note.bad ? "text-redline" : "text-mint"}`}>
          {note.text}
        </p>
      )}
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Document preview" className="max-h-64 w-full rounded-xl border border-line object-contain" />
      )}

      <Field label="Notes"><textarea name="notes" rows={2} maxLength={500} defaultValue={defaults?.notes ?? ""} className={`${inputClass} h-auto py-3`} /></Field>
      <button type="submit" disabled={busy} className={`${buttonClass} disabled:opacity-50`}>
        {busy ? "Uploading..." : submitLabel}
      </button>
    </form>
  );
}
