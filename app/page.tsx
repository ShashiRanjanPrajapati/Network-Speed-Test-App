"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useSpeedTest } from "@/hooks/useSpeedTest";
import StartButton from "@/components/StartButton";
import ThemeToggle from "@/components/ThemeToggle";
import { Zap, Wifi } from "lucide-react";
import { getSpeedRating } from "@/lib/speedCalculations";

const SpeedGauge = dynamic(() => import("@/components/SpeedGauge"), {
  ssr: false,
  loading: () => <div style={{ width: 180, height: 122 }} />,
});

const SpeedChart = dynamic(() => import("@/components/SpeedChart"), { ssr: false });
const TestHistory = dynamic(() => import("@/components/TestHistory"), { ssr: false });

// ── tiny reusable stat pill ──────────────────────────────
function Stat({
  label,
  value,
  unit,
  color,
  active,
}: {
  label: string;
  value: number | null;
  unit: string;
  color: string;
  active: boolean;
}) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 2,
      padding: "14px 24px",
      borderRadius: 14,
      background: active ? `${color}12` : "var(--surface)",
      border: `1px solid ${active ? color + "40" : "var(--border)"}`,
      boxShadow: "var(--shadow-sm)",
      minWidth: 100,
      transition: "all 0.3s ease",
    }}>
      <span style={{
        fontSize: 22,
        fontWeight: 700,
        color: value !== null ? color : "var(--subtle)",
        fontVariantNumeric: "tabular-nums",
        lineHeight: 1,
      }}>
        {value !== null ? value.toFixed(0) : "--"}
      </span>
      <span style={{ fontSize: 10, fontWeight: 500, color: "var(--subtle)" }}>{unit}</span>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginTop: 2 }}>
        {label}
      </span>
    </div>
  );
}

