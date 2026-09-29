import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/dashboard/DashboardClient";
import type { LogEntry, Task, Vehicle } from "@/types/db";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS scopes every query to auth.uid(); no manual user_id filter needed.
  const [vehicles, logs, tasks] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id, kind, name, make, model, year, current_mileage")
      .order("created_at"),
    supabase
      .from("maintenance_logs")
      .select("id, vehicle_id, service_type, serviced_on, cost, mileage, notes")
      .order("serviced_on", { ascending: false })
      .limit(300),
    supabase
      .from("tasks")
      .select("id, vehicle_id, title, service_type, due_date, target_mileage, notes")
      .eq("status", "pending")
      .order("due_date", { ascending: true, nullsFirst: false }),
  ]);

  const failed = vehicles.error ?? logs.error ?? tasks.error;
  if (failed) throw new Error(failed.message);

  return (
    <DashboardClient
      vehicles={(vehicles.data ?? []) as Vehicle[]}
      logs={(logs.data ?? []) as LogEntry[]}
      tasks={(tasks.data ?? []) as Task[]}
    />
  );
}
