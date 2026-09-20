"use client";

import { useState } from "react";
import type { ChatMessage as ChatMessageType } from "@/lib/types";
import { Markdown } from "./Markdown";
import { CheckIcon, CopyIcon, LogoMark, RefreshIcon } from "./icons";

function formatLatency(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied/unavailable — fail silently.
    }
  };

  return (
    <button
      onClick={handleCopy}
      title={copied ? "Copied" : "Copy"}
      aria-label={copied ? "Copied" : "Copy response"}
      className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--muted)] hover:bg-black/5 hover:text-[var(--foreground)] dark:hover:bg-white/5"
    >
      {copied ? (
        <CheckIcon className="h-3.5 w-3.5 text-[var(--accent-good)]" />
      ) : (
        <CopyIcon className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export function ChatMessage({
  message,
  isLast,
  onRetry,
}: {
  message: ChatMessageType;
  isLast?: boolean;
  onRetry?: () => void;
}) {
  const isUser = message.role === "user";
  const isEmptyPending = message.pending && !message.content;

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 px-4 py-2">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[var(--accent-primary)] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words text-white sm:max-w-[70%]">
          {message.content}
        </div>
      </div>
    );
  }

  const showActions = isLast && !message.pending;

  return (
    <div className="flex gap-3 px-4 py-2">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)] text-white">
        <LogoMark className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div
          className={
            message.isError
              ? "rounded-lg border border-[var(--accent-bad)]/40 bg-[var(--accent-bad)]/10 px-3 py-2 text-sm text-[var(--accent-bad)]"
              : "text-[var(--foreground)]"
          }
        >
          {isEmptyPending ? (
            <TypingDots />
          ) : message.isError ? (
            message.content
          ) : (
            <Markdown content={message.content} />
          )}
        </div>
        <div className="mt-1 flex items-center gap-2">
          {!message.pending && message.latencyMs !== undefined && (
            <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
              {formatLatency(message.latencyMs)}
            </span>
          )}
          {showActions && !message.isError && (
            <CopyButton text={message.content} />
          )}
          {showActions && onRetry && (
            <button
              onClick={onRetry}
              title="Try again"
              aria-label="Regenerate response"
              className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--muted)] hover:bg-black/5 hover:text-[var(--foreground)] dark:hover:bg-white/5"
            >
              <RefreshIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
