"use client";

import { useState, useCallback, useRef } from "react";
import { calculateMbps } from "@/lib/speedCalculations";
import {
  UPLOAD_DURATION_MS,
  UPLOAD_CHUNK_SIZE,
  SPEED_UPDATE_INTERVAL_MS,
} from "@/lib/constants";
import { SpeedDataPoint } from "@/types/speed-test";

// Chunk generator for upload payload
function makePayload(size: number): Blob {
  const buf = new Uint8Array(size);
  crypto.getRandomValues(buf.subarray(0, Math.min(size, 1024)));
  // Fill the rest with a pattern to avoid compression
  for (let i = 1024; i < size; i++) {
    buf[i] = buf[i % 1024];
  }
  return new Blob([buf], { type: "application/octet-stream" });
}

export function useUploadTest() {
  const [uploadSpeed, setUploadSpeed] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [dataPoints, setDataPoints] = useState<SpeedDataPoint[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const startUploadTest = useCallback(async (
    externalController?: AbortController
  ): Promise<number> => {
    setUploadSpeed(null);
    setProgress(0);
    setDataPoints([]);

    const startTime = performance.now();
    const endTime = startTime + UPLOAD_DURATION_MS;
    let totalBytes = 0;
    const points: SpeedDataPoint[] = [];
    let lastUpdateTime = startTime;

    abortRef.current = new AbortController();

    // Forward external abort → internal controller
    if (externalController) {
      externalController.signal.addEventListener(
        "abort",
        () => abortRef.current?.abort(),
        { once: true }
      );
    }

    while (performance.now() < endTime) {
      try {
        const payload = makePayload(UPLOAD_CHUNK_SIZE);
        const uploadStart = performance.now();

        const res = await fetch("/api/upload", {
          method: "POST",
          body: payload,
          signal: abortRef.current.signal,
          headers: {
            "Content-Type": "application/octet-stream",
          },
        });

        if (!res.ok) break;

        const uploadElapsed = performance.now() - uploadStart;
        totalBytes += UPLOAD_CHUNK_SIZE;

        const now = performance.now();
        const elapsed = now - startTime;

        if (now - lastUpdateTime >= SPEED_UPDATE_INTERVAL_MS) {
          const speed = calculateMbps(totalBytes, elapsed);
          setUploadSpeed(speed);
          const newPoint = { time: Math.round(elapsed / 1000), speed };
          points.push(newPoint);
          setDataPoints([...points]);
          setProgress(Math.min((elapsed / UPLOAD_DURATION_MS) * 100, 100));
          lastUpdateTime = now;
        }

        if (performance.now() >= endTime) break;

        // Throttle if upload was very fast (< 50ms for 512KB)
        if (uploadElapsed < 50) {
          await new Promise((r) => setTimeout(r, 50 - uploadElapsed));
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") break;
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    const totalElapsed = performance.now() - startTime;
    const finalSpeed = calculateMbps(totalBytes, totalElapsed);
    setUploadSpeed(finalSpeed);
    setProgress(100);

    return finalSpeed;
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { uploadSpeed, progress, dataPoints, startUploadTest, abort };
}
