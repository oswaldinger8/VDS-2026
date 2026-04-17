"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-100 overflow-hidden">

      {/* 🔥 Hintergrundlogo */}
      <div
       className="absolute inset-0 bg-center bg-no-repeat opacity-30 pointer-events-none"
style={{ backgroundImage: "url('/logo.png')", backgroundSize: "120%" }}
      />

      {/* Inhalt */}
      <div className="relative z-10 bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
        <h1 className="text-3xl font-semibold mb-6">Darts Turnier</h1>

        <button
          onClick={() => router.push("/create")}
          className="w-full bg-black text-white py-3 rounded-xl mb-3 hover:bg-gray-800 transition"
        >
          Neues Turnier erstellen
        </button>

        <button
          onClick={() => router.push("/tv")}
          className="w-full bg-gray-200 py-3 rounded-xl hover:bg-gray-300 transition"
        >
          Turnier beitreten
        </button>
      </div>
    </div>
  );
}