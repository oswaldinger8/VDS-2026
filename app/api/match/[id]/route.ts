import { matchStore, tvCodeIndex, MatchState } from "@/lib/matchStore";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const state = matchStore.get(id);
  if (!state) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return Response.json(state);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as MatchState;
  matchStore.set(id, body);
  if (body.tvCode) {
    tvCodeIndex.set(body.tvCode, id);
  }
  return Response.json({ ok: true });
}
