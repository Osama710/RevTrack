"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { reader } from "@/lib/form";

export async function createVehicle(formData: FormData) {
  const { supabase } = await requireUser();
  const f = reader(formData, "/vehicles/new");

  const kind = f.pick("kind", "vehicle type", ["car", "bike"] as const);
  const row = {
    kind,
    name: f.text("name", "Name", 60),
    make: f.optText("make", "Make", 60),
    model: f.optText("model", "Model", 60),
    year: f.optInt("year", "Year", 1900, 2100),
    current_mileage: f.int("current_mileage", "Odometer"),
  };

  // user_id defaults to auth.uid() in the database; RLS enforces ownership.
  const { error } = await supabase.from("vehicles").insert(row);
  if (error) f.fail("Couldn't save the vehicle. Try again.");

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function createLog(formData: FormData) {
  const { supabase } = await requireUser();
  const vehicleId = String(formData.get("vehicle_id") ?? "");
  const f = reader(formData, `/logs/new?vehicle=${encodeURIComponent(vehicleId)}`);

  const vehicle_id = f.uuid("vehicle_id", "vehicle");
  const mileage = f.int("mileage", "Odometer");
  const row = {
    vehicle_id,
    service_type: f.text("service_type", "Service type", 60),
    serviced_on: f.date("serviced_on", "Service date"),
    cost: f.money("cost", "Cost"),
    mileage,
    notes: f.optText("notes", "Notes", 1000),
  };

  const { error } = await supabase.from("maintenance_logs").insert(row);
  if (error) f.fail("Couldn't save the service. Check the vehicle and try again.");

  // Keep the odometer moving forward only.
  await supabase.from("vehicles").update({ current_mileage: mileage }).eq("id", vehicle_id).lt("current_mileage", mileage);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function createTask(formData: FormData) {
  const { supabase } = await requireUser();
  const vehicleId = String(formData.get("vehicle_id") ?? "");
  const f = reader(formData, `/tasks/new?vehicle=${encodeURIComponent(vehicleId)}`);

  const row = {
    vehicle_id: f.uuid("vehicle_id", "vehicle"),
    title: f.text("title", "Task", 120),
    service_type: f.text("service_type", "Service type", 60),
    due_date: f.optDate("due_date", "Due date"),
    target_mileage: f.optInt("target_mileage", "Target odometer"),
    notes: f.optText("notes", "Notes", 1000),
  };

  const { error } = await supabase.from("tasks").insert(row);
  if (error) f.fail("Couldn't save the task. Try again.");

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
