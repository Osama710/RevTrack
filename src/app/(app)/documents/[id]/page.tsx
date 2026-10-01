import { notFound } from "next/navigation";
import { deleteDocument, updateDocument } from "../../actions";
import DocumentForm from "@/components/DocumentForm";
import { DeleteZone } from "@/components/forms";
import { FormPage } from "@/components/ui/form";
import { requireUser } from "@/lib/auth";
import { UUID_RE } from "@/lib/form";
import { DOC_COLS } from "@/types/db";

export default async function EditDocumentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID_RE.test(id)) notFound();
  const { supabase, user } = await requireUser();
  const [doc, vehicles] = await Promise.all([
    supabase.from("documents").select(DOC_COLS).eq("id", id).maybeSingle(),
    supabase.from("vehicles").select("id, name").order("created_at"),
  ]);
  if (!doc.data) notFound();

  return (
    <FormPage title="Edit document" back="/garage" error={sp.error}>
      <DocumentForm action={updateDocument} id={id} userId={user.id} vehicles={vehicles.data ?? []} submitLabel="Save changes" defaults={doc.data} />
      <DeleteZone action={deleteDocument} id={id} label="document" warning="The photo is deleted too. It can't be undone." />
    </FormPage>
  );
}
