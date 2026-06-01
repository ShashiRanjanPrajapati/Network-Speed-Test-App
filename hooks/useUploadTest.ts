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

    // Worker function: continuously POST payload as fast as possible
    const worker = async () => {
      while (isActive && performance.now() < endTime) {
        try {
          const payload = makePayload(UPLOAD_CHUNK_SIZE);
          const res = await fetch("/api/upload", {
            method: "POST",
            body: payload,
            signal: abortRef.current?.signal,
            headers: {
              "Content-Type": "application/octet-stream",
            },
          });

          if (!res.ok) break;
          
          if (isActive) {
            totalBytes += UPLOAD_CHUNK_SIZE;
          }
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
      setUploadSpeed(speed);
      
      const newPoint = { time: Math.round(elapsed / 1000), speed };
      points.push(newPoint);
      setDataPoints([...points]);
      
      setProgress(Math.min((elapsed / UPLOAD_DURATION_MS) * 100, 100));
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
    const totalElapsed = Math.min(performance.now() - startTime, UPLOAD_DURATION_MS);
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
