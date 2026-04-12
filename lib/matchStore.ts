export type MatchState = {
  player1Score: number;
  player2Score: number;
  player1Name: string;
  player2Name: string;
  currentPlayer: "player1" | "player2";
  throwsInRound: number;
  tvCode: string;
};

declare global {
  var matchStore: Map<string, MatchState> | undefined;
  var tvCodeIndex: Map<string, string> | undefined;
}

export const matchStore: Map<string, MatchState> =
  global.matchStore ?? (global.matchStore = new Map());

export const tvCodeIndex: Map<string, string> =
  global.tvCodeIndex ?? (global.tvCodeIndex = new Map());
