"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Snapshot = {
  score1: number;
  score2: number;
  currentPlayer: number;
  throwsInRound: number;
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
  const [player1Legs, setPlayer1Legs] = useState(0);
  const [player2Legs, setPlayer2Legs] = useState(0);
  const [tvCode] = useState(() => {
    const stored = localStorage.getItem(`tvCode_${id}`);
    if (stored) return stored;
    const code = String(Math.floor(1000 + Math.random() * 9000));
    localStorage.setItem(`tvCode_${id}`, code);
    return code;
  });

  useEffect(() => {
    if (!id) return;
    try {
      const draft = JSON.parse(localStorage.getItem("newTournamentDraft") ?? "{}");
      const games = JSON.parse(localStorage.getItem(`games_${draft.tournamentCode}`) ?? "[]");
      const game = games.find((g: { id: string; player1: string; player2: string }) => g.id === id);
      if (game) {
        setPlayer1Name(game.player1);
        setPlayer2Name(game.player2);
      }
    } catch {}
  }, [id]);

  useEffect(() => {
    if (!id) return;

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
        updated_at: new Date().toISOString(),
      })
      .then((result: { error: { message: string } | null }) => {
        if (result.error) console.error("Supabase sync:", result.error.message);
      });
  }, [
    id,
    score1,
    score2,
    currentPlayer,
    throwsInRound,
    player1Name,
    player2Name,
    player1Legs,
    player2Legs,
    tvCode,
  ]);

  function saveSnapshot() {
    setHistory((prev) => [...prev, { score1, score2, currentPlayer, throwsInRound }]);
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
    const nextScore = activeScore - points;
    const nextThrows = throwsInRound + 1;

    if (nextScore < 0 || nextScore === 1) {
      setThrowsInRound(0);
      setMultiplier(1);
      setCurrentPlayer((prev) => (prev === 1 ? 2 : 1));
      return;
    }

    if (nextScore === 0) {
      if (!isDouble(basePoints)) {
        setThrowsInRound(0);
        setMultiplier(1);
        setCurrentPlayer((prev) => (prev === 1 ? 2 : 1));
        return;
      }

      if (currentPlayer === 1) {
        setScore1(501);
        setScore2(501);
        setPlayer1Legs((prev) => prev + 1);
        setCurrentPlayer(2);
      } else {
        setScore1(501);
        setScore2(501);
        setPlayer2Legs((prev) => prev + 1);
        setCurrentPlayer(1);
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
      setThrowsInRound(0);
      setCurrentPlayer((prev) => (prev === 1 ? 2 : 1));
    } else {
      setThrowsInRound(nextThrows);
    }
  }

  function switchPlayer() {
    saveSnapshot();
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
    setMultiplier(1);
    setHistory((prev) => prev.slice(0, -1));
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