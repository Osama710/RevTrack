"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { UUID_RE, reader } from "@/lib/form";
import { DOC_TYPES } from "@/lib/docs";
import { CHECKLISTS } from "@/lib/checklists";
import { CURRENCIES } from "@/lib/profile";

type Reader = ReturnType<typeof reader>;

const refresh = () => revalidatePath("/", "layout");
const enc = encodeURIComponent;

/* ───────── shared field readers ───────── */

function readVehicle(f: Reader) {
  return {
    kind: f.pick("kind", "vehicle type", ["car", "bike"] as const),
    name: f.text("name", "Name", 60),
    make: f.optText("make", "Make", 60),
    model: f.optText("model", "Model", 60),
    year: f.optInt("year", "Year", 1900, 2100),
    current_mileage: f.int("current_mileage", "Odometer"),
    plate: f.optText("plate", "Number plate", 20)?.toUpperCase() ?? null,
    engine_no: f.optText("engine_no", "Engine number", 40)?.toUpperCase() ?? null,
    chassis_no: f.optText("chassis_no", "Chassis number", 40)?.toUpperCase() ?? null,
    color: f.optText("color", "Colour", 30),
    cplc_status: f.pick("cplc_status", "CPLC status", ["unverified", "clear", "stolen_reported"] as const),
    cplc_checked_on: f.optDate("cplc_checked_on", "CPLC check date"),
  };
}

function readLog(f: Reader) {
  return {
    expense_type: f.pick("expense_type", "expense type", ["maintenance", "tuning", "parts"] as const),
    vehicle_id: f.uuid("vehicle_id", "vehicle"),
    service_type: f.text("service_type", "Service type", 60),
    serviced_on: f.date("serviced_on", "Service date"),
    cost: f.money("cost", "Cost"),
    mileage: f.int("mileage", "Odometer"),
    notes: f.optText("notes", "Notes", 1000),
  };
}

function readTask(f: Reader) {
  return {
    vehicle_id: f.uuid("vehicle_id", "vehicle"),
    title: f.text("title", "Task", 120),
    service_type: f.text("service_type", "Service type", 60),
    due_date: f.optDate("due_date", "Due date"),
    target_mileage: f.optInt("target_mileage", "Target odometer"),
    notes: f.optText("notes", "Notes", 1000),
  };
}

/* ───────── vehicles ───────── */

export async function createVehicle(formData: FormData) {
  const { supabase } = await requireUser();
  const f = reader(formData, "/vehicles/new");
  const row = readVehicle(f);

  // user_id defaults to auth.uid() in the database; RLS enforces ownership.
  const { error } = await supabase.from("vehicles").insert(row);
  if (error) f.fail("Couldn't save the vehicle. Try again.");

  refresh();
  redirect("/dashboard");
}

export async function updateVehicle(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const f = reader(formData, `/vehicles/${enc(id)}/edit`);
  f.uuid("id", "vehicle");
  const row = readVehicle(f);

  const { data, error } = await supabase.from("vehicles").update(row).eq("id", id).select("id");
  if (error || !data?.length) f.fail("Couldn't save changes. Try again.");

  refresh();
  redirect(`/vehicles/${id}`);
}

export async function deleteVehicle(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) redirect("/dashboard");

  // Logs and tasks are removed by ON DELETE CASCADE.
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) redirect(`/vehicles/${id}/edit?error=${enc("Couldn't delete. Try again.")}`);

  refresh();
  redirect("/dashboard");
}

/* ───────── service logs ───────── */

async function bumpOdometer(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], vehicleId: string, mileage: number) {
  // The odometer only moves forward.
  await supabase.from("vehicles").update({ current_mileage: mileage }).eq("id", vehicleId).lt("current_mileage", mileage);
}

export async function createLog(formData: FormData) {
  const { supabase } = await requireUser();
  const f = reader(formData, `/logs/new?vehicle=${enc(String(formData.get("vehicle_id") ?? ""))}`);
  const row = readLog(f);

  const { error } = await supabase.from("maintenance_logs").insert(row);
  if (error) f.fail("Couldn't save the service. Check the vehicle and try again.");

  await bumpOdometer(supabase, row.vehicle_id, row.mileage);
  refresh();
  redirect("/dashboard");
}

export async function updateLog(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const f = reader(formData, `/logs/${enc(id)}/edit`);
  f.uuid("id", "service");
  const row = readLog(f);

  const { data, error } = await supabase.from("maintenance_logs").update(row).eq("id", id).select("id");
  if (error || !data?.length) f.fail("Couldn't save changes. Try again.");

  await bumpOdometer(supabase, row.vehicle_id, row.mileage);
  refresh();
  redirect(`/vehicles/${row.vehicle_id}`);
}

