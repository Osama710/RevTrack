import { redirect } from "next/navigation";
import { createFuel, createLog } from "../../actions";
import ExpenseForm from "@/components/ExpenseForm";
import { FormPage } from "@/components/ui/form";
import { requireUser } from "@/lib/auth";

export default async function NewLogPage({ searchParams }: { searchParams: Promise<{ error?: string; vehicle?: string; type?: string; item?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("vehicles").select("id, name, kind, current_mileage").order("created_at");
  const vehicles = data ?? [];
  if (vehicles.length === 0) redirect("/vehicles/new");
  const current = vehicles.find((v) => v.id === sp.vehicle) ?? vehicles[0];

  return (
    <FormPage title="Add an expense" error={sp.error} back="/ledger">
      <ExpenseForm
        vehicles={vehicles}
        vehicleId={current.id}
        odometer={current.current_mileage}
        today={new Date().toISOString().slice(0, 10)}
        initialMode={sp.type === "fuel" ? "fuel" : "maintenance"}
        itemName={sp.item}
        logAction={createLog}
        fuelAction={createFuel}
      />
    </FormPage>
  );
}
