import { notFound } from "next/navigation";
import { deleteLog, updateLog } from "../../../actions";
import { DeleteZone, LogForm } from "@/components/forms";
import { FormPage } from "@/components/ui/form";
import { requireUser } from "@/lib/auth";
import { UUID_RE } from "@/lib/form";
import { LOG_COLS } from "@/types/db";

export default async function EditLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID_RE.test(id)) notFound();
  const { supabase } = await requireUser();
  const [log, vehicles] = await Promise.all([
    supabase.from("maintenance_logs").select(LOG_COLS).eq("id", id).maybeSingle(),
    supabase.from("vehicles").select("id, name, kind").order("created_at"),
  ]);
  if (!log.data) notFound();

  return (
    <FormPage title="Edit service" back={`/vehicles/${log.data.vehicle_id}`} error={sp.error}>
      <LogForm
        action={updateLog}
        id={id}
        submitLabel="Save changes"
        vehicles={vehicles.data ?? []}
        defaults={{ ...log.data, cost: Number(log.data.cost) }}
      />
      <DeleteZone
        action={deleteLog}
        id={id}
        label="service"
        warning="This removes the entry from your history and changes future predictions. It can't be undone."
      />
    </FormPage>
  );
}
