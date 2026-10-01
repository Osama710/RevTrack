import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/form";

// Streams a document photo to its owner only. Never cached by browsers or proxies.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return new Response("Not found", { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: doc } = await supabase.from("documents").select("image_path").eq("id", id).maybeSingle();
  if (!doc?.image_path) return new Response("Not found", { status: 404 });

  const { data: blob, error } = await supabase.storage.from("documents").download(doc.image_path);
  if (error || !blob) return new Response("Not found", { status: 404 });

  return new Response(blob, {
    headers: { "Content-Type": blob.type || "image/jpeg", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
