"use client";

import { memo } from "react";
import { Trash2, Trash } from "lucide-react";
import type { SpeedTestResult } from "@/types/speed-test";

interface TestHistoryProps {
  history: SpeedTestResult[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

function fmt(ts: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(ts));
}

function fmtMbps(v: number) {
  if (v >= 1000) return `${(v / 1000).toFixed(2)} Gbps`;
  if (v < 1)    return `${(v * 1000).toFixed(0)} Kbps`;
  return `${v.toFixed(1)} Mbps`;
}

const TH: React.CSSProperties = {
  padding: "0 12px 10px 0",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--subtle)",
  textAlign: "left",
  borderBottom: "1px solid var(--border)",
};

const TD: React.CSSProperties = {
  padding: "11px 12px 11px 0",
  fontSize: 13,
  borderBottom: "1px solid var(--border)",
  color: "var(--text)",
};

function TestHistory({ history, onDelete, onClearAll }: TestHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      padding: "20px",
      boxShadow: "var(--shadow)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <p style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--muted)",
        }}>
          History
        </p>
        <button
          id="clear-history-btn"
          onClick={onClearAll}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 10px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--muted)",
            fontSize: 11,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#ef444430";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
          }}
        >
          <Trash size={11} />
          Clear all
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={TH}>Date</th>
              <th style={{ ...TH, color: "var(--down)" }}>↓ Download</th>
              <th style={{ ...TH, color: "var(--up)" }}>↑ Upload</th>
              <th style={{ ...TH, color: "var(--ping-c)" }}>Ping</th>
              <th style={TH}>Jitter</th>
              <th style={{ ...TH, width: 36 }} />
            </tr>
          </thead>
          <tbody>
            {history.map((r, i) => (
              <tr key={r.id}>
                <td style={{ ...TD, color: "var(--muted)", whiteSpace: "nowrap", borderBottom: i === history.length - 1 ? "none" : undefined }}>
                  {fmt(r.timestamp)}
                </td>
                <td style={{ ...TD, fontWeight: 600, borderBottom: i === history.length - 1 ? "none" : undefined }}>
                  {fmtMbps(r.download)}
                </td>
                <td style={{ ...TD, fontWeight: 600, borderBottom: i === history.length - 1 ? "none" : undefined }}>
                  {fmtMbps(r.upload)}
                </td>
                <td style={{ ...TD, color: "var(--muted)", borderBottom: i === history.length - 1 ? "none" : undefined }}>
                  {r.ping.toFixed(0)} ms
                </td>
                <td style={{ ...TD, color: "var(--subtle)", borderBottom: i === history.length - 1 ? "none" : undefined }}>
                  {r.jitter.toFixed(0)} ms
                </td>
                <td style={{ ...TD, borderBottom: i === history.length - 1 ? "none" : undefined }}>
                  <button
                    id={`delete-result-${r.id}`}
                    onClick={() => onDelete(r.id)}
                    aria-label="Delete"
                    style={{
                      padding: 5,
                      borderRadius: 6,
                      border: "none",
                      background: "transparent",
                      color: "var(--subtle)",
                      cursor: "pointer",
                      display: "flex",
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--subtle)")}
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default memo(TestHistory);
