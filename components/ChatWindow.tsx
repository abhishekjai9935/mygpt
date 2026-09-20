"use client";

import { useEffect, useRef, useState } from "react";
import type { useLocalAI } from "@/lib/useLocalAI";
import { ChatMessage } from "./ChatMessage";
import {
  ChevronDownIcon,
  LogoMark,
  PlusIcon,
  SendIcon,
  StopIcon,
  TrashIcon,
} from "./icons";

/** Distance (px) from the bottom within which we still treat the user as
 * "at the bottom" and keep auto-scrolling as new content streams in. */
const BOTTOM_PIN_THRESHOLD = 96;

const SUGGESTIONS = [
  "Explain quantum computing simply",
  "Write a haiku about the ocean",
  "Summarize the plot of a story I'll paste",
  "Give me 3 quick dinner ideas",
];

export function ChatWindow({ ai }: { ai: ReturnType<typeof useLocalAI> }) {
  const {
    state,
    messages,
    isSending,
    overflowWarning,
    enable,
    sendMessage,
    confirmOverflowSend,
    dismissOverflowWarning,
    stop,
    newChat,
    clearChat,
  } = ai;

  const [input, setInput] = useState("");
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Only auto-follow new content while the user is already at (or near) the
  // bottom — the same pattern ChatGPT/Perplexity use. Scrolling up during a
  // streaming response should stay put, not get yanked back down.
  useEffect(() => {
    if (!isPinnedToBottom) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, isPinnedToBottom]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsPinnedToBottom(distanceFromBottom < BOTTOM_PIN_THRESHOLD);
  };

  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setIsPinnedToBottom(true);
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const canChat = state.status === "available" || state.status === "downloading";

  const handleSend = () => {
    if (!input.trim() || isSending) return;
    void sendMessage(input);
    setInput("");
    setIsPinnedToBottom(true);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {messages.length > 0 && (
        <div className="flex justify-end gap-1 px-3 pt-2">
          <button
            onClick={clearChat}
            title="Clear chat"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-black/5 hover:text-[var(--foreground)] dark:hover:bg-white/5"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
          <button
            onClick={newChat}
            title="New chat"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-black/5 hover:text-[var(--foreground)] dark:hover:bg-white/5"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <div ref={listRef} onScroll={handleScroll} className="h-full overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl py-3">
            {messages.length === 0 ? (
              <EmptyState
                status={state.status}
                onEnable={enable}
                onSuggestion={(text) => {
                  setInput(text);
                  requestAnimationFrame(() => textareaRef.current?.focus());
                }}
              />
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}
          </div>
        </div>

        {!isPinnedToBottom && messages.length > 0 && (
          <button
            onClick={scrollToBottom}
            aria-label="Jump to latest message"
            title="Jump to latest message"
            className="absolute bottom-3 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-black/10 bg-[var(--panel)] text-[var(--foreground)] shadow-md hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mx-auto w-full max-w-3xl px-3">
        {overflowWarning && (
          <div className="mb-2 flex flex-col gap-2 rounded-xl border border-[var(--accent-warn)]/40 bg-[var(--accent-warn)]/10 p-3 text-xs text-[var(--accent-warn)] sm:flex-row sm:items-center sm:justify-between">
            <span>
              This prompt (~{overflowWarning.estimatedTokens} tokens) may
              exceed the {overflowWarning.remainingTokens} tokens left in
              context. Consider starting a new chat.
            </span>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={dismissOverflowWarning}
                className="rounded-md border border-current px-2 py-1"
              >
                Cancel
              </button>
              <button
                onClick={() => void confirmOverflowSend()}
                className="rounded-md bg-[var(--accent-warn)] px-2 py-1 text-white"
              >
                Send anyway
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="px-3 pb-4">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-3xl border border-black/10 bg-[var(--panel)] p-2 shadow-sm dark:border-white/10">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!canChat}
            placeholder={
              canChat
                ? "Message MyGPT..."
                : "Enable local AI to start chatting"
            }
            rows={1}
            aria-label="Message"
            className="max-h-40 min-h-[2.25rem] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none disabled:opacity-50"
          />
          {isSending ? (
            <button
              onClick={stop}
              aria-label="Stop generating"
              title="Stop generating"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)]"
            >
              <StopIcon className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canChat || !input.trim()}
              aria-label="Send message"
              title="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)] text-white transition-opacity disabled:opacity-30"
            >
              <SendIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-1.5 text-center text-[11px] text-[var(--muted)]">
          Runs entirely on this device — nothing is sent to a server.
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  status,
  onEnable,
  onSuggestion,
}: {
  status: string;
  onEnable: () => void;
  onSuggestion: (text: string) => void;
}) {
  if (status === "unsupported") {
    return (
      <Notice title="Local AI isn't available in this browser">
        MyGPT needs Chrome&apos;s built-in Prompt API (Gemini Nano), which only
        runs in the Chrome browser on a desktop or laptop. It isn&apos;t
        available on mobile, and no other browser — Safari, Firefox, Edge —
        supports it either, even on desktop. No cloud fallback is used in
        this demo.
      </Notice>
    );
  }

  if (status === "unavailable" || status === "error") {
    return (
      <Notice title="Local AI is currently unavailable">
        Your device or browser reports the model as unavailable right now.
        This can depend on hardware, storage, or Chrome flags.
      </Notice>
    );
  }

  if (status === "checking") {
    return (
      <Notice title="Checking local AI availability…">One moment.</Notice>
    );
  }

  return (
    <div className="flex flex-col items-center px-4 pt-16 text-center sm:pt-24">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-primary)] text-white">
        <LogoMark className="h-6 w-6" />
      </div>
      <h2 className="text-2xl font-semibold text-[var(--foreground)]">
        What can I help with?
      </h2>
      <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
        Every response is generated on this device with Chrome&apos;s
        built-in AI — nothing is sent to a server.
      </p>

      {status !== "available" ? (
        <button
          onClick={onEnable}
          className="mt-5 rounded-full bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-medium text-white"
        >
          {status === "downloading"
            ? "Downloading model…"
            : "Download and enable local AI"}
        </button>
      ) : (
        <div className="mt-6 grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestion(s)}
              className="rounded-xl border border-black/10 bg-[var(--panel)] px-3 py-2.5 text-left text-xs text-[var(--foreground)] hover:border-[var(--accent-primary)]/40 dark:border-white/10"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Notice({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto mt-8 max-w-md rounded-xl border border-black/10 bg-[var(--panel)] p-5 text-center text-sm text-[var(--muted)] dark:border-white/10">
      <p className="mb-1 font-medium text-[var(--foreground)]">{title}</p>
      <p>{children}</p>
    </div>
  );
}
