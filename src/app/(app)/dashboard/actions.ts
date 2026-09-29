"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LogEntry } from "@/types/db";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CompleteResult = { ok: true; log: LogEntry } | { ok: false; error: string };

export async function completeTask(input: {
  taskId: string;
  mileage: number;
  cost?: number;
  notes?: string;
}): Promise<CompleteResult> {
  const supabase = await createClient();

  // getUser() re-validates the JWT with Supabase Auth; getSession() only reads the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session has expired. Sign in again." };

  const cost = input.cost ?? 0;
  if (!UUID.test(input.taskId)) return { ok: false, error: "Invalid task." };
  if (!Number.isInteger(input.mileage) || input.mileage < 0) return { ok: false, error: "Enter a valid odometer reading." };
  if (!Number.isFinite(cost) || cost < 0) return { ok: false, error: "Cost can't be negative." };
  if (input.notes && input.notes.length > 1000) return { ok: false, error: "Notes are too long." };

  // RLS still applies inside the function (security invoker), so another user's task can't be touched.
  const { data, error } = await supabase.rpc("complete_task", {
    p_task_id: input.taskId,
    p_mileage: input.mileage,
    p_cost: cost,
    p_notes: input.notes ?? null,
  });

  if (error || !data) {
    return { ok: false, error: error?.code === "P0002" ? "That task is already done." : "Couldn't save. Try again." };
  }

  revalidatePath("/dashboard");
  return { ok: true, log: data as LogEntry };
}
