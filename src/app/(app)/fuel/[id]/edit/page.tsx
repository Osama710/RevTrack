import { notFound } from "next/navigation";
import { deleteFuel, updateFuel } from "../../../actions";
import { DeleteZone, FuelForm } from "@/components/forms";
import { FormPage } from "@/components/ui/form";
import { requireUser } from "@/lib/auth";
import { UUID_RE } from "@/lib/form";
import { FUEL_COLS } from "@/types/db";

export default async function EditFuelPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID_RE.test(id)) notFound();
  const { supabase } = await requireUser();
  const [fuel, vehicles] = await Promise.all([
    supabase.from("fuel_entries").select(FUEL_COLS).eq("id", id).maybeSingle(),
    supabase.from("vehicles").select("id, name, kind").order("created_at"),
  ]);
  if (!fuel.data) notFound();
  const f = fuel.data;

  return (
    <FormPage title="Edit fuel entry" back="/ledger" error={sp.error}>
      <FuelForm
        action={updateFuel}
        id={id}
        submitLabel="Save changes"
        vehicles={vehicles.data ?? []}
        defaults={{
          ...f,
          fuel_kind: f.fuel_kind === "lpg" ? "lpg" : "petrol",
          liters: Number(f.liters),
          total_cost: Number(f.total_cost),
        }}
      />
      <DeleteZone action={deleteFuel} id={id} label="fuel entry" warning="This changes your fuel economy figures. It can't be undone." />
    </FormPage>
  );
}