export async function deleteLog(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) redirect("/dashboard");

  const { data, error } = await supabase.from("maintenance_logs").delete().eq("id", id).select("vehicle_id");
  if (error) redirect(`/logs/${id}/edit?error=${enc("Couldn't delete. Try again.")}`);

  refresh();
  redirect(data?.[0] ? `/vehicles/${data[0].vehicle_id}` : "/dashboard");
}

export async function logOdometer(formData: FormData) {
  const { supabase } = await requireUser();
  const vehicleId = String(formData.get("vehicle_id") ?? "");
  const f = reader(formData, `/vehicles/${enc(vehicleId)}/odometer`);
  const vehicle_id = f.uuid("vehicle_id", "vehicle");
  const reading = f.int("reading", "Odometer");
  const read_on = f.date("read_on", "Date");

  const { data: v } = await supabase.from("vehicles").select("current_mileage").eq("id", vehicle_id).maybeSingle();
  if (!v) return f.fail("Vehicle not found.");
  if (reading < v.current_mileage) f.fail("The odometer can't go backwards. Edit the vehicle if you need to correct it.");

  const { error } = await supabase.from("odometer_readings").insert({ vehicle_id, reading, read_on });
  if (error) f.fail("Couldn't save the reading. Make sure 0003_odometer.sql has been run in Supabase.");

  await bumpOdometer(supabase, vehicle_id, reading);
  refresh();
  redirect(`/vehicles/${vehicle_id}`);
}

/* ───────── fuel ───────── */

function readFuel(f: Reader) {
  return {
    vehicle_id: f.uuid("vehicle_id", "vehicle"),
    filled_on: f.date("filled_on", "Date"),
    odometer: f.int("odometer", "Odometer"),
    liters: f.decimal("liters", "Litres", 0.1, 500),
    total_cost: f.decimal("total_cost", "Total cost"),
    station: f.text("station", "Petrol station", 40),
    area: f.optText("area", "Area", 60),
    full_tank: f.bool("full_tank"),
    notes: f.optText("notes", "Notes", 500),
  };
}

export async function createFuel(formData: FormData) {
  const { supabase } = await requireUser();
  const f = reader(formData, `/logs/new?type=fuel&vehicle=${enc(String(formData.get("vehicle_id") ?? ""))}`);
  const row = readFuel(f);
  const { error } = await supabase.from("fuel_entries").insert(row);
  if (error) f.fail("Couldn't save the fuel entry. Make sure 0004_garage_suite.sql has been run.");
  await bumpOdometer(supabase, row.vehicle_id, row.odometer);
  refresh();
  redirect("/ledger");
}

export async function updateFuel(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const f = reader(formData, `/fuel/${enc(id)}/edit`);
  f.uuid("id", "fuel entry");
  const row = readFuel(f);
  const { data, error } = await supabase.from("fuel_entries").update(row).eq("id", id).select("id");
  if (error || !data?.length) f.fail("Couldn't save changes. Try again.");
  await bumpOdometer(supabase, row.vehicle_id, row.odometer);
  refresh();
  redirect("/ledger");
}

export async function deleteFuel(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) redirect("/ledger");
  const { error } = await supabase.from("fuel_entries").delete().eq("id", id);
  if (error) redirect(`/fuel/${id}/edit?error=${enc("Couldn't delete. Try again.")}`);
  refresh();
  redirect("/ledger");
}

/* ───────── documents ───────── */

function readDoc(f: Reader, userId: string) {
  const image = f.optText("image_path", "Photo", 200);
  // The photo must sit in this user's own storage folder. Storage RLS enforces it too.
  if (image && !new RegExp(`^${userId}/[0-9a-f-]{36}\\.jpg$`, "i").test(image)) f.fail("That photo isn't valid. Attach it again.");
  return {
    doc_type: f.pick("doc_type", "document type", DOC_TYPES),
    title: f.text("title", "Title", 80),
    vehicle_id: f.optUuid("vehicle_id", "vehicle"),
    doc_number: f.optText("doc_number", "Number", 60),
    issued_on: f.optDate("issued_on", "Issue date"),
    expires_on: f.optDate("expires_on", "Expiry date"),
    image_path: image,
    notes: f.optText("notes", "Notes", 500),
  };
}

