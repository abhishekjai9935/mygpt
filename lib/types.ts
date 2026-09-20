export type SessionMode = "temporary" | "permanent";

export type LocalAIStatus =
  | "checking"
  | "unsupported"
  | "unavailable"
  | "downloadable"
  | "downloading"
  | "available"
  | "error";

export interface LocalAIState {
  status: LocalAIStatus;
  downloadProgress: number | null;
  contextUsage: number | null;
  contextWindow: number | null;
  lastInferenceMs: number | null;
  error: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  pending?: boolean;
  isError?: boolean;
  latencyMs?: number;
}

export interface DeviceInfo {
  userAgent: string;
  hardwareConcurrency: number | null;
  deviceMemory: number | null;
  isOnline: boolean;
}

export interface DiagnosticsEntry {
  id: string;
  timestamp: number;
  message: string;
}