// ── step indicator ───────────────────────────────────────
const STEPS = ["ping", "download", "upload"] as const;
type Step = typeof STEPS[number];

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {STEPS.map((s, i) => {
        const done   = idx > i;
        const active = idx === i;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                border: `2px solid ${active ? "var(--accent)" : done ? "var(--up)" : "var(--border)"}`,
                background: active ? "var(--accent-2)" : done ? "var(--up-bg)" : "var(--surface-2)",
                color: active ? "var(--accent)" : done ? "var(--up)" : "var(--subtle)",
                transition: "all 0.3s",
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: active ? "var(--accent)" : done ? "var(--up)" : "var(--subtle)",
              }}>
                {s}
              </span>
            </div>
            {i < 2 && (
              <div style={{
                width: 40,
                height: 2,
                background: done ? "var(--up)" : "var(--border)",
                margin: "0 6px",
                marginBottom: 20,
                borderRadius: 99,
                transition: "background 0.3s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── main page ────────────────────────────────────────────
const STATUS_MSG: Record<string, string> = {
  idle:     "Click Start to measure your connection",
  ping:     "Measuring latency and jitter…",
  download: "Measuring download speed…",
  upload:   "Measuring upload speed…",
  complete: "Test complete!",
  error:    "Something went wrong — please try again.",
};

export default function Home() {
  const { state, startTest, history, removeResult, clearAll } = useSpeedTest();
  const isRunning = ["ping", "download", "upload"].includes(state.status);
  const showChart = state.downloadData.length > 0 || state.uploadData.length > 0;

  // Only render localStorage-driven UI after first client paint to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const rating =
    state.status === "complete" && state.downloadSpeed !== null
      ? getSpeedRating(state.downloadSpeed)
      : null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── Header ─────────────────────────────────────── */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 10,
        boxShadow: "var(--shadow-sm)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 30, height: 30,
            borderRadius: 8,
            background: "var(--accent-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={14} style={{ color: "var(--accent)" }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
            Net<span style={{ color: "var(--accent)" }}>Speed</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Online indicator */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, color: "var(--muted)",
          }}>
            <span style={{
              width: 7, height: 7,
              borderRadius: "50%",
              background: "#22c55e",
              animation: "pulse-dot 2s ease-in-out infinite",
              display: "block",
            }} />
            Online
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Content ────────────────────────────────────── */}
      <main style={{
        maxWidth: 780,
        margin: "0 auto",
        padding: "40px 20px 80px",
        display: "flex",
        flexDirection: "column",
        gap: 32,
      }}>

        {/* Title */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>
            Internet Speed Test
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
            {STATUS_MSG[state.status] ?? STATUS_MSG.idle}
          </p>
          {rating && (
            <div style={{
              display: "inline-flex",
              alignSelf: "center",
              marginTop: 4,
              padding: "4px 14px",
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 600,
              background: `${rating.color}18`,
              border: `1px solid ${rating.color}40`,
              color: rating.color,
            }}>
              {rating.label} Connection
            </div>
          )}
        </div>

        {/* ── Gauge row ───────────────────────────────── */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          boxShadow: "var(--shadow)",
          padding: "36px 24px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          flexWrap: "wrap",
        }}>
          {/* Download gauge */}
          <div style={{ flex: 1, minWidth: 160, display: "flex", justifyContent: "center" }}>
            <SpeedGauge
              speed={
                state.status === "download" || state.status === "complete" || state.status === "upload"
                  ? state.downloadSpeed
                  : null
              }
              label="Download"
              color="var(--down)"
            />
          </div>

          {/* Divider */}
          <div style={{
            width: 1,
            height: 100,
            background: "var(--border)",
            flexShrink: 0,
            margin: "0 32px",
          }} />

          {/* Start button (center) */}
          <div style={{ flexShrink: 0 }}>
            <StartButton status={state.status} onStart={startTest} />
          </div>

          {/* Divider */}
          <div style={{
            width: 1,
            height: 100,
            background: "var(--border)",
            flexShrink: 0,
            margin: "0 32px",
          }} />

          {/* Upload gauge */}
          <div style={{ flex: 1, minWidth: 160, display: "flex", justifyContent: "center" }}>
            <SpeedGauge
              speed={
                state.status === "upload" || state.status === "complete"
                  ? state.uploadSpeed
                  : null
              }
              label="Upload"
              color="var(--up)"
            />
          </div>
        </div>

        {/* ── Ping / Jitter stats ──────────────────────── */}
        <div style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}>
          <Stat
            label="Ping"
            value={state.ping}
            unit="ms"
            color="var(--ping-c)"
            active={state.status === "ping"}
          />
          <Stat
            label="Jitter"
            value={state.jitter}
            unit="ms"
            color="var(--ping-c)"
            active={state.status === "ping"}
          />
          <Stat
            label="Download"
            value={state.downloadSpeed !== null ? Math.round(state.downloadSpeed * 10) / 10 : null}
            unit="Mbps"
            color="var(--down)"
            active={state.status === "download"}
          />
          <Stat
            label="Upload"
            value={state.uploadSpeed !== null ? Math.round(state.uploadSpeed * 10) / 10 : null}
            unit="Mbps"
            color="var(--up)"
            active={state.status === "upload"}
          />
        </div>

        {/* ── Step indicator (while testing) ───────────── */}
        {isRunning && (
          <div style={{ display: "flex", justifyContent: "center" }} className="animate-fade-up">
            <StepIndicator current={state.status as Step} />
          </div>
        )}

        {/* ── Progress bar (while testing) ─────────────── */}
        {(state.status === "download" || state.status === "upload") && (
          <div style={{
            height: 3,
            background: "var(--border)",
            borderRadius: 99,
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${state.status === "download" ? state.downloadProgress : state.uploadProgress}%`,
              background: state.status === "download" ? "var(--down)" : "var(--up)",
              borderRadius: 99,
              transition: "width 0.3s ease",
            }} />
          </div>
        )}

        {/* ── Speed chart ──────────────────────────────── */}
        {showChart && (
          <div className="animate-fade-up">
            <SpeedChart
              downloadData={state.downloadData}
              uploadData={state.uploadData}
            />
          </div>
        )}

        {/* ── History ──────────────────────────────────── */}
        {mounted && history.length > 0 && (
          <TestHistory
            history={history}
            onDelete={removeResult}
            onClearAll={clearAll}
          />
        )}

        {/* ── Footer ───────────────────────────────────── */}
        <footer style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          marginTop: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--subtle)", fontSize: 11 }}>
            <Wifi size={11} />
            Measured via actual data transfers through local API routes
          </div>
          <p style={{ margin: 0, fontSize: 11, color: "var(--subtle)" }}>
            Results may vary based on network conditions
          </p>
        </footer>

      </main>
    </div>
  );
}
