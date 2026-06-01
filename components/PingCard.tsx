"use client";

import { memo } from "react";
import { Activity } from "lucide-react";

interface PingCardProps {
  ping: number | null;
  jitter: number | null;
  isActive?: boolean;
}

function PingCard({ ping, jitter, isActive }: PingCardProps) {
  const fmt = (v: number | null) => (v === null ? "--" : v.toFixed(0));

  return (
    <div
      className={`
        relative flex flex-col gap-3 rounded-2xl border p-5 transition-all duration-300
        ${isActive
          ? "border-cyan-500/40 bg-cyan-500/10 shadow-lg shadow-cyan-500/10"
          : "border-white/10 bg-white/5"
        }
      `}
    >
      {isActive && (
        <span className="absolute right-4 top-4 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
        </span>
      )}

      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-cyan-400" />
        <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
          Latency
        </span>
      </div>

      <div className="flex items-end gap-6">
        <div className="flex flex-col">
          <span className="text-4xl font-bold text-white tabular-nums">
            {fmt(ping)}
          </span>
          <span className="mt-0.5 text-xs text-white/40">ms ping</span>
        </div>
        <div className="flex flex-col pb-1">
          <span className="text-xl font-semibold text-white/70 tabular-nums">
            {fmt(jitter)}
          </span>
          <span className="mt-0.5 text-xs text-white/40">ms jitter</span>
        </div>
      </div>

      {ping !== null && (
        <div className="mt-1 h-1 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-cyan-400 transition-all duration-700"
            style={{ width: `${Math.min((ping / 300) * 100, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default memo(PingCard);
