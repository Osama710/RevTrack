import { redirect } from "next/navigation";
import { createLog } from "../../actions";
import { requireUser } from "@/lib/auth";
import { SERVICE_TYPES } from "@/lib/service-types";
import { Field, FormPage, buttonClass, inputClass } from "@/components/ui/form";

export default async function NewLogPage({ searchParams }: { searchParams: Promise<{ error?: string; vehicle?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("vehicles").select("id, name, kind, current_mileage").order("created_at");
  const vehicles = data ?? [];
  if (vehicles.length === 0) redirect("/vehicles/new");

  const current = vehicles.find((v) => v.id === sp.vehicle) ?? vehicles[0];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <FormPage title="Log a service" error={sp.error}>
      <form action={createLog} className="space-y-5">
        <Field label="Vehicle">
          <select name="vehicle_id" defaultValue={current.id} className={inputClass}>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name} ({v.kind})</option>
            ))}
          </select>
        </Field>
        <Field label="Service" hint="Use the same name each time so RevTrack can learn your interval.">
          <input name="service_type" list="service-types" required maxLength={60} className={inputClass} />
          <datalist id="service-types">
            {SERVICE_TYPES.map((s) => <option key={s} value={s} />)}
          </datalist>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><input name="serviced_on" type="date" required defaultValue={today} className={inputClass} /></Field>
          <Field label="Odometer (km)"><input name="mileage" type="number" inputMode="numeric" min={0} required defaultValue={current.current_mileage} className={inputClass} /></Field>
        </div>
        <Field label="Cost"><input name="cost" type="number" inputMode="decimal" min={0} step="0.01" defaultValue={0} className={inputClass} /></Field>
        <Field label="Notes">
          <textarea name="notes" rows={3} maxLength={1000} className={`${inputClass} h-auto py-3`} />
        </Field>
        <button type="submit" className={buttonClass}>Save service</button>
      </form>
    </FormPage>
  );
}
