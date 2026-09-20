import type { LocalAIStatus } from "./types";

export function isSupported(): boolean {
  return typeof globalThis !== "undefined" && "LanguageModel" in globalThis;
}

export async function getAvailability(): Promise<LocalAIStatus> {
  if (!isSupported()) {
    return "unsupported";
  }

  try {
    const availability = await globalThis.LanguageModel!.availability();
    if (
      availability === "available" ||
      availability === "downloadable" ||
      availability === "downloading" ||
      availability === "unavailable"
    ) {
      return availability;
    }
    return "unavailable";
  } catch {
    return "error";
  }
}

export async function createSession(
  onProgress?: (percent: number) => void
): Promise<LanguageModel> {
  if (!isSupported()) {
    throw new Error("The Chrome Prompt API is not available in this browser.");
  }

  return globalThis.LanguageModel!.create({
    monitor(monitor) {
      monitor.addEventListener("downloadprogress", (event) => {
        onProgress?.(Math.round(event.loaded * 100));
      });
    },
  });
}

export interface PromptResult {
  response: string;
  elapsedMs: number;
  contextUsage: number | null;
  contextWindow: number | null;
}

export async function promptSession(
  session: LanguageModel,
  prompt: string,
  options?: { signal?: AbortSignal }
): Promise<PromptResult> {
  const startedAt = performance.now();
  const response = await session.prompt(prompt, { signal: options?.signal });
  const elapsedMs = Math.round(performance.now() - startedAt);

  return {
    response,
    elapsedMs,
    contextUsage: session.contextUsage ?? null,
    contextWindow: session.contextWindow ?? null,
  };
}

export async function* promptSessionStreaming(
  session: LanguageModel,
  prompt: string,
  options?: { signal?: AbortSignal }
): AsyncGenerator<string, PromptResult, void> {
  const startedAt = performance.now();
  const stream = session.promptStreaming(prompt, { signal: options?.signal });
  const reader = stream.getReader();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    full += value;
    yield full;
  }

  const elapsedMs = Math.round(performance.now() - startedAt);
  return {
    response: full,
    elapsedMs,
    contextUsage: session.contextUsage ?? null,
    contextWindow: session.contextWindow ?? null,
  };
}

export function supportsStreaming(session: LanguageModel): boolean {
  return typeof session.promptStreaming === "function";
}

export async function estimateContextUsage(
  session: LanguageModel,
  prompt: string
): Promise<number | null> {
  if (typeof session.measureContextUsage !== "function") {
    return null;
  }
  try {
    return await session.measureContextUsage(prompt);
  } catch {
    return null;
  }
}

export function getSessionMetrics(session: LanguageModel) {
  return {
    contextUsage: session.contextUsage ?? null,
    contextWindow: session.contextWindow ?? null,
  };
}

export function destroySession(session: LanguageModel | null): void {
  session?.destroy();
}
