import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  return new Response(JSON.stringify({ code }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}