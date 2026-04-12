import { saveMatch, MatchState } from "@/lib/localStore";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = (await request.json()) as MatchState;

  // Sofort im lokalen Speicher ablegen (< 1ms)
  saveMatch(body);

  // Supabase im Hintergrund — kein await, blockiert nicht
  supabase.from("match_states").upsert({
    id: body.id,
    tv_code: body.tv_code,
    player1_name: body.player1_name,
    player2_name: body.player2_name,
    player1_score: body.player1_score,
    player2_score: body.player2_score,
    current_player: body.current_player,
    throws_in_round: body.throws_in_round,
    updated_at: new Date().toISOString(),
  }).then(({ error }) => {
    if (error) console.error("Supabase sync:", error.message);
  });

  return Response.json({ ok: true });
}
