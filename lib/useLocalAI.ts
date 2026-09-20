"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createSession,
  destroySession,
  estimateContextUsage,
  getAvailability,
  isSupported,
} from "./local-ai";
import {
  RETENTION_MS,
  clearPersistedSession,
  loadLastInteractionAt,
  loadPersistedMessages,
  loadSessionMode,
  saveLastInteractionAt,
  savePersistedMessages,
  saveSessionMode,
} from "./persistence";
import { getDeviceInfo, isMobileDevice } from "./telemetry";
import type {
  ChatMessage,
  DeviceInfo,
  DiagnosticsEntry,
  LocalAIState,
  SessionMode,
} from "./types";

const MAX_DIAGNOSTICS_ENTRIES = 50;
/** Warn once a prompt would push usage past this fraction of the context window. */
const OVERFLOW_WARNING_THRESHOLD = 0.95;

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface OverflowWarning {
  estimatedTokens: number;
  remainingTokens: number;
}

export function useLocalAI() {
  const [state, setState] = useState<LocalAIState>({
    status: "checking",
    downloadProgress: null,
    contextUsage: null,
    contextWindow: null,
    lastInferenceMs: null,
    error: null,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  // These start with SSR-safe defaults and are hydrated with real
  // `navigator`-derived values post-mount (see the effect below) — reading
  // `navigator` directly in a lazy initializer would make the client's first
  // render differ from the server-rendered HTML and trigger a hydration
  // mismatch.
  const [isOnline, setIsOnline] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsEntry[]>([]);
  const [overflowWarning, setOverflowWarning] =
    useState<OverflowWarning | null>(null);
  const [sessionMode, setSessionModeState] = useState<SessionMode>("temporary");
  const [idleExpiresAt, setIdleExpiresAt] = useState<number | null>(null);

  const sessionRef = useRef<LanguageModel | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pendingSendRef = useRef<string | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInteractionRef = useRef<number | null>(null);
  /** Guards against persisting the empty initial state before storage has been read. */
  const persistenceReadyRef = useRef(false);

  const log = useCallback((message: string) => {
    setDiagnostics((prev) => {
      const next = [
        ...prev,
        { id: createId(), timestamp: Date.now(), message },
      ];
      return next.slice(-MAX_DIAGNOSTICS_ENTRIES);
    });
  }, []);

  const clearDiagnostics = useCallback(() => setDiagnostics([]), []);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const handleIdleExpiry = useCallback(() => {
    log("Temporary session auto-cleared after 20 minutes of inactivity.");
    clearPersistedSession();
    lastInteractionRef.current = null;
    idleTimerRef.current = null;
    setIdleExpiresAt(null);
    destroySession(sessionRef.current);
    sessionRef.current = null;
    setMessages([]);
    setState((prev) => ({ ...prev, contextUsage: null, contextWindow: null }));
  }, [log]);

  /** Arms (or re-arms) the auto-clear timer for `RETENTION_MS` from `fromTimestamp`. */
  const scheduleIdleTimer = useCallback(
    (fromTimestamp: number) => {
      clearIdleTimer();
      const expiresAt = fromTimestamp + RETENTION_MS;
      setIdleExpiresAt(expiresAt);
      idleTimerRef.current = setTimeout(
        handleIdleExpiry,
        Math.max(expiresAt - Date.now(), 0)
      );
    },
    [clearIdleTimer, handleIdleExpiry]
  );

  /** Records that the user just interacted, resetting the temporary-session clock. */
  const touchInteraction = useCallback(
    (mode: SessionMode) => {
      const now = Date.now();
      lastInteractionRef.current = now;
      saveLastInteractionAt(now);
      if (mode === "temporary") {
        scheduleIdleTimer(now);
      } else {
        clearIdleTimer();
        setIdleExpiresAt(null);
      }
    },
    [clearIdleTimer, scheduleIdleTimer]
  );

  // Initial capability check, device/network telemetry, and session hydration.
  // Browser-only; runs once on mount.
  useEffect(() => {
    let cancelled = false;

    // Real navigator-derived values, applied post-mount for the same
    // SSR-mismatch reason as the session hydration below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOnline(navigator.onLine);
    setDeviceInfo(getDeviceInfo());

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const mode = loadSessionMode();
    const storedLastInteraction = loadLastInteractionAt();
    const storedMessages = loadPersistedMessages();
    const withinRetention =
      mode === "permanent" ||
      (storedLastInteraction !== null &&
        Date.now() - storedLastInteraction <= RETENTION_MS);

    // Hydrating from localStorage must happen post-mount (SSR has no access
    // to it), so these setState calls intentionally run inside the effect.
    setSessionModeState(mode);

    if (storedMessages.length > 0 && withinRetention) {
      setMessages(storedMessages);
      lastInteractionRef.current = storedLastInteraction;
      if (mode === "temporary" && storedLastInteraction !== null) {
        scheduleIdleTimer(storedLastInteraction);
      }
      log(`Restored ${storedMessages.length} message(s) from a ${mode} session.`);
    } else if (storedMessages.length > 0) {
      clearPersistedSession();
      log("Previous temporary session expired after 20 minutes away; cleared.");
    }
    persistenceReadyRef.current = true;

    (async () => {
      const availability = await getAvailability();
      if (cancelled) return;
      log(`Availability check resolved: ${availability}`);
      setState((prev) => ({ ...prev, status: availability }));
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Destroy the active session and any pending timer on unmount.
  useEffect(() => {
    return () => {
      destroySession(sessionRef.current);
      sessionRef.current = null;
      clearIdleTimer();
    };
  }, [clearIdleTimer]);

  const setSessionMode = useCallback(
    (mode: SessionMode) => {
      setSessionModeState(mode);
      saveSessionMode(mode);
      log(
        mode === "permanent"
          ? "Session set to permanent: chat is kept in this browser's local storage until you clear it."
          : "Session set to temporary: chat auto-clears after 20 minutes of inactivity."
      );
      if (mode === "temporary") {
        scheduleIdleTimer(lastInteractionRef.current ?? Date.now());
      } else {
        clearIdleTimer();
        setIdleExpiresAt(null);
      }
    },
    [clearIdleTimer, log, scheduleIdleTimer]
  );

  const enable = useCallback(async () => {
    if (!isSupported()) {
      setState((prev) => ({ ...prev, status: "unsupported" }));
      return;
    }

    setState((prev) => ({
      ...prev,
      status: "downloading",
      downloadProgress: 0,
      error: null,
    }));
    log("Requesting local model session...");

    try {
      const session = await createSession((percent) => {
        log(`Download progress: ${percent}%`);
        setState((prev) => ({ ...prev, downloadProgress: percent }));
      });
      sessionRef.current = session;
      setState((prev) => ({
        ...prev,
        status: "available",
        downloadProgress: 100,
        contextUsage: session.contextUsage ?? null,
        contextWindow: session.contextWindow ?? null,
      }));
      log("Local session created and ready.");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState((prev) => ({
        ...prev,
        status: "error",
        error: message,
      }));
      log(`Failed to create session: ${message}`);
    }
  }, [log]);

  const ensureSession = useCallback(async (): Promise<LanguageModel | null> => {
    if (sessionRef.current) return sessionRef.current;
    await enable();
    return sessionRef.current;
  }, [enable]);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => {
      const next = [...prev, message];
      if (persistenceReadyRef.current) savePersistedMessages(next);
      return next;
    });
  }, []);

  const updateMessage = useCallback(
    (id: string, patch: Partial<ChatMessage>) => {
      setMessages((prev) => {
        const next = prev.map((m) => (m.id === id ? { ...m, ...patch } : m));
        if (persistenceReadyRef.current) savePersistedMessages(next);
        return next;
      });
    },
    []
  );

  /** Streams (or awaits) a response into an already-appended assistant
   * placeholder. Shared by a fresh send and a regenerate, which differ only
   * in whether a new user message is appended first. */
  const runInference = useCallback(
    async (session: LanguageModel, text: string, assistantId: string) => {
      setIsSending(true);
      setOverflowWarning(null);
      const controller = new AbortController();
      abortRef.current = controller;
      const startedAt = performance.now();

      try {
        if (typeof session.promptStreaming === "function") {
          const stream = session.promptStreaming(text, {
            signal: controller.signal,
          });
          const reader = stream.getReader();
          let full = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            full += value;
            updateMessage(assistantId, { content: full, pending: true });
          }
          updateMessage(assistantId, {
            content: full,
            pending: false,
            latencyMs: Math.round(performance.now() - startedAt),
          });
        } else {
          const response = await session.prompt(text, {
            signal: controller.signal,
          });
          updateMessage(assistantId, {
            content: response,
            pending: false,
            latencyMs: Math.round(performance.now() - startedAt),
          });
        }

        setState((prev) => ({
          ...prev,
          lastInferenceMs: Math.round(performance.now() - startedAt),
          contextUsage: session.contextUsage ?? prev.contextUsage,
          contextWindow: session.contextWindow ?? prev.contextWindow,
        }));
        log(`Inference completed in ${Math.round(performance.now() - startedAt)}ms.`);
      } catch (err) {
        const aborted = err instanceof DOMException && err.name === "AbortError";
        const message = aborted
          ? "Stopped by user."
          : err instanceof Error
          ? err.message
          : String(err);
        updateMessage(assistantId, {
          content: message,
          pending: false,
          isError: !aborted,
        });
        log(`Prompt failed: ${message}`);
      } finally {
        setIsSending(false);
        abortRef.current = null;
      }
    },
    [log, updateMessage]
  );

  const runSend = useCallback(
    async (text: string) => {
      const session = await ensureSession();
      if (!session) return;

      touchInteraction(sessionMode);

      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        content: text,
        createdAt: Date.now(),
      };
      const assistantId = createId();
      appendMessage(userMessage);
      appendMessage({
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
        pending: true,
      });

      await runInference(session, text, assistantId);
    },
    [appendMessage, ensureSession, runInference, sessionMode, touchInteraction]
  );

  /** Re-runs the last user prompt, replacing the assistant reply that
   * followed it with a freshly generated one. */
  const regenerate = useCallback(async () => {
    if (isSending) return;
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    if (!lastUserMessage) return;

    const session = await ensureSession();
    if (!session) return;

    touchInteraction(sessionMode);

    setMessages((prev) => {
      if (prev.length === 0 || prev[prev.length - 1].role !== "assistant") {
        return prev;
      }
      const next = prev.slice(0, -1);
      if (persistenceReadyRef.current) savePersistedMessages(next);
      return next;
    });

    const assistantId = createId();
    appendMessage({
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
      pending: true,
    });

    await runInference(session, lastUserMessage.content, assistantId);
  }, [
    appendMessage,
    ensureSession,
    isSending,
    messages,
    runInference,
    sessionMode,
    touchInteraction,
  ]);

  const sendMessage = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || isSending) return;

      const session = sessionRef.current;
      if (session && typeof session.measureContextUsage === "function") {
        try {
          const estimated = await estimateContextUsage(session, text);
          const remaining =
            (session.contextWindow ?? 0) - (session.contextUsage ?? 0);
          if (
            estimated !== null &&
            session.contextWindow &&
            estimated >= remaining * OVERFLOW_WARNING_THRESHOLD
          ) {
            pendingSendRef.current = text;
            setOverflowWarning({
              estimatedTokens: estimated,
              remainingTokens: Math.max(remaining, 0),
            });
            return;
          }
        } catch {
          // Estimation is best-effort; fall through and let prompt() surface
          // any real quota error instead.
        }
      }

      await runSend(text);
    },
    [isSending, runSend]
  );

  const confirmOverflowSend = useCallback(async () => {
    const text = pendingSendRef.current;
    pendingSendRef.current = null;
    setOverflowWarning(null);
    if (text) await runSend(text);
  }, [runSend]);

  const dismissOverflowWarning = useCallback(() => {
    pendingSendRef.current = null;
    setOverflowWarning(null);
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    destroySession(sessionRef.current);
    sessionRef.current = null;
    clearIdleTimer();
    clearPersistedSession();
    lastInteractionRef.current = null;
    setIdleExpiresAt(null);
    setMessages([]);
    setOverflowWarning(null);
    setState((prev) => ({
      ...prev,
      contextUsage: null,
      contextWindow: null,
      downloadProgress: prev.status === "available" ? null : prev.downloadProgress,
    }));
    log("Session destroyed and chat cleared for a new conversation.");
  }, [clearIdleTimer, log]);

  const clearChat = useCallback(() => {
    clearIdleTimer();
    clearPersistedSession();
    lastInteractionRef.current = null;
    setIdleExpiresAt(null);
    setMessages([]);
  }, [clearIdleTimer]);

  return {
    state,
    messages,
    isSending,
    isOnline,
    deviceInfo,
    isMobileDevice: deviceInfo ? isMobileDevice(deviceInfo.userAgent) : false,
    diagnostics,
    overflowWarning,
    sessionMode,
    idleExpiresAt,
    setSessionMode,
    enable,
    sendMessage,
    regenerate,
    confirmOverflowSend,
    dismissOverflowWarning,
    stop,
    newChat,
    clearChat,
    clearDiagnostics,
  };
}
