"use client";

import { memo, useEffect, useRef } from "react";

interface SpeedGaugeProps {
  speed: number | null;
  label: string;
  /** CSS colour value — should use a CSS var from the theme */
  color: string;
  max?: number;
}

const ARC_DEG = 240; // degrees of arc
const START_DEG = 150; // rotation offset so arc starts bottom-left

function SpeedGauge({ speed, label, color, max = 1000 }: SpeedGaugeProps) {
  const SIZE = 180;
  const SW = 8; // stroke width
  const R = (SIZE - SW) / 2;
  const C = 2 * Math.PI * R; // full circumference

  const arcLen = C * (ARC_DEG / 360);
  const gapLen = C - arcLen;

  const arcRef = useRef<SVGCircleElement>(null);
  const rafRef = useRef<number>(0);
  const currentRef = useRef(0);

  const target = speed === null ? 0 : Math.min(speed, max);
  const targetDash = arcLen * (target / max);

  useEffect(() => {
    const start = currentRef.current;
    const end = targetDash;
    const dur = 500;
    const t0 = performance.now();

    function frame(now: number) {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - (1 - p) ** 3;
      const val = start + (end - start) * ease;
      currentRef.current = val;
      if (arcRef.current) {
        arcRef.current.style.strokeDasharray =
          `${val} ${arcLen - val} ${gapLen}`;
      }
      if (p < 1) rafRef.current = requestAnimationFrame(frame);
    }

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [targetDash, arcLen, gapLen]);

  // Format display
  let display = "--";
  let unit = "Mbps";
  if (speed !== null) {
    if (speed >= 1000) { display = (speed / 1000).toFixed(2); unit = "Gbps"; }
    else if (speed < 1)  { display = (speed * 1000).toFixed(0); unit = "Kbps"; }
    else                  { display = speed.toFixed(1); unit = "Mbps"; }
  }

  const cx = SIZE / 2;
  const cy = SIZE / 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      {/* clip the bottom of the SVG so the gap in the arc isn't visible */}
      <div style={{ width: SIZE, height: SIZE * 0.68, overflow: "hidden", position: "relative" }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {/* track */}
          <circle
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke="var(--border)"
            strokeWidth={SW}
            strokeDasharray={`${arcLen} ${gapLen}`}
            strokeLinecap="round"
            transform={`rotate(${START_DEG} ${cx} ${cy})`}
          />
          {/* progress */}
          <circle
            ref={arcRef}
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke={color}
            strokeWidth={SW}
            strokeDasharray={`0 ${arcLen} ${gapLen}`}
            strokeLinecap="round"
            transform={`rotate(${START_DEG} ${cx} ${cy})`}
            style={{ transition: "stroke 0.3s" }}
          />
          {/* value */}
          <text
            x={cx} y={cy + 6}
            textAnchor="middle"
            fontSize={26}
            fontWeight={700}
            fill="var(--text)"
            fontFamily="inherit"
          >
            {display}
          </text>
          <text
            x={cx} y={cy + 22}
            textAnchor="middle"
            fontSize={10}
            fill="var(--subtle)"
            fontFamily="inherit"
          >
            {unit}
          </text>
        </svg>
      </div>
      <span style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--muted)",
      }}>
        {label}
      </span>
    </div>
  );
}

export default memo(SpeedGauge);
