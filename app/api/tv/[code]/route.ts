import { matchStore, tvCodeIndex } from "@/lib/matchStore";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const matchId = tvCodeIndex.get(code);
  if (!matchId) {
    return Response.json({ error: "code not found" }, { status: 404 });
  }

  const state = matchStore.get(matchId);
  if (!state) {
    return Response.json({ error: "match not found" }, { status: 404 });
  }

  return Response.json(state);
}
