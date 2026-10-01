import { createDocument } from "../../actions";
import DocumentForm from "@/components/DocumentForm";
import { FormPage } from "@/components/ui/form";
import { requireUser } from "@/lib/auth";

export default async function NewDocumentPage({ searchParams }: { searchParams: Promise<{ error?: string; vehicle?: string }> }) {
  const sp = await searchParams;
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("vehicles").select("id, name").order("created_at");
  return (
    <FormPage title="Add a document" back="/garage" error={sp.error}>
      <DocumentForm action={createDocument} userId={user.id} vehicles={data ?? []} submitLabel="Save document" defaults={{ vehicle_id: sp.vehicle ?? null }} />
    </FormPage>
  );
}
