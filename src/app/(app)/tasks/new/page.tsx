import { redirect } from "next/navigation";
import { createTask } from "../../actions";
import { TaskForm } from "@/components/forms";
import { requireUser } from "@/lib/auth";
import { FormPage } from "@/components/ui/form";

export default async function NewTaskPage({ searchParams }: { searchParams: Promise<{ error?: string; vehicle?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("vehicles").select("id, name, kind").order("created_at");
  const vehicles = data ?? [];
  if (vehicles.length === 0) redirect("/vehicles/new");
  const current = vehicles.find((v) => v.id === sp.vehicle) ?? vehicles[0];

  return (
    <FormPage title="Add a task" error={sp.error} back={`/vehicles/${current.id}`}>
      <TaskForm action={createTask} submitLabel="Save task" vehicles={vehicles} defaults={{ vehicle_id: current.id }} />
    </FormPage>
  );
}
