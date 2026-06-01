export type TestStatus =
  | "idle"
  | "ping"
  | "download"
  | "upload"
  | "complete"
  | "error";

/** Reason the test entered error state */
export type ErrorCode =
  | "no-connection"      // tried to start but no internet
  | "connection-lost"    // dropped during a running test
  | "timeout"            // request timed out
  | "generic";           // any other failure

/** Detected network interface type (best-effort via NetworkInformation API) */
export type NetworkConnectionType =
  | "wifi"
  | "ethernet"
  | "cellular"
  | "unknown";

export interface SpeedTestResult {
  id: string;
  timestamp: number;
  download: number;
  upload: number;
  ping: number;
  jitter: number;
  duration: number;
}

export interface SpeedDataPoint {
  time: number;
  speed: number;
}

export interface TestState {
  status: TestStatus;
  ping: number | null;
  jitter: number | null;
  downloadSpeed: number | null;
  uploadSpeed: number | null;
  downloadProgress: number;
  uploadProgress: number;
  downloadData: SpeedDataPoint[];
  uploadData: SpeedDataPoint[];
  error: string | null;
  /** Specific reason for the error state — null when not in error */
  errorCode: ErrorCode | null;
}
