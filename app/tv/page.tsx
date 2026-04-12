export default function TvCodePage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="text-center w-full max-w-sm">
        <h1 className="text-5xl font-bold mb-2">Darts</h1>
        <p className="text-gray-400 text-xl mb-12">TV Anzeige</p>

        <form action="/tv-go" method="get" className="space-y-6">
          <input
            type="text"
            name="code"
            inputMode="numeric"
            maxLength={4}
            placeholder="Code eingeben"
            className="w-full text-center text-4xl font-bold tracking-widest bg-white/10 border-2 border-white/20 rounded-2xl px-6 py-5 text-white placeholder-white/30 focus:outline-none focus:border-white/60"
            autoFocus
          />

          <button
            type="submit"
            className="block w-full bg-white text-black text-2xl font-bold py-4 rounded-2xl text-center"
          >
            Anzeigen
          </button>
        </form>

        <p className="mt-10 text-gray-500 text-sm">
          Den 4-stelligen Code findest du auf dem Eingabe-Gerät
        </p>
      </div>
    </main>
  );
}
