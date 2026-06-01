"use client";

import { memo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { SpeedDataPoint } from "@/types/speed-test";

interface SpeedChartProps {
  downloadData: SpeedDataPoint[];
  uploadData: SpeedDataPoint[];
}

function SpeedChart({ downloadData, uploadData }: SpeedChartProps) {
  const allTimes = Array.from(
    new Set([
      ...downloadData.map((d) => d.time),
      ...uploadData.map((d) => d.time),
    ])
  ).sort((a, b) => a - b);

  const merged = allTimes.map((t) => ({
    time: t,
    download: downloadData.find((d) => d.time === t)?.speed ?? null,
    upload:   uploadData.find((d) => d.time === t)?.speed ?? null,
  }));

  if (merged.length === 0) return null;

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      padding: "20px 20px 16px",
      boxShadow: "var(--shadow)",
    }}>
      <p style={{
        margin: "0 0 16px",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--muted)",
      }}>
        Speed Over Time
      </p>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={merged} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="dlGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="var(--down)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--down)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ulGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="var(--up)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--up)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tick={{ fill: "var(--subtle)", fontSize: 10 }}
            tickFormatter={(v) => `${v}s`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--subtle)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              color: "var(--text)",
              fontSize: 12,
              boxShadow: "var(--shadow-md)",
            }}
            labelStyle={{ color: "var(--muted)", marginBottom: 4 }}
            formatter={(value, name) => [
              typeof value === "number" ? `${value.toFixed(1)} Mbps` : "--",
              name === "download" ? "Download" : "Upload",
            ]}
            labelFormatter={(label) => `${label}s`}
          />
          <Area
            type="monotone"
            dataKey="download"
            stroke="var(--down)"
            strokeWidth={2}
            fill="url(#dlGrad)"
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="upload"
            stroke="var(--up)"
            strokeWidth={2}
            fill="url(#ulGrad)"
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
        {[
          { label: "Download", color: "var(--down)" },
          { label: "Upload",   color: "var(--up)" },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 20, height: 3, borderRadius: 99, background: color, display: "block" }} />
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(SpeedChart);
