export type MatchState = {
  id: string;
  tv_code: string;
  player1_name: string;
  player2_name: string;
  player1_score: number;
  player2_score: number;
  current_player: "player1" | "player2";
  throws_in_round: number;
};

declare global {
  var localMatchStore: Map<string, MatchState> | undefined;
  var localTvIndex: Map<string, string> | undefined;
}

export const localMatchStore: Map<string, MatchState> =
  global.localMatchStore ?? (global.localMatchStore = new Map());

export const localTvIndex: Map<string, string> =
  global.localTvIndex ?? (global.localTvIndex = new Map());

export function saveMatch(state: MatchState) {
  localMatchStore.set(state.id, state);
  localTvIndex.set(state.tv_code, state.id);
}

export function getMatchByTvCode(tvCode: string): MatchState | undefined {
  const id = localTvIndex.get(tvCode);
  return id ? localMatchStore.get(id) : undefined;
}
