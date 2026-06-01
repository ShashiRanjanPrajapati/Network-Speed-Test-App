"use client";

import { useState, useCallback, useRef } from "react";
import { calculateMbps } from "@/lib/speedCalculations";
import {
  DOWNLOAD_DURATION_MS,
  SPEED_UPDATE_INTERVAL_MS,
} from "@/lib/constants";
import { SpeedDataPoint } from "@/types/speed-test";

export function useDownloadTest() {
  const [downloadSpeed, setDownloadSpeed] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [dataPoints, setDataPoints] = useState<SpeedDataPoint[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const startDownloadTest = useCallback(async (
    externalController?: AbortController
  ): Promise<number> => {
    setDownloadSpeed(null);
    setProgress(0);
    setDataPoints([]);

    const startTime = performance.now();
    const endTime = startTime + DOWNLOAD_DURATION_MS;
    let totalBytes = 0;
    const points: SpeedDataPoint[] = [];

    abortRef.current = new AbortController();

    // Forward external abort → internal controller
    if (externalController) {
      externalController.signal.addEventListener(
        "abort",
        () => abortRef.current?.abort(),
        { once: true }
      );
    }

    let lastUpdateTime = startTime;

    while (performance.now() < endTime) {
      try {
        const fetchStart = performance.now();
        const res = await fetch(
          `/api/download?t=${Date.now()}&r=${Math.random()}`,
          {
            signal: abortRef.current.signal,
            cache: "no-store",
          }
        );

        if (!res.ok || !res.body) break;

        const reader = res.body.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            totalBytes += value.byteLength;
            const now = performance.now();
            const elapsed = now - startTime;

            // Update speed at intervals
            if (now - lastUpdateTime >= SPEED_UPDATE_INTERVAL_MS) {
              const speed = calculateMbps(totalBytes, elapsed);
              setDownloadSpeed(speed);
              const newPoint = { time: Math.round(elapsed / 1000), speed };
              points.push(newPoint);
              setDataPoints([...points]);
              setProgress(Math.min((elapsed / DOWNLOAD_DURATION_MS) * 100, 100));
              lastUpdateTime = now;
            }

            if (performance.now() >= endTime) {
              await reader.cancel();
              break;
            }
          }
        }

        // Avoid hammering the API too fast
        const fetchElapsed = performance.now() - fetchStart;
        if (fetchElapsed < 100) {
          await new Promise((r) => setTimeout(r, 100 - fetchElapsed));
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") break;
        // On network error wait briefly then retry
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    const totalElapsed = performance.now() - startTime;
    const finalSpeed = calculateMbps(totalBytes, totalElapsed);
    setDownloadSpeed(finalSpeed);
    setProgress(100);

    return finalSpeed;
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { downloadSpeed, progress, dataPoints, startDownloadTest, abort };
}
