"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Draft = {
  name: string;
  pin: string;
  bestOf: string;
  boards: string;
  tournamentCode: string;
  tvCode: string;
};

export default function CreatedPage() {
  const router = useRouter();
  const [data, setData] = useState<Draft | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("newTournamentDraft");
    if (!raw) return;

    try {
      setData(JSON.parse(raw));
    } catch {
      setData(null);
    }
  }, []);

  function copyTvCode() {
    if (!data) return;
    navigator.clipboard.writeText(data.tvCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white w-full max-w-xl rounded-2xl shadow-md p-8 text-center">
          <h1 className="text-3xl font-semibold mb-4">Keine Turnierdaten gefunden</h1>
          <button
            onClick={() => router.push("/create")}
            className="bg-black text-white py-3 px-6 rounded-xl"
          >
            Zurück
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-md p-8 text-center">
        <h1 className="text-4xl font-semibold mb-6">Turnier erstellt!</h1>

        <div className="space-y-3 mb-8">
          <div className="text-2xl font-semibold">{data.name}</div>
          <div className="text-gray-600">PIN: {data.pin}</div>
          <div className="text-gray-600">Best of: {data.bestOf}</div>
          <div className="text-gray-600">Scheiben: {data.boards}</div>
          <div className="text-gray-600">Turniercode: {data.tournamentCode}</div>
          <div className="text-gray-600">TV-Code: {data.tvCode}</div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push(`/admin/${data.tournamentCode}`)}
            className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition"
          >
            Zum Admin-Panel
          </button>

          <button
            onClick={copyTvCode}
            className="w-full bg-gray-100 py-3 rounded-xl hover:bg-gray-200 transition"
          >
            {copied ? "TV-Code kopiert" : "TV-Code kopieren"}
          </button>
        </div>
      </div>
    </main>
  );
}