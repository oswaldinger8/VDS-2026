"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function makeCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export default function CreatePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [bestOf, setBestOf] = useState("3");
  const [boards, setBoards] = useState("3");

  function handleCreate() {
    const tournamentCode = makeCode(6);
    const tvCode = makeCode(5);

    const data = {
      name,
      pin,
      bestOf,
      boards,
      tournamentCode,
      tvCode,
    };

    localStorage.setItem("newTournamentDraft", JSON.stringify(data));
    router.push("/created");
  }

  const isValid =
    name.trim().length > 0 &&
    /^\d{4}$/.test(pin) &&
    ["1", "3", "5", "7"].includes(bestOf) &&
    ["1", "2", "3"].includes(boards);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-md p-8">
        <h1 className="text-4xl font-semibold text-center mb-8">Darts Turnier</h1>

        <div className="space-y-6">
          <div>
            <label className="block mb-2 text-sm">Turniername</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 outline-none"
              placeholder="z. B. Vereinscup"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm">Admin-PIN (4 Ziffern)</label>
            <input
              value={pin}
              onChange={(e) => {
                const onlyNumbers = e.target.value.replace(/\D/g, "").slice(0, 4);
                setPin(onlyNumbers);
              }}
              className="w-full border rounded-xl px-4 py-3 outline-none text-center tracking-[0.3em]"
              placeholder="0000"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm">Best of</label>
            <select
              value={bestOf}
              onChange={(e) => setBestOf(e.target.value)}
              className="border rounded-xl px-4 py-3 outline-none"
            >
              <option value="1">1</option>
              <option value="3">3</option>
              <option value="5">5</option>
              <option value="7">7</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm">Anzahl Scheiben</label>
            <select
              value={boards}
              onChange={(e) => setBoards(e.target.value)}
              className="border rounded-xl px-4 py-3 outline-none"
            >
              <option value="1">1 Scheibe</option>
              <option value="2">2 Scheiben</option>
              <option value="3">3 Scheiben</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => router.push("/")}
              className="w-full bg-gray-100 py-3 rounded-xl hover:bg-gray-200 transition"
            >
              Zurück
            </button>

            <button
              onClick={handleCreate}
              disabled={!isValid}
              className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Erstellen
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}