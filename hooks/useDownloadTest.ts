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

    const concurrentStreams = 6;
    let isActive = true;

    // Worker function: continuously fetch and read chunks as fast as possible
    const worker = async () => {
      while (isActive && performance.now() < endTime) {
        try {
          const res = await fetch(
            `/api/download?t=${Date.now()}&r=${Math.random()}`,
            {
              signal: abortRef.current?.signal,
              cache: "no-store",
            }
          );

          if (!res.ok || !res.body) break;

          const reader = res.body.getReader();

          while (isActive && performance.now() < endTime) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              totalBytes += value.byteLength;
            }
          }
          await reader.cancel().catch(() => {});
        } catch (err: unknown) {
          if ((err as Error)?.name === "AbortError") break;
          // Brief pause on genuine network failure before retry
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    };

    // Dedicated interval to calculate and push speed updates cleanly
    const progressInterval = setInterval(() => {
      if (!isActive) return;
      const now = performance.now();
      const elapsed = now - startTime;
      
      const speed = calculateMbps(totalBytes, elapsed);
      setDownloadSpeed(speed);
      
      const newPoint = { time: Math.round(elapsed / 1000), speed };
      points.push(newPoint);
      setDataPoints([...points]);
      
      setProgress(Math.min((elapsed / DOWNLOAD_DURATION_MS) * 100, 100));
    }, SPEED_UPDATE_INTERVAL_MS);

    // Start all workers concurrently
    const workers = Array.from({ length: concurrentStreams }).map(() => worker());
    
    // Wait for the duration to elapse or for early abort
    await new Promise<void>((resolve) => {
      const remaining = endTime - performance.now();
      if (remaining > 0) {
        setTimeout(resolve, remaining);
      } else {
        resolve();
      }
      abortRef.current?.signal.addEventListener("abort", () => resolve(), { once: true });
    });

    isActive = false;
    clearInterval(progressInterval);
    abortRef.current?.abort(); // ensure all workers stop

    // Calculate final true speed
    const totalElapsed = Math.min(performance.now() - startTime, DOWNLOAD_DURATION_MS);
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
