import { createVehicle } from "../../actions";
import { Field, FormPage, buttonClass, inputClass } from "@/components/ui/form";

export default async function NewVehiclePage({ searchParams }: { searchParams: Promise<{ error?: string; kind?: string }> }) {
  const sp = await searchParams;
  const kind = sp.kind === "bike" ? "bike" : "car";

  return (
    <FormPage title="Add a vehicle" error={sp.error}>
      <form action={createVehicle} className="space-y-5">
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">Type</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["car", "bike"] as const).map((k) => (
              <label key={k} className="block">
                <input type="radio" name="kind" value={k} defaultChecked={kind === k} className="peer sr-only" />
                <span className="grid h-12 cursor-pointer place-items-center rounded-xl border border-line font-display font-semibold text-dim transition-colors peer-checked:border-mint peer-checked:bg-mint peer-checked:text-obsidian-950 peer-focus-visible:ring-4 peer-focus-visible:ring-mint/30">
                  {k === "car" ? "Car" : "Bike"}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Name" hint="What you call it, like Daily or Weekend bike.">
          <input name="name" required maxLength={60} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Make"><input name="make" maxLength={60} className={inputClass} /></Field>
          <Field label="Model"><input name="model" maxLength={60} className={inputClass} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Year"><input name="year" type="number" inputMode="numeric" min={1900} max={2100} className={inputClass} /></Field>
          <Field label="Odometer (km)"><input name="current_mileage" type="number" inputMode="numeric" min={0} required defaultValue={0} className={inputClass} /></Field>
        </div>
        <button type="submit" className={buttonClass}>Save vehicle</button>
      </form>
    </FormPage>
  );
}