export async function createDocument(formData: FormData) {
  const { supabase, user } = await requireUser();
  const f = reader(formData, "/documents/new");
  const row = readDoc(f, user.id);
  const { error } = await supabase.from("documents").insert(row);
  if (error) f.fail("Couldn't save the document. Make sure 0004_garage_suite.sql has been run.");
  refresh();
  redirect("/garage");
}

export async function updateDocument(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const f = reader(formData, `/documents/${enc(id)}`);
  f.uuid("id", "document");
  const row = readDoc(f, user.id);

  const { data: old } = await supabase.from("documents").select("image_path").eq("id", id).maybeSingle();
  const { data, error } = await supabase.from("documents").update(row).eq("id", id).select("id");
  if (error || !data?.length) f.fail("Couldn't save changes. Try again.");
  if (old?.image_path && old.image_path !== row.image_path) await supabase.storage.from("documents").remove([old.image_path]);

  refresh();
  redirect("/garage");
}

export async function deleteDocument(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) redirect("/garage");
  const { data } = await supabase.from("documents").delete().eq("id", id).select("image_path");
  const path = data?.[0]?.image_path;
  if (path) await supabase.storage.from("documents").remove([path]);
  refresh();
  redirect("/garage");
}

/* ───────── ready-made checklists ───────── */

export async function addChecklist(formData: FormData) {
  const { supabase } = await requireUser();
  const f = reader(formData, "/dashboard");
  const vehicle_id = f.uuid("vehicle_id", "vehicle");
  const key = f.pick("checklist", "checklist", ["monsoon", "mechanic"] as const);
  const cl = CHECKLISTS[key];

  const { data: existing } = await supabase.from("tasks").select("title").eq("vehicle_id", vehicle_id).eq("status", "pending");
  const have = new Set((existing ?? []).map((t: { title: string }) => t.title));
  const rows = cl.items
    .filter((title) => !have.has(title))
    .map((title) => ({ vehicle_id, title, service_type: cl.serviceType, checklist: key }));

  if (rows.length) {
    const { error } = await supabase.from("tasks").insert(rows);
    if (error) f.fail("Couldn't add the checklist. Make sure 0004_garage_suite.sql has been run.");
  }
  refresh();
  redirect("/dashboard");
}

/* ───────── AI Ustad ───────── */

export async function clearUstadHistory() {
  const { supabase, user } = await requireUser();
  await supabase.from("ai_assistant_logs").delete().eq("user_id", user.id);
  redirect("/ustad");
}

/* ───────── tasks ───────── */

export async function createTask(formData: FormData) {
  const { supabase } = await requireUser();
  const f = reader(formData, `/tasks/new?vehicle=${enc(String(formData.get("vehicle_id") ?? ""))}`);
  const row = readTask(f);

  const { error } = await supabase.from("tasks").insert(row);
  if (error) f.fail("Couldn't save the task. Try again.");

  refresh();
  redirect("/dashboard");
}

export async function updateTask(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const f = reader(formData, `/tasks/${enc(id)}/edit`);
  f.uuid("id", "task");
  const row = readTask(f);

  const { data, error } = await supabase.from("tasks").update(row).eq("id", id).select("id");
  if (error || !data?.length) f.fail("Couldn't save changes. Try again.");

  refresh();
  redirect(`/vehicles/${row.vehicle_id}`);
}

export async function deleteTask(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) redirect("/dashboard");

  const { data, error } = await supabase.from("tasks").delete().eq("id", id).select("vehicle_id");
  if (error) redirect(`/tasks/${id}/edit?error=${enc("Couldn't delete. Try again.")}`);

  refresh();
  redirect(data?.[0] ? `/vehicles/${data[0].vehicle_id}` : "/dashboard");
}

/* ───────── profile and password ───────── */

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await requireUser();
  const f = reader(formData, "/settings");
  const display_name = f.optText("display_name", "Name", 60);
  const currency = f.pick("currency", "currency", CURRENCIES);

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, display_name, currency, updated_at: new Date().toISOString() });
  if (error) f.fail("Couldn't save your profile. Make sure 0002_profiles.sql has been run in Supabase.");

  refresh();
  redirect(`/settings?message=${enc("Profile saved.")}`);
}

export async function updatePassword(formData: FormData) {
  const { supabase } = await requireUser();
  const f = reader(formData, "/settings");
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) f.fail("Use at least 8 characters for your password.");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) f.fail(error.message);

  redirect(`/settings?message=${enc("Password updated.")}`);
}
