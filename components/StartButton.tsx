"use client";

import { memo } from "react";
import { Play, RotateCcw, Loader2 } from "lucide-react";
import type { TestStatus } from "@/types/speed-test";

interface StartButtonProps {
  status: TestStatus;
  onStart: () => void;
}

const labels: Record<TestStatus, string> = {
  idle:     "Start",
  ping:     "Testing…",
  download: "Testing…",
  upload:   "Testing…",
  complete: "Retest",
  error:    "Retry",
};

function StartButton({ status, onStart }: StartButtonProps) {
  const busy = status === "ping" || status === "download" || status === "upload";
  const done = status === "complete" || status === "error";

  const accentColor = done ? "var(--up)" : "var(--accent)";

  return (
    <button
      id="start-speed-test-btn"
      onClick={onStart}
      disabled={busy}
      aria-label={labels[status]}
      style={{
        position: "relative",
        width: 132,
        height: 132,
        borderRadius: "50%",
        border: `2px solid ${accentColor}`,
        background: "var(--surface)",
        boxShadow: busy
          ? `0 0 0 6px ${accentColor}22, var(--shadow-md)`
          : `0 0 0 0px ${accentColor}00, var(--shadow-md)`,
        cursor: busy ? "not-allowed" : "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        transition: "all 0.3s ease",
        outline: "none",
        flexShrink: 0,
      }}
    >
      {/* Outer pulse ring (idle only) */}
      {!busy && !done && (
        <span style={{
          position: "absolute",
          inset: -8,
          borderRadius: "50%",
          border: `1.5px solid var(--accent)`,
          opacity: 0.25,
          animation: "pulse-ring 2s ease-in-out infinite",
        }} />
      )}

      {busy ? (
        <Loader2
          size={28}
          style={{ color: accentColor, animation: "spin 1s linear infinite" }}
        />
      ) : done ? (
        <RotateCcw size={28} style={{ color: accentColor }} />
      ) : (
        <Play size={28} style={{ color: accentColor, marginLeft: 4 }} />
      )}

      <span style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: accentColor,
      }}>
        {labels[status]}
      </span>

    </button>
  );
}

export default memo(StartButton);
