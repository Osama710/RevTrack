import { notFound } from "next/navigation";
import { deleteVehicle, updateVehicle } from "../../../actions";
import { DeleteZone, VehicleForm } from "@/components/forms";
import { FormPage } from "@/components/ui/form";
import { requireUser } from "@/lib/auth";
import { UUID_RE } from "@/lib/form";
import { VEHICLE_COLS } from "@/types/db";

export default async function EditVehiclePage({
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
  const { data: v } = await supabase
    .from("vehicles")
    .select(VEHICLE_COLS)
    .eq("id", id)
    .maybeSingle();
  if (!v) notFound();

  return (
    <FormPage title="Edit vehicle" back={`/vehicles/${id}`} error={sp.error}>
      <VehicleForm action={updateVehicle} id={id} submitLabel="Save changes" defaults={v} />
      <DeleteZone
        action={deleteVehicle}
        id={id}
        label="vehicle"
        warning="This also deletes its service history and tasks. It can't be undone."
      />
    </FormPage>
  );
}
