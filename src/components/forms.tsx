import FuelKindFields from "@/components/FuelKindFields";
import { Field, SubmitButton, inputClass } from "@/components/ui/form";
import { FUEL_STATIONS, KARACHI_AREAS, SERVICE_TYPES } from "@/lib/service-types";
import { CATEGORY_META } from "@/lib/ledger";
import type { ExpenseType, FuelKind } from "@/types/db";

type Action = (formData: FormData) => void | Promise<void>;
type VehicleOption = { id: string; name: string; kind: string };

const Hidden = ({ id }: { id?: string }) => (id ? <input type="hidden" name="id" value={id} /> : null);

function ServiceTypeInput({ defaultValue }: { defaultValue?: string }) {
  return (
    <>
      <input name="service_type" list="service-types" required maxLength={60} defaultValue={defaultValue ?? ""} className={inputClass} />
      <datalist id="service-types">
        {SERVICE_TYPES.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </>
  );
}

function VehicleSelect({ vehicles, value }: { vehicles: VehicleOption[]; value: string }) {
  return (
    <Field label="Vehicle">
      <select name="vehicle_id" defaultValue={value} className={inputClass}>
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name} ({v.kind})
          </option>
        ))}
      </select>
    </Field>
  );
}

export function VehicleForm({
  action,
  id,
  submitLabel,
  defaults,
}: {
  action: Action;
  id?: string;
  submitLabel: string;
  defaults?: {
    kind: string;
    name: string;
    make: string | null;
    model: string | null;
    year: number | null;
    current_mileage: number;
    plate?: string | null;
    engine_no?: string | null;
    chassis_no?: string | null;
    color?: string | null;
    cplc_status?: string;
    cplc_checked_on?: string | null;
  };
}) {
  const kind = defaults?.kind === "bike" ? "bike" : "car";
  return (
    <form action={action} className="space-y-5">
      <Hidden id={id} />
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
        <input name="name" required maxLength={60} defaultValue={defaults?.name ?? ""} className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Make"><input name="make" maxLength={60} defaultValue={defaults?.make ?? ""} className={inputClass} /></Field>
        <Field label="Model"><input name="model" maxLength={60} defaultValue={defaults?.model ?? ""} className={inputClass} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Year"><input name="year" type="number" inputMode="numeric" min={1900} max={2100} defaultValue={defaults?.year ?? ""} className={inputClass} /></Field>
        <Field label="Odometer (km)"><input name="current_mileage" type="number" inputMode="numeric" min={0} required defaultValue={defaults?.current_mileage ?? 0} className={inputClass} /></Field>
      </div>

      <details className="rounded-2xl border border-line px-4 open:pb-4" open={!!(defaults?.plate || defaults?.engine_no || defaults?.chassis_no)}>
        <summary className="flex min-h-14 cursor-pointer items-center font-semibold">Registration details (for Excise mode and SOS)</summary>
        <div className="space-y-5">
          <Field label="Number plate"><input name="plate" maxLength={20} defaultValue={defaults?.plate ?? ""} autoCapitalize="characters" className={inputClass} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Engine no."><input name="engine_no" maxLength={40} defaultValue={defaults?.engine_no ?? ""} autoCapitalize="characters" className={inputClass} /></Field>
            <Field label="Chassis no."><input name="chassis_no" maxLength={40} defaultValue={defaults?.chassis_no ?? ""} autoCapitalize="characters" className={inputClass} /></Field>
          </div>
          <Field label="Colour"><input name="color" maxLength={30} defaultValue={defaults?.color ?? ""} className={inputClass} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CPLC status">
              <select name="cplc_status" defaultValue={defaults?.cplc_status ?? "unverified"} className={inputClass}>
                <option value="unverified">Not verified</option>
                <option value="clear">Clear</option>
                <option value="stolen_reported">Stolen reported</option>
              </select>
            </Field>
            <Field label="Checked on"><input name="cplc_checked_on" type="date" defaultValue={defaults?.cplc_checked_on ?? ""} className={inputClass} /></Field>
          </div>
        </div>
      </details>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}

export function LogForm({
  action,
  id,
  submitLabel,
  vehicles,
  defaults,
  expenseType,
  typeMode = "select",
}: {
  action: Action;
  id?: string;
  submitLabel: string;
  vehicles: VehicleOption[];
  defaults: {
    vehicle_id: string;
    service_type?: string;
    serviced_on: string;
    cost: number;
    mileage: number;
    notes?: string | null;
    expense_type?: ExpenseType;
  };
  expenseType?: ExpenseType;
  /** "hidden" when the parent already shows a type switcher. */
  typeMode?: "select" | "hidden";
}) {
  const type = expenseType ?? defaults.expense_type ?? "maintenance";
  return (
    <form action={action} className="space-y-5">
      <Hidden id={id} />
      {typeMode === "hidden" ? (
        <input type="hidden" name="expense_type" value={type} />
      ) : (
        <Field label="Type">
          <select name="expense_type" defaultValue={type} className={inputClass}>
            {(["maintenance", "tuning", "parts"] as const).map((t) => (
              <option key={t} value={t}>{CATEGORY_META[t].label}</option>
            ))}
          </select>
        </Field>
      )}
      <VehicleSelect vehicles={vehicles} value={defaults.vehicle_id} />
      <Field label="Item or service" hint="Use the same name each time so RevTrack can learn your interval.">
        <ServiceTypeInput defaultValue={defaults.service_type} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><input name="serviced_on" type="date" required defaultValue={defaults.serviced_on} className={inputClass} /></Field>
        <Field label="Odometer (km)"><input name="mileage" type="number" inputMode="numeric" min={0} required defaultValue={defaults.mileage} className={inputClass} /></Field>
      </div>
      <Field label="Cost"><input name="cost" type="number" inputMode="decimal" min={0} step="0.01" defaultValue={defaults.cost} className={inputClass} /></Field>
      <Field label="Notes"><textarea name="notes" rows={3} maxLength={1000} defaultValue={defaults.notes ?? ""} className={`${inputClass} h-auto py-3`} /></Field>
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}

export function FuelForm({
  action,
  id,
  submitLabel,
  vehicles,
  defaults,
}: {
  action: Action;
  id?: string;
  submitLabel: string;
  vehicles: VehicleOption[];
  defaults: {
    vehicle_id: string;
    filled_on: string;
    odometer: number;
    liters?: number;
    fuel_kind?: FuelKind;
    total_cost?: number;
    station?: string;
    area?: string | null;
    full_tank?: boolean;
    notes?: string | null;
  };
}) {
  const kind = defaults.fuel_kind === "lpg" ? "lpg" : "petrol";
  return (
    <form action={action} className="space-y-5">
      <Hidden id={id} />
      <datalist id="fuel-stations">{FUEL_STATIONS.map((s) => <option key={s} value={s} />)}</datalist>
      <VehicleSelect vehicles={vehicles} value={defaults.vehicle_id} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><input name="filled_on" type="date" required defaultValue={defaults.filled_on} className={inputClass} /></Field>
        <Field label="Odometer (km)"><input name="odometer" type="number" inputMode="numeric" min={0} required defaultValue={defaults.odometer} className={inputClass} /></Field>
      </div>
      <FuelKindFields defaultKind={kind} defaults={defaults} />
      <Field label="Notes"><textarea name="notes" rows={2} maxLength={500} defaultValue={defaults.notes ?? ""} className={`${inputClass} h-auto py-3`} /></Field>
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}

/** Native <details>: works without JavaScript and needs a second tap to confirm. */
export function DeleteZone({ action, id, label, warning }: { action: Action; id: string; label: string; warning: string }) {
  return (
    <details className="mt-10 rounded-2xl border border-redline/40 px-4 open:pb-4">
      <summary className="flex min-h-14 cursor-pointer items-center font-semibold text-redline">Delete this {label}</summary>
      <p className="text-sm text-dim">{warning}</p>
      <form action={action} className="mt-3">
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="h-12 w-full rounded-full bg-redline font-display font-semibold text-bone transition-transform active:scale-[0.98]">
          Yes, delete {label}
        </button>
      </form>
    </details>
  );
}

export function TaskForm({
  action,
  id,
  submitLabel,
  vehicles,
  defaults,
}: {
  action: Action;
  id?: string;
  submitLabel: string;
  vehicles: VehicleOption[];
  defaults: { vehicle_id: string; title?: string; service_type?: string; due_date?: string | null; target_mileage?: number | null; notes?: string | null };
}) {
  return (
    <form action={action} className="space-y-5">
      <Hidden id={id} />
      <VehicleSelect vehicles={vehicles} value={defaults.vehicle_id} />
      <Field label="Task" hint="For example: Replace front brake pads.">
        <input name="title" required maxLength={120} defaultValue={defaults.title ?? ""} className={inputClass} />
      </Field>
      <Field label="Service type" hint="When you tick it off, it is logged under this name.">
        <ServiceTypeInput defaultValue={defaults.service_type} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Due date"><input name="due_date" type="date" defaultValue={defaults.due_date ?? ""} className={inputClass} /></Field>
        <Field label="At odometer (km)"><input name="target_mileage" type="number" inputMode="numeric" min={0} defaultValue={defaults.target_mileage ?? ""} className={inputClass} /></Field>
      </div>
      <Field label="Notes"><textarea name="notes" rows={3} maxLength={1000} defaultValue={defaults.notes ?? ""} className={`${inputClass} h-auto py-3`} /></Field>
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
