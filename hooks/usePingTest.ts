"use client";

import { useState, useCallback } from "react";
import { calculateJitter } from "@/lib/speedCalculations";
import { PING_COUNT } from "@/lib/constants";

export function usePingTest() {
  const [ping, setPing] = useState<number | null>(null);
  const [jitter, setJitter] = useState<number | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const startPingTest = useCallback(async (): Promise<{
    ping: number;
    jitter: number;
  }> => {
    setIsTesting(true);
    setPing(null);
    setJitter(null);

    const latencies: number[] = [];

    for (let i = 0; i < PING_COUNT; i++) {
      const start = performance.now();
      try {
        await fetch("/api/ping", { cache: "no-store" });
      } catch {
        // ignore individual failures
      }
      const elapsed = performance.now() - start;
      latencies.push(elapsed);
    }

    const avgPing =
      latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const jitterVal = calculateJitter(latencies);

    setPing(avgPing);
    setJitter(jitterVal);
    setIsTesting(false);

    return { ping: avgPing, jitter: jitterVal };
  }, []);

  return { ping, jitter, isTesting, startPingTest };
}
