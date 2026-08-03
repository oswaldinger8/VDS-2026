"use client";

import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Snapshot = {
  score1: number;
  score2: number;
  currentPlayer: number;
  throwsInRound: number;
  player1Legs: number;
  player2Legs: number;
  turnStartScore: number;
  lastTurnScore: number;
};

export default function MatchPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [score1, setScore1] = useState(501);
  const [score2, setScore2] = useState(501);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [multiplier, setMultiplier] = useState<1 | 2 | 3>(1);
  const [throwsInRound, setThrowsInRound] = useState(0);
  const [player1Name, setPlayer1Name] = useState("Spieler 1");
  const [player2Name, setPlayer2Name] = useState("Spieler 2");
  const [namesLoaded, setNamesLoaded] = useState(false);
  const [player1Legs, setPlayer1Legs] = useState(0);
  const [player2Legs, setPlayer2Legs] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [tvCode, setTvCode] = useState("");
  const [turnStartScore, setTurnStartScore] = useState(501);
  const [lastTurnScore, setLastTurnScore] = useState(0);
  const [tournamentCode, setTournamentCode] = useState("");
  const [legsToWin, setLegsToWin] = useState(3);

  const turnScore =
    throwsInRound === 0 ? lastTurnScore : turnStartScore - (currentPlayer === 1 ? score1 : score2);

  useEffect(() => {
    if (!id) return;

    async function init() {
      let resolvedTvCode = localStorage.getItem(`tvCode_${id}`);
      let resolvedTournamentCode = localStorage.getItem(`tournamentCode_${id}`);
      let resolvedBestOf = localStorage.getItem(`bestOf_${id}`);
      let resolvedPlayer1: string | null = null;
      let resolvedPlayer2: string | null = null;

      // Try localStorage for player names
      try {
        const direct = localStorage.getItem(`matchPlayers_${id}`);
        if (direct) {
          const parsed = JSON.parse(direct);
          resolvedPlayer1 = parsed.player1;
          resolvedPlayer2 = parsed.player2;
        }

        const draft = JSON.parse(localStorage.getItem("newTournamentDraft") ?? "{}");
        const games = JSON.parse(localStorage.getItem(`games_${draft.tournamentCode}`) ?? "[]");
        const game = games.find((g: { id: string; player1: string; player2: string }) => g.id === id);

        if (!resolvedTournamentCode && draft.tournamentCode && game) {
          resolvedTournamentCode = draft.tournamentCode;
        }
        if (!resolvedBestOf && draft.bestOf && game) {
          resolvedBestOf = draft.bestOf;
        }
        if (!direct && game) {
          resolvedPlayer1 = game.player1;
          resolvedPlayer2 = game.player2;
        }
      } catch {}

      // Fall back to Supabase if TV code or names are still missing
      if (!resolvedTvCode || !resolvedPlayer1) {
        try {
          const { data } = await supabase
            .from("match_states")
            .select("tv_code, player1_name, player2_name")
            .eq("id", id)
            .maybeSingle();
          if (data) {
            if (!resolvedTvCode && data.tv_code) {
              resolvedTvCode = data.tv_code;
              localStorage.setItem(`tvCode_${id}`, data.tv_code);
            }
            if (!resolvedPlayer1 && data.player1_name && data.player1_name !== "Spieler 1") {
              resolvedPlayer1 = data.player1_name;
              resolvedPlayer2 = data.player2_name;
            }
          }
        } catch {}
      }

      // Generate a new TV code only if nothing exists anywhere
      if (!resolvedTvCode) {
        resolvedTvCode = String(Math.floor(1000 + Math.random() * 9000));
        localStorage.setItem(`tvCode_${id}`, resolvedTvCode);
      }

      setTvCode(resolvedTvCode);
      if (resolvedTournamentCode) setTournamentCode(resolvedTournamentCode);
      if (resolvedBestOf) setLegsToWin(Math.ceil(Number(resolvedBestOf) / 2));
      if (resolvedPlayer1) setPlayer1Name(resolvedPlayer1);
      if (resolvedPlayer2) setPlayer2Name(resolvedPlayer2 ?? "Spieler 2");
      setNamesLoaded(true);
    }

    init();
  }, [id]);

  const leaveMatch = useCallback(() => {
    if (!confirm("Spiel verlassen und Scheibe freigeben?")) return;

    if (tournamentCode) {
      try {
        const games = JSON.parse(localStorage.getItem(`games_${tournamentCode}`) ?? "[]");
        const updated = games.map((g: { id: string; status: string }) =>
          g.id === id ? { ...g, status: "finished" } : g
        );
        localStorage.setItem(`games_${tournamentCode}`, JSON.stringify(updated));
      } catch {}
      router.push(`/admin/${tournamentCode}`);
    } else {
      router.back();
    }
  }, [id, tournamentCode, router]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") leaveMatch();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [leaveMatch]);

  useEffect(() => {
    if (!id || !namesLoaded || !tvCode) return;

    supabase
      .from("match_states")
      .upsert({
        id,
        tv_code: tvCode,
        player1_name: player1Name,
        player2_name: player2Name,
        player1_score: score1,
        player2_score: score2,
        player1_legs: player1Legs,
        player2_legs: player2Legs,
        current_player: currentPlayer === 1 ? "player1" : "player2",
        throws_in_round: throwsInRound,
        turn_score: turnScore,
        updated_at: new Date().toISOString(),
      })
      .then((result: { error: { message: string } | null }) => {
        if (result.error) console.error("Supabase sync:", result.error.message);
      });
  }, [
    id,
    namesLoaded,
    score1,
    score2,
    currentPlayer,
    throwsInRound,
    turnScore,
    player1Name,
    player2Name,
    player1Legs,
    player2Legs,
    tvCode,
  ]);

  function saveSnapshot() {
    setHistory((prev) => [
      ...prev,
      {
        score1,
        score2,
        currentPlayer,
        throwsInRound,
        player1Legs,
        player2Legs,
        turnStartScore,
        lastTurnScore,
      },
    ]);
  }

  function getPoints(basePoints: number) {
    if (basePoints === 0) return 0;
    if (basePoints === 25) {
      return multiplier === 2 ? 50 : 25;
    }
    return basePoints * multiplier;
  }

  function isDouble(basePoints: number) {
    return multiplier === 2 && (basePoints === 25 || (basePoints >= 1 && basePoints <= 20));
  }

  function throwPoints(basePoints: number) {
    const points = getPoints(basePoints);
    saveSnapshot();

    const activeScore = currentPlayer === 1 ? score1 : score2;
    const startScore = throwsInRound === 0 ? activeScore : turnStartScore;
    if (throwsInRound === 0) setTurnStartScore(activeScore);

    const nextScore = activeScore - points;
    const nextThrows = throwsInRound + 1;

    if (nextScore < 0 || nextScore === 1) {
      if (currentPlayer === 1) {
        setScore1(startScore);
      } else {
        setScore2(startScore);
      }
      setLastTurnScore(0);
      setThrowsInRound(0);
      setMultiplier(1);
      setCurrentPlayer((prev) => (prev === 1 ? 2 : 1));
      return;
    }

    if (nextScore === 0) {
      if (!isDouble(basePoints)) {
        if (currentPlayer === 1) {
          setScore1(startScore);
        } else {
          setScore2(startScore);
        }
        setLastTurnScore(0);
        setThrowsInRound(0);
        setMultiplier(1);
        setCurrentPlayer((prev) => (prev === 1 ? 2 : 1));
        return;
      }

      setLastTurnScore(startScore);

      if (currentPlayer === 1) {
        const newLegs = player1Legs + 1;
        setPlayer1Legs(newLegs);
        if (newLegs >= legsToWin) {
          setWinner(player1Name);
        } else {
          setScore1(501);
          setScore2(501);
          setCurrentPlayer(2);
        }
      } else {
        const newLegs = player2Legs + 1;
        setPlayer2Legs(newLegs);
        if (newLegs >= legsToWin) {
          setWinner(player2Name);
        } else {
          setScore1(501);
          setScore2(501);
          setCurrentPlayer(1);
        }
      }

      setThrowsInRound(0);
      setMultiplier(1);
      return;
    }

    if (currentPlayer === 1) {
      setScore1(nextScore);
    } else {
      setScore2(nextScore);
    }

    setMultiplier(1);

    if (nextThrows >= 3) {
      setLastTurnScore(startScore - nextScore);
      setThrowsInRound(0);
      setCurrentPlayer((prev) => (prev === 1 ? 2 : 1));
    } else {
      setThrowsInRound(nextThrows);
    }
  }

  function switchPlayer() {
    saveSnapshot();
    setLastTurnScore(turnStartScore - (currentPlayer === 1 ? score1 : score2));
    setThrowsInRound(0);
    setMultiplier(1);
    setCurrentPlayer((prev) => (prev === 1 ? 2 : 1));
  }

  function undoLastAction() {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setScore1(last.score1);
    setScore2(last.score2);
    setCurrentPlayer(last.currentPlayer);
    setThrowsInRound(last.throwsInRound);
    setPlayer1Legs(last.player1Legs);
    setPlayer2Legs(last.player2Legs);
    setTurnStartScore(last.turnStartScore);
    setLastTurnScore(last.lastTurnScore);
    setWinner(null);
    setMultiplier(1);
    setHistory((prev) => prev.slice(0, -1));
  }

  if (winner) {
    return (
      <div className="relative min-h-screen bg-gray-900 overflow-hidden flex flex-col items-center justify-center text-white text-center">
        <div
          className="absolute inset-0 bg-center bg-no-repeat opacity-20 pointer-events-none"
          style={{ backgroundImage: "url('/logo.png')", backgroundSize: "140%" }}
        />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="text-3xl text-gray-300">Spielende</div>
          <div className="text-7xl font-bold">{winner}</div>
          <div className="text-2xl text-green-400">gewinnt das Match!</div>
          <div className="mt-4 text-lg text-gray-400">
            {player1Name}: {player1Legs} Legs &nbsp;·&nbsp; {player2Name}: {player2Legs} Legs
          </div>
          <button
            onClick={() => router.back()}
            className="mt-8 bg-white text-black px-8 py-3 rounded-xl text-lg font-semibold"
          >
            Zurück
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-100 overflow-hidden">
      <div
        className="absolute inset-0 bg-center bg-no-repeat opacity-30 pointer-events-none"
        style={{ backgroundImage: "url('/logo.png')", backgroundSize: "140%" }}
      />

      <div className="relative z-10 p-4 max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-3 bg-black text-white px-4 py-2 rounded-xl"
        >
          Zurück
        </button>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="bg-white p-4 rounded-2xl shadow text-center">
            <div className="text-sm text-gray-500">{player1Name}</div>
            <div className="text-4xl md:text-5xl font-bold">{score1}</div>
            <div className="mt-1 text-sm text-gray-500">Legs: {player1Legs}</div>
          </div>

          <div className="flex items-center justify-center text-2xl font-semibold">
            VS
          </div>

          <div className="bg-white p-4 rounded-2xl shadow text-center">
            <div className="text-sm text-gray-500">{player2Name}</div>
            <div className="text-4xl md:text-5xl font-bold">{score2}</div>
            <div className="mt-1 text-sm text-gray-500">Legs: {player2Legs}</div>
          </div>
        </div>

        <div className="bg-black text-white rounded-2xl px-5 py-2 mb-3 text-center">
          <span className="text-sm text-gray-400">TV Code: </span>
          <span className="text-2xl md:text-3xl font-bold tracking-widest">{tvCode}</span>
          <span className="ml-3 text-sm text-gray-400">→ tv eingeben auf dem TV</span>
        </div>

        <div className="text-center mb-3 text-lg">
          Aktiver Spieler: <b>{currentPlayer === 1 ? player1Name : player2Name}</b>
          <span className="ml-3 text-sm text-gray-500">Würfe: {throwsInRound} / 3</span>
          <span className="ml-3 text-sm text-gray-500">Geworfen: {turnScore}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          {([1, 2, 3] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMultiplier(m)}
              className={`p-3 rounded-xl font-semibold shadow text-base md:text-lg ${
                multiplier === m
                  ? m === 1
                    ? "bg-blue-500 text-white"
                    : m === 2
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              {m === 1 ? "Single" : m === 2 ? "Double" : "Triple"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-3 mb-3">
          {Array.from({ length: 20 }).map((_, i) => (
            <button
              key={i}
              onClick={() => throwPoints(i + 1)}
              className="bg-white h-16 md:h-20 rounded-xl shadow font-medium text-lg md:text-xl"
            >
              {multiplier > 1 ? `${multiplier === 2 ? "D" : "T"}${i + 1}` : i + 1}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-3">
          <button
            onClick={() => throwPoints(25)}
            className="bg-white h-16 md:h-20 rounded-xl shadow text-lg md:text-xl"
          >
            {multiplier === 2 ? "BULL 50" : "BULL 25"}
          </button>

          <button
            onClick={() => throwPoints(0)}
            className="bg-white h-16 md:h-20 rounded-xl shadow text-lg md:text-xl"
          >
            MISS
          </button>

          <button
            onClick={undoLastAction}
            disabled={history.length === 0}
            className="bg-orange-100 h-16 md:h-20 rounded-xl shadow text-lg md:text-xl disabled:opacity-50"
          >
            UNDO
          </button>

          <button
            onClick={switchPlayer}
            className="bg-black text-white h-16 md:h-20 rounded-xl text-lg md:text-xl"
          >
            Wechsel
          </button>
        </div>
      </div>
    </div>
  );
}