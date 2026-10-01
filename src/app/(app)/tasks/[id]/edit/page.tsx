import { notFound } from "next/navigation";
import { deleteTask, updateTask } from "../../../actions";
import { DeleteZone, TaskForm } from "@/components/forms";
import { FormPage } from "@/components/ui/form";
import { requireUser } from "@/lib/auth";
import { UUID_RE } from "@/lib/form";
import { TASK_COLS } from "@/types/db";

export default async function EditTaskPage({
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
  const [task, vehicles] = await Promise.all([
    supabase.from("tasks").select(TASK_COLS).eq("id", id).eq("status", "pending").maybeSingle(),
    supabase.from("vehicles").select("id, name, kind").order("created_at"),
  ]);
  if (!task.data) notFound();

  return (
    <FormPage title="Edit task" back={`/vehicles/${task.data.vehicle_id}`} error={sp.error}>
      <TaskForm action={updateTask} id={id} submitLabel="Save changes" vehicles={vehicles.data ?? []} defaults={task.data} />
      <DeleteZone action={deleteTask} id={id} label="task" warning="This removes the task from your to-do list. It can't be undone." />
    </FormPage>
  );
}
