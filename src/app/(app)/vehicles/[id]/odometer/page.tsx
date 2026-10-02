import { notFound } from "next/navigation";
import { logOdometer } from "../../../actions";
import { Field, FormPage, SubmitButton, inputClass } from "@/components/ui/form";
import { requireUser } from "@/lib/auth";
import { UUID_RE } from "@/lib/form";
import { km } from "@/lib/format";

export default async function OdometerPage({
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
  const { data: v } = await supabase.from("vehicles").select("id, name, current_mileage").eq("id", id).maybeSingle();
  if (!v) notFound();

  return (
    <FormPage title="Update odometer" back={`/vehicles/${id}`} error={sp.error}>
      <p className="-mt-4 mb-5 text-sm text-dim">
        {v.name} is at {km(v.current_mileage)} km. Check the dash and enter what it reads now.
      </p>
      <form action={logOdometer} className="space-y-5">
        <input type="hidden" name="vehicle_id" value={id} />
        <Field label="Odometer (km)">
          <input name="reading" type="number" inputMode="numeric" min={v.current_mileage} required defaultValue={v.current_mileage} className={inputClass} />
        </Field>
        <Field label="Date">
          <input name="read_on" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
        </Field>
        <SubmitButton>Save reading</SubmitButton>
      </form>
    </FormPage>
  );
}
