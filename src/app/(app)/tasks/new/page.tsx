import { redirect } from "next/navigation";
import { createTask } from "../../actions";
import { requireUser } from "@/lib/auth";
import { SERVICE_TYPES } from "@/lib/service-types";
import { Field, FormPage, buttonClass, inputClass } from "@/components/ui/form";

export default async function NewTaskPage({ searchParams }: { searchParams: Promise<{ error?: string; vehicle?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("vehicles").select("id, name, kind").order("created_at");
  const vehicles = data ?? [];
  if (vehicles.length === 0) redirect("/vehicles/new");

  const current = vehicles.find((v) => v.id === sp.vehicle) ?? vehicles[0];

  return (
    <FormPage title="Add a task" error={sp.error}>
      <form action={createTask} className="space-y-5">
        <Field label="Vehicle">
          <select name="vehicle_id" defaultValue={current.id} className={inputClass}>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name} ({v.kind})</option>
            ))}
          </select>
        </Field>
        <Field label="Task" hint="For example: Replace front brake pads.">
          <input name="title" required maxLength={120} className={inputClass} />
        </Field>
        <Field label="Service type" hint="When you tick it off, it is logged under this name.">
          <input name="service_type" list="service-types" required maxLength={60} className={inputClass} />
          <datalist id="service-types">
            {SERVICE_TYPES.map((s) => <option key={s} value={s} />)}
          </datalist>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Due date"><input name="due_date" type="date" className={inputClass} /></Field>
          <Field label="At odometer (km)"><input name="target_mileage" type="number" inputMode="numeric" min={0} className={inputClass} /></Field>
        </div>
        <Field label="Notes">
          <textarea name="notes" rows={3} maxLength={1000} className={`${inputClass} h-auto py-3`} />
        </Field>
        <button type="submit" className={buttonClass}>Save task</button>
      </form>
    </FormPage>
  );
}
