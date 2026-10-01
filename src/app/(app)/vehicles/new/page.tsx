import { createVehicle } from "../../actions";
import { VehicleForm } from "@/components/forms";
import { FormPage } from "@/components/ui/form";

export default async function NewVehiclePage({ searchParams }: { searchParams: Promise<{ error?: string; kind?: string }> }) {
  const sp = await searchParams;
  return (
    <FormPage title="Add a vehicle" error={sp.error}>
      <VehicleForm
        action={createVehicle}
        submitLabel="Save vehicle"
        defaults={{ kind: sp.kind === "bike" ? "bike" : "car", name: "", make: null, model: null, year: null, current_mileage: 0 }}
      />
    </FormPage>
  );
}
