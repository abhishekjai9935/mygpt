/**
 * Ambient types for Chrome's built-in AI (Prompt API for the `LanguageModel` global).
 * This API is experimental and Chrome-only; shapes are based on the current spec draft
 * and may change between Chrome versions. Always guard usage with `"LanguageModel" in
 * globalThis` before calling anything here.
 *
 * Spec: https://github.com/webmachinelearning/prompt-api
 *
 * Everything here lives inside `declare global` (rather than as bare top-level
 * ambient declarations) because this file has a top-level `export {}`, which
 * makes it a module — top-level `interface`/`type` would then be scoped to
 * this module instead of merging into the global namespace.
 */

declare global {
  type LanguageModelAvailability =
    | "unavailable"
    | "downloadable"
    | "downloading"
    | "available";

  type LanguageModelMessageRole = "system" | "user" | "assistant";

  interface LanguageModelMessage {
    role: LanguageModelMessageRole;
    content: string;
  }

  interface LanguageModelDownloadProgressEvent extends Event {
    /** Fraction downloaded, in the 0..1 range. */
    readonly loaded: number;
  }

  interface LanguageModelMonitor extends EventTarget {
    addEventListener(
      type: "downloadprogress",
      listener: (event: LanguageModelDownloadProgressEvent) => void
    ): void;
    removeEventListener(
      type: "downloadprogress",
      listener: (event: LanguageModelDownloadProgressEvent) => void
    ): void;
  }

  interface LanguageModelCreateOptions {
    temperature?: number;
    topK?: number;
    signal?: AbortSignal;
    initialPrompts?: LanguageModelMessage[];
    monitor?: (monitor: LanguageModelMonitor) => void;
  }

  interface LanguageModelPromptOptions {
    signal?: AbortSignal;
  }

  interface LanguageModelParams {
    defaultTopK: number;
    maxTopK: number;
    defaultTemperature: number;
    maxTemperature: number;
  }

  interface LanguageModel extends EventTarget {
    prompt(
      input: string | LanguageModelMessage[],
      options?: LanguageModelPromptOptions
    ): Promise<string>;
    promptStreaming(
      input: string | LanguageModelMessage[],
      options?: LanguageModelPromptOptions
    ): ReadableStream<string>;
    measureContextUsage?(
      input: string | LanguageModelMessage[]
    ): Promise<number>;
    readonly contextUsage: number;
    readonly contextWindow: number;
    destroy(): void;
  }

  interface LanguageModelStatic {
    availability(): Promise<LanguageModelAvailability>;
    create(options?: LanguageModelCreateOptions): Promise<LanguageModel>;
    params(): Promise<LanguageModelParams | null>;
  }

  var LanguageModel: LanguageModelStatic | undefined;

  interface Navigator {
    /** Approximate device RAM in GiB, bucketed. Not supported in every browser. */
    readonly deviceMemory?: number;
  }
}

export {};
