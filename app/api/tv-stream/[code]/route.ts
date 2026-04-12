import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Beim Verbinden sofort aktuellen Stand senden
      supabase
        .from("match_states")
        .select("*")
        .eq("tv_code", code)
        .maybeSingle()
        .then(({ data }) => {
          if (data) send(data);
        });

      // Supabase Realtime auf dem Server abonnieren
      const channel = supabase
        .channel(`sse-${code}-${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "match_states",
            filter: `tv_code=eq.${code}`,
          },
          (payload) => {
            if (payload.new) send(payload.new);
          }
        )
        .subscribe();

      // Keep-alive alle 20 Sekunden
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(": ping\n\n"));
      }, 20000);

      // Cleanup wenn TV-Browser trennt
      _req.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        supabase.removeChannel(channel);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
