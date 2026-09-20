import type { ChatMessage, SessionMode } from "./types";

const MODE_KEY = "mygpt.session.mode";
const MESSAGES_KEY = "mygpt.session.messages";
const LAST_INTERACTION_KEY = "mygpt.session.lastInteractionAt";

/** Idle window before a "temporary" chat is erased if the user doesn't return. */
export const RETENTION_MS = 20 * 60 * 1000;

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable (private browsing, quota, disabled cookies) —
    // persistence is a progressive enhancement, so degrade silently.
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}

export function loadSessionMode(): SessionMode {
  return safeGet(MODE_KEY) === "permanent" ? "permanent" : "temporary";
}

export function saveSessionMode(mode: SessionMode): void {
  safeSet(MODE_KEY, mode);
}

export function loadLastInteractionAt(): number | null {
  const raw = safeGet(LAST_INTERACTION_KEY);
  return raw ? Number(raw) : null;
}

export function saveLastInteractionAt(timestamp: number): void {
  safeSet(LAST_INTERACTION_KEY, String(timestamp));
}

export function loadPersistedMessages(): ChatMessage[] {
  const raw = safeGet(MESSAGES_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

export function savePersistedMessages(messages: ChatMessage[]): void {
  safeSet(MESSAGES_KEY, JSON.stringify(messages));
}

export function clearPersistedSession(): void {
  safeRemove(MESSAGES_KEY);
  safeRemove(LAST_INTERACTION_KEY);
}
