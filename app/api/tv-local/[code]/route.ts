import { getMatchByTvCode } from "@/lib/localStore";

export const dynamic = "force-dynamic";

export function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const state = getMatchByTvCode(params.code);
  if (!state) {
    return Response.json({ error: "not found" }, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }
  return Response.json(state, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
    },
  });
}
