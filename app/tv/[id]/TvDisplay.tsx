"use client";

import { useEffect, useState } from "react";
import { MatchState, supabase } from "@/lib/supabase";

export default function TvDisplay({ code }: { code: string }) {
  const [state, setState] = useState<MatchState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function loadInitial() {
      setLoading(true);

      const { data, error } = await supabase
        .from("match_states")
        .select("*")
        .eq("tv_code", code)
        .maybeSingle();

      if (error) {
        console.error("TV initial load error:", error);
      }

      if (data) {
        setState(data as MatchState);
      }

      setLoading(false);

      channel = supabase
  .channel(`tv-${code}`)
  .on(
    "postgres_changes" as any,
    {
      event: "*",
      schema: "public",
      table: "match_states",
      filter: `tv_code=eq.${code}`,
    } as any,
    (payload: any) => {
      if (payload.new) {
        setState(payload.new as MatchState);
      }
    }
  )
  .subscribe();
    }

    loadInitial();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [code]);

  const p1Active = state?.current_player === "player1";
  const p2Active = state?.current_player === "player2";

  if (loading && !state) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#111",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, Helvetica, sans-serif",
          textAlign: "center",
        }}
      >
        <div>
          <div style={{ fontSize: "4rem", fontWeight: 700, marginBottom: "1rem" }}>
            TV Code: {code}
          </div>
          <div style={{ fontSize: "2rem", color: "#cfcfcf" }}>
            Lade Spielstand…
          </div>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#111",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, Helvetica, sans-serif",
          textAlign: "center",
        }}
      >
        <div>
          <div style={{ fontSize: "4rem", fontWeight: 700, marginBottom: "1rem" }}>
            TV Code: {code}
          </div>
          <div style={{ fontSize: "2rem", color: "#cfcfcf" }}>
            Warte auf Spielstart…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        background: "#111",
        color: "#f5f5f5",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/logo.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center 45%",
          backgroundSize: "90%",
          opacity: 0.32,
          filter: "brightness(1.5) contrast(1.15)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(10,10,10,0.38)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "8%",
          bottom: "12%",
          left: "50%",
          width: "2px",
          background: "rgba(255,255,255,0.12)",
          transform: "translateX(-1px)",
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: "100vh",
          display: "grid",
          gridTemplateRows: "90px 1fr 90px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 28px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ fontSize: "2.2rem", fontWeight: 700 }}>Darts</div>
          <div style={{ fontSize: "1.25rem", color: "#ddd" }}>
            TV Code: <strong style={{ color: "#fff" }}>{code}</strong>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "4.2rem",
                fontWeight: 700,
                marginBottom: "26px",
                color: p1Active ? "#4ade80" : "#f5f5f5",
              }}
            >
              {state.player1_name}
            </div>

            <div
              style={{
                fontSize: "13rem",
                fontWeight: 800,
                lineHeight: 0.9,
                letterSpacing: "-0.05em",
                color: "#fff",
                textShadow: p1Active
                  ? "0 0 28px rgba(74,222,128,0.35)"
                  : "0 0 18px rgba(255,255,255,0.18)",
              }}
            >
              {state.player1_score}
            </div>

            <div style={{ marginTop: "20px", fontSize: "2rem" }}>
              Legs: {state.player1_legs ?? 0}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "4.2rem",
                fontWeight: 700,
                marginBottom: "26px",
                color: p2Active ? "#4ade80" : "#f5f5f5",
              }}
            >
              {state.player2_name}
            </div>

            <div
              style={{
                fontSize: "13rem",
                fontWeight: 800,
                lineHeight: 0.9,
                letterSpacing: "-0.05em",
                color: "#fff",
                textShadow: p2Active
                  ? "0 0 28px rgba(74,222,128,0.35)"
                  : "0 0 18px rgba(255,255,255,0.18)",
              }}
            >
              {state.player2_score}
            </div>

            <div style={{ marginTop: "20px", fontSize: "2rem" }}>
              Legs: {state.player2_legs ?? 0}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 24px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            fontSize: "2rem",
            color: "#cfcfcf",
            background: "rgba(0,0,0,0.28)",
          }}
        >
          Aktiver Spieler:&nbsp;
          <strong style={{ color: "#fff" }}>
            {p1Active ? state.player1_name : state.player2_name}
          </strong>
          &nbsp;·&nbsp;Wurf {state.throws_in_round + 1} / 3
        </div>
      </div>
    </div>
  );
}