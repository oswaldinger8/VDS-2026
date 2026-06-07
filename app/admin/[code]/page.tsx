"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase, Player } from "@/lib/supabase";

type Draft = {
  name: string;
  pin: string;
  bestOf: string;
  boards: string;
  tournamentCode: string;
};

type Game = {
  id: string;
  board: number;
  player1: string;
  player2: string;
  status: "waiting" | "live" | "finished";
};

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function AdminPage() {
  const params = useParams();
  const code = params.code as string;
  const router = useRouter();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [singleName, setSingleName] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("");

  // Tournament-Daten aus localStorage
  useEffect(() => {
    const raw = localStorage.getItem("newTournamentDraft");
    if (!raw) return;
    try {
      const parsed: Draft = JSON.parse(raw);
      if (parsed.tournamentCode === code) setDraft(parsed);
    } catch {}

    const storedGames = localStorage.getItem(`games_${code}`);
    if (storedGames) {
      try { setGames(JSON.parse(storedGames)); } catch {}
    }
  }, [code]);

  // Spieler aus Supabase laden
  useEffect(() => {
    if (!code) return;

    supabase
      .from("players")
      .select("*")
      .eq("tournament_code", code)
      .order("name")
      .then(({ data }) => {
        if (data) setPlayers(data as Player[]);
      });
  }, [code]);

  async function addSinglePlayer() {
    const trimmed = singleName.trim();
    if (!trimmed) return;

    const newPlayer = { id: makeId(), tournament_code: code, name: trimmed };
    const { data, error } = await supabase
      .from("players")
      .upsert(newPlayer, { onConflict: "tournament_code,name", ignoreDuplicates: true })
      .select()
      .single();

    if (!error && data) {
      setPlayers((prev) =>
        [...prev, data as Player].sort((a, b) => a.name.localeCompare(b.name))
      );
    }
    setSingleName("");
  }

  async function addBulkPlayers() {
    setBulkError("");
    const names = bulkText
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (names.length === 0) return;

    const rows = names.map((name) => ({ id: makeId(), tournament_code: code, name }));

    const { error } = await supabase
      .from("players")
      .upsert(rows, { onConflict: "tournament_code,name", ignoreDuplicates: true });

    if (error) {
      setBulkError(error.message);
      return;
    }

    const { data, error: loadError } = await supabase
      .from("players")
      .select("*")
      .eq("tournament_code", code)
      .order("name");

    if (loadError) {
      setBulkError(loadError.message);
      return;
    }

    if (data) setPlayers(data as Player[]);
    setBulkText("");
    setShowBulk(false);
  }

  async function removePlayer(id: string) {
    await supabase.from("players").delete().eq("id", id);
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }

  function createGame() {
    if (!player1 || !player2 || !selectedBoard) return;
    if (player1 === player2) { alert("Spieler dürfen nicht identisch sein"); return; }

    const board = Number(selectedBoard);
    if (games.some((g) => g.board === board && g.status !== "finished")) {
      alert("Diese Scheibe ist bereits belegt");
      return;
    }

    const newGame: Game = { id: makeId(), player1, player2, board, status: "waiting" };
    const updated = [...games, newGame];
    setGames(updated);
    localStorage.setItem(`games_${code}`, JSON.stringify(updated));
    localStorage.setItem(`matchPlayers_${newGame.id}`, JSON.stringify({ player1, player2 }));
    setPlayer1("");
    setPlayer2("");
    setSelectedBoard("");
  }

  if (!draft) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white w-full max-w-xl rounded-2xl shadow-md p-8 text-center">
          <h1 className="text-3xl font-semibold mb-4">Turnier nicht gefunden</h1>
        </div>
      </main>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-100 px-4 py-8 overflow-hidden">
      <div
        className="absolute inset-0 bg-center bg-no-repeat opacity-25 pointer-events-none"
        style={{ backgroundImage: "url('/logo.png')", backgroundSize: "140%" }}
      />

      <main className="relative z-10 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-semibold">{draft.name}</h1>
          <p className="text-gray-600 mt-1">Best of {draft.bestOf} · Scheiben: {draft.boards} · Code: {code}</p>
        </div>

        {/* Spieler */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">
              Spieler{" "}
              <span className="text-gray-400 text-lg font-normal">({players.length})</span>
            </h2>
            <button
              onClick={() => setShowBulk((v) => !v)}
              className="text-sm bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition"
            >
              {showBulk ? "Einzeln hinzufügen" : "Liste einfügen"}
            </button>
          </div>

          <div className="space-y-2 mb-5 max-h-72 overflow-y-auto">
            {players.length === 0 && (
              <p className="text-gray-400 text-sm">Noch keine Spieler angelegt</p>
            )}
            {players.map((p) => (
              <div key={p.id} className="flex items-center justify-between border rounded-xl px-4 py-2.5">
                <span className="font-medium">{p.name}</span>
                <button
                  onClick={() => removePlayer(p.id)}
                  className="text-red-400 hover:text-red-600 text-xl leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {!showBulk ? (
            <div className="grid grid-cols-[1fr_80px] gap-3">
              <input
                value={singleName}
                onChange={(e) => setSingleName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSinglePlayer()}
                placeholder="Name"
                className="border rounded-xl px-4 py-3 outline-none"
              />
              <button
                onClick={addSinglePlayer}
                className="bg-black text-white rounded-xl text-xl"
              >
                +
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"Max Mustermann\nAnna Schmidt\nTom Bauer\n..."}
                rows={8}
                className="w-full border rounded-xl px-4 py-3 outline-none text-sm font-mono resize-none"
              />
              <p className="text-xs text-gray-400">Ein Name pro Zeile · Duplikate werden übersprungen</p>
              <button
                onClick={addBulkPlayers}
                disabled={bulkText.trim().length === 0}
                className="w-full bg-black text-white py-3 rounded-xl disabled:opacity-40 transition"
              >
                {bulkText.trim().split("\n").filter((n) => n.trim()).length} Spieler hinzufügen
              </button>
              {bulkError && (
                <p className="text-sm text-red-500 mt-1">Fehler: {bulkError}</p>
              )}
            </div>
          )}
        </div>

        {/* Neues Spiel */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Neues Spiel</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <select value={player1} onChange={(e) => setPlayer1(e.target.value)} className="border p-2 rounded">
              <option value="">Spieler 1 wählen</option>
              {players.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
            <select value={player2} onChange={(e) => setPlayer2(e.target.value)} className="border p-2 rounded">
              <option value="">Spieler 2 wählen</option>
              {players.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
            <select value={selectedBoard} onChange={(e) => setSelectedBoard(e.target.value)} className="border p-2 rounded">
              <option value="">Scheibe wählen</option>
              {Array.from({ length: Number(draft.boards) }).map((_, i) => (
                <option key={i} value={i + 1}>Scheibe {i + 1}</option>
              ))}
            </select>
          </div>
          <button onClick={createGame} className="w-full bg-black text-white py-2 rounded-xl">
            Spiel erstellen
          </button>
        </div>

        {/* Boards */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-6">Boards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: Number(draft.boards) }).map((_, i) => {
              const game = games.find((g) => g.board === i + 1);
              return (
                <div key={i} className="border rounded-2xl p-5 text-center bg-gray-50">
                  <div className="text-lg font-semibold">Scheibe {i + 1}</div>
                  {!game && <div className="text-sm text-gray-500 mt-2">Kein Spiel</div>}
                  {game && (
                    <div className="mt-3">
                      <div className="font-medium">{game.player1} vs {game.player2}</div>
                      <button
                        onClick={() => router.push(`/match/${game.id}`)}
                        className="mt-3 bg-black text-white px-3 py-1 rounded"
                      >
                        Starten
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
