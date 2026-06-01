"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { NetworkConnectionType } from "@/types/speed-test";

export interface NetworkStatusResult {
  isOnline: boolean;
  isChecking: boolean;
  connectionType: NetworkConnectionType;
  lastChecked: Date | null;
  checkConnection: () => Promise<boolean>;
}

const HEALTH_URL = "/api/health";
const TIMEOUT_MS = 5000;
/** How often to re-verify while the app is idle */
const IDLE_POLL_MS = 20_000;

/** Best-effort detection via the NetworkInformation API (not universally supported) */
function getConnectionType(): NetworkConnectionType {
  if (typeof navigator === "undefined") return "unknown";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = (navigator as any).connection;
  if (!conn) return "unknown";
  const t: string = conn.type || conn.effectiveType || "";
  if (t === "wifi")     return "wifi";
  if (t === "ethernet") return "ethernet";
  if (t === "cellular" || /[234]g/i.test(t)) return "cellular";
  return "unknown";
}

export function useNetworkStatus(): NetworkStatusResult {
  const [isOnline, setIsOnline]         = useState(true); // optimistic default
  const [isChecking, setIsChecking]     = useState(false);
  const [connectionType, setConnectionType] = useState<NetworkConnectionType>("unknown");
  const [lastChecked, setLastChecked]   = useState<Date | null>(null);

  /**
   * Sequence number so stale promises (from overlapping calls) can't overwrite
   * a result produced by a newer call.
   */
  const seqRef = useRef(0);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    // ── Fast-path: browser reports no network interface ──────────────────────
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOnline(false);
      setIsChecking(false);
      setLastChecked(new Date());
      return false;
    }

    const seq = ++seqRef.current;
    setIsChecking(true);
    if (typeof navigator !== "undefined") {
      setConnectionType(getConnectionType());
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(HEALTH_URL, { cache: "no-store", signal: ctrl.signal });
      clearTimeout(timer);

      if (seq === seqRef.current) {
        setIsOnline(res.ok);
        setIsChecking(false);
        setLastChecked(new Date());
      }
      return res.ok;
    } catch {
      clearTimeout(timer);
      // AbortError from timeout or a genuine network failure — both mean offline
      if (seq === seqRef.current) {
        setIsOnline(false);
        setIsChecking(false);
        setLastChecked(new Date());
      }
      return false;
    }
  }, []); // stable — no external deps

  useEffect(() => {
    // ── Browser network events ───────────────────────────────────────────────
    const onOnline  = () => checkConnection(); // verify before trusting
    const onOffline = () => {
      setIsOnline(false);
      setIsChecking(false);
      setLastChecked(new Date());
    };

    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);

    // Defer initial check to the next tick — prevents synchronous setState
    // in the effect body (which would cause cascading renders).
    const initTimer = setTimeout(() => { void checkConnection(); }, 0);

    // Periodic polling while the page is open
    const poll = setInterval(() => { void checkConnection(); }, IDLE_POLL_MS);

    return () => {
      window.removeEventListener("online",  onOnline);
      window.removeEventListener("offline", onOffline);
      clearTimeout(initTimer);
      clearInterval(poll);
    };
  }, [checkConnection]);

  return { isOnline, isChecking, connectionType, lastChecked, checkConnection };
}
