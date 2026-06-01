"use client";

import { memo } from "react";
import { Download } from "lucide-react";
import { formatSpeed } from "@/lib/speedCalculations";

interface DownloadCardProps {
  speed: number | null;
  progress: number;
  isActive?: boolean;
}

function DownloadCard({ speed, progress, isActive }: DownloadCardProps) {
  return (
    <div
      className={`
        relative flex flex-col gap-3 rounded-2xl border p-5 transition-all duration-300
        ${isActive
          ? "border-violet-500/40 bg-violet-500/10 shadow-lg shadow-violet-500/10"
          : "border-white/10 bg-white/5"
        }
      `}
    >
      {isActive && (
        <span className="absolute right-4 top-4 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
        </span>
      )}

      <div className="flex items-center gap-2">
        <Download className="h-4 w-4 text-violet-400" />
        <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
          Download
        </span>
      </div>

      <div className="flex flex-col">
        <span className="text-4xl font-bold text-white tabular-nums">
          {speed === null ? "--" : speed >= 1000 ? (speed / 1000).toFixed(2) : speed < 1 ? (speed * 1000).toFixed(0) : speed.toFixed(1)}
        </span>
        <span className="mt-0.5 text-xs text-white/40">
          {speed === null ? "Mbps" : speed >= 1000 ? "Gbps" : speed < 1 ? "Kbps" : "Mbps"}
        </span>
      </div>

      {isActive && (
        <div className="mt-1 h-1 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-violet-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default memo(DownloadCard);
