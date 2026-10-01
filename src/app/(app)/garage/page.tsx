import GarageClient from "@/components/GarageClient";
import { requireUser } from "@/lib/auth";
import { DOC_COLS, type DocumentRow } from "@/types/db";

export default async function GaragePage() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("documents").select(DOC_COLS).order("expires_on", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return <GarageClient docs={(data ?? []) as DocumentRow[]} />;
}
