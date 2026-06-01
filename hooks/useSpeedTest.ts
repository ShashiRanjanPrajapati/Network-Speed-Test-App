"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { usePingTest } from "./usePingTest";
import { useDownloadTest } from "./useDownloadTest";
import { useUploadTest } from "./useUploadTest";
import { saveResult, loadHistory, deleteResult, clearHistory } from "@/lib/storage";
import { useNetworkStatus } from "./useNetworkStatus";
import type { SpeedTestResult, TestState, ErrorCode } from "@/types/speed-test";

const initialState: TestState = {
  status:           "idle",
  ping:             null,
  jitter:           null,
  downloadSpeed:    null,
  uploadSpeed:      null,
  downloadProgress: 0,
  uploadProgress:   0,
  downloadData:     [],
  uploadData:       [],
  error:            null,
  errorCode:        null,
};

export function useSpeedTest() {
  const [state, setState]     = useState<TestState>(initialState);
  const [history, setHistory] = useState<SpeedTestResult[]>(() => loadHistory());

  const pingTest     = usePingTest();
  const downloadTest = useDownloadTest();
  const uploadTest   = useUploadTest();
  const { isOnline } = useNetworkStatus();

  /** Master AbortController — aborting this cascades to download + upload */
  const masterRef      = useRef<AbortController>(new AbortController());
  /** Reason stored before calling .abort() so the catch block can read it */
  const abortReasonRef = useRef<ErrorCode | null>(null);

  // ── Live data from sub-hooks (merged into returned state) ──────────────────
  const liveDownloadSpeed    = downloadTest.downloadSpeed;
  const liveUploadSpeed      = uploadTest.uploadSpeed;
  const liveDownloadProgress = downloadTest.progress;
  const liveUploadProgress   = uploadTest.progress;
  const liveDownloadData     = downloadTest.dataPoints;
  const liveUploadData       = uploadTest.dataPoints;

  // ── startTest ──────────────────────────────────────────────────────────────
  const startTest = useCallback(async () => {
    if (!isOnline) {
      setState((s) => ({
        ...s,
        status: "error",
        error: "No network connection. Please check your internet connection.",
        errorCode: "no-connection",
      }));
      return;
    }

    // Fresh master controller for this run
    masterRef.current      = new AbortController();
    abortReasonRef.current = null;

    setState({ ...initialState, status: "ping" });

    try {
      // Step 1 — Ping (fast, no long-running stream to cancel)
      const { ping, jitter } = await pingTest.startPingTest();

      if (masterRef.current.signal.aborted) throw new DOMException("aborted", "AbortError");

      setState((s) => ({ ...s, status: "download", ping, jitter }));

      // Step 2 — Download (pass master so it can be cancelled externally)
      const downloadSpeed = await downloadTest.startDownloadTest(masterRef.current);

      if (masterRef.current.signal.aborted) throw new DOMException("aborted", "AbortError");

      setState((s) => ({
        ...s,
        status: "upload",
        downloadSpeed,
        downloadProgress: 100,
      }));

      // Step 3 — Upload
      const uploadSpeed = await uploadTest.startUploadTest(masterRef.current);

      if (masterRef.current.signal.aborted) throw new DOMException("aborted", "AbortError");

      // ── Persist result ─────────────────────────────────────────────────────
      const result: SpeedTestResult = {
        id:        crypto.randomUUID(),
        timestamp: Date.now(),
        download:  downloadSpeed,
        upload:    uploadSpeed,
        ping,
        jitter,
        duration:  DOWNLOAD_DURATION_MS + UPLOAD_DURATION_MS + PING_ESTIMATE_MS,
      };

      const updated = saveResult(result);
      setHistory(updated);

      setState((s) => ({
        ...s,
        status:        "complete",
        uploadSpeed,
        uploadProgress: 100,
      }));
    } catch (err) {
      const wasAborted             = masterRef.current.signal.aborted;
      const errorCode              = (abortReasonRef.current ?? "generic") as ErrorCode;
      abortReasonRef.current       = null;

      const errorMessage = wasAborted
        ? (errorCode === "connection-lost" ? "Connection lost during test" : "Test was cancelled")
        : err instanceof Error ? err.message : "Test failed";

      setState((s) => ({
        ...s,
        status:    "error",
        error:     errorMessage,
        errorCode,
      }));
    }
  }, [pingTest, downloadTest, uploadTest, isOnline]);

  // ── abortTest ──────────────────────────────────────────────────────────────
  /**
   * Cancel any running test.
   * @param reason  The ErrorCode to attach to the resulting error state.
   *                Defaults to "generic".
   */
  const abortTest = useCallback((reason: ErrorCode = "generic") => {
    abortReasonRef.current = reason;
    masterRef.current.abort();
  }, []);

  // Automatically abort the test if the network goes offline during a test run
  useEffect(() => {
    if (!isOnline && ["ping", "download", "upload"].includes(state.status)) {
      abortTest("connection-lost");
    }
  }, [isOnline, state.status, abortTest]);

  // ── history helpers ────────────────────────────────────────────────────────
  const removeResult = useCallback((id: string) => {
    setHistory(deleteResult(id));
  }, []);

  const clearAll = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  // ── Merge live sub-hook data into state ────────────────────────────────────
  const mergedState: TestState = {
    ...state,
    downloadSpeed:
      state.status === "download" ? liveDownloadSpeed : state.downloadSpeed,
    uploadSpeed:
      state.status === "upload" ? liveUploadSpeed : state.uploadSpeed,
    downloadProgress:
      state.status === "download" ? liveDownloadProgress : state.downloadProgress,
    uploadProgress:
      state.status === "upload" ? liveUploadProgress : state.uploadProgress,
    downloadData: liveDownloadData,
    uploadData:   liveUploadData,
  };

  return {
    state: mergedState,
    startTest,
    abortTest,
    history,
    removeResult,
    clearAll,
    isOnline,
  };
}

const DOWNLOAD_DURATION_MS = 10_000;
const UPLOAD_DURATION_MS   = 8_000;
const PING_ESTIMATE_MS     = 2_000;
