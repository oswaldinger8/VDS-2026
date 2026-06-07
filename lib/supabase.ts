import { createClient, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = url && key ? createClient(url, key) : createClient("https://placeholder.supabase.co", "placeholder");

export type Player = {
  id: string;
  tournament_code: string;
  name: string;
  created_at: string;
};

export type MatchState = {
  id: string;
  tv_code: string;
  player1_name: string;
  player2_name: string;
  player1_score: number;
  player2_score: number;
  player1_legs?: number;
  player2_legs?: number;
  current_player: "player1" | "player2";
  throws_in_round: number;
};