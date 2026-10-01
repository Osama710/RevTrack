import { clearUstadHistory } from "../actions";
import UstadChat from "@/components/UstadChat";
import { requireUser } from "@/lib/auth";

export default async function UstadPage() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("ai_assistant_logs").select("role, content").order("created_at", { ascending: false }).limit(30);
  const initial = ((data ?? []) as { role: "user" | "assistant"; content: string }[]).reverse();
  return <UstadChat initial={initial} clearAction={clearUstadHistory} />;
}
