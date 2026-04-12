import { supabase } from "@/lib/supabase";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const { data, error } = await supabase
    .from("match_states")
    .select("*")
    .eq("tv_code", code)
    .single();

  if (error || !data) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  return Response.json(data, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
    },
  });
}
