/**
 * Calculate speed in Mbps from bytes transferred and elapsed time
 */
export function calculateMbps(bytes: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const bits = bytes * 8;
  const seconds = elapsedMs / 1000;
  return bits / seconds / 1_000_000;
}

/**
 * Calculate jitter from an array of latency samples
 */
export function calculateJitter(latencies: number[]): number {
  if (latencies.length < 2) return 0;
  let totalDiff = 0;
  for (let i = 1; i < latencies.length; i++) {
    totalDiff += Math.abs(latencies[i] - latencies[i - 1]);
  }
  return totalDiff / (latencies.length - 1);
}

/**
 * Format a speed value in Mbps to a readable string
 */
export function formatSpeed(mbps: number | null): string {
  if (mbps === null) return "--";
  if (mbps >= 1000) return (mbps / 1000).toFixed(2) + " Gbps";
  if (mbps < 1) return (mbps * 1000).toFixed(0) + " Kbps";
  return mbps.toFixed(1) + " Mbps";
}

/**
 * Format a latency value in ms to a readable string
 */
export function formatLatency(ms: number | null): string {
  if (ms === null) return "--";
  return ms.toFixed(0) + " ms";
}

/**
 * Clamp a speed to the gauge max for display
 */
export function clampToGauge(speed: number, max: number): number {
  return Math.min(speed, max);
}

/**
 * Get a rating label based on download speed
 */
export function getSpeedRating(mbps: number): {
  label: string;
  color: string;
} {
  if (mbps >= 500) return { label: "Exceptional", color: "#00ff88" };
  if (mbps >= 100) return { label: "Excellent", color: "#00d4ff" };
  if (mbps >= 50) return { label: "Great", color: "#7c3aed" };
  if (mbps >= 25) return { label: "Good", color: "#f59e0b" };
  if (mbps >= 10) return { label: "Fair", color: "#f97316" };
  return { label: "Slow", color: "#ef4444" };
}
