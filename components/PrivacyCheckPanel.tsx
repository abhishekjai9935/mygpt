"use client";

import { useState } from "react";
import type { useLocalAI } from "@/lib/useLocalAI";
import { InfoTooltip } from "./InfoTooltip";
import { CheckIcon, CopyIcon, ShieldIcon } from "./icons";

const DEVTOOLS_INSTRUCTIONS =
  "Open DevTools → Network → Fetch/XHR, clear the log, and send a prompt.";

function Row({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good";
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-[var(--muted)]">{label}</span>
      <span
        className={
          tone === "good"
            ? "font-medium text-[var(--accent-good)]"
            : "font-medium text-[var(--foreground)]"
        }
      >
        {value}
      </span>
    </div>
  );
}

export function PrivacyCheckPanel({
  ai,
}: {
  ai: ReturnType<typeof useLocalAI>;
}) {
  const { apiRequestCount } = ai;
  const [copied, setCopied] = useState(false);

  const handleVerify = async () => {
    try {
      await navigator.clipboard.writeText(DEVTOOLS_INSTRUCTIONS);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied/unavailable — the instructions are
      // still shown below, so this is a convenience, not a requirement.
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        <ShieldIcon className="h-3.5 w-3.5" />
        <span>Local privacy check</span>
        <InfoTooltip text="Counts fetch/XHR calls this page has made, using the real browser APIs — not a hardcoded claim. It can only see requests made by this page's own JavaScript." />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-1 text-[var(--muted)]">
            App network requests during this chat
            <InfoTooltip text="Counts every fetch/XHR this page's JavaScript makes — including ordinary things like loading a different page in this app (e.g. clicking 'How it works'). A nonzero count doesn't mean AI/prompt data was sent; check the row below for that." />
          </span>
          <span className="font-medium text-[var(--foreground)]">
            {apiRequestCount}
          </span>
        </div>
        <Row label="Prompt uploaded to our server" value="No" tone="good" />
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-1 text-[var(--muted)]">
            Cloud AI request
            <InfoTooltip text="Not inferred from the request count above — this is a fact about how the code is written: the send/regenerate logic only ever calls session.prompt()/promptStreaming(), local browser APIs, never fetch or XHR." />
          </span>
          <span className="font-medium text-[var(--accent-good)]">
            None detected
          </span>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-snug text-[var(--muted)]">
        This dashboard tracks requests made by this app. Chrome&apos;s
        internal model downloads and browser-level traffic are not visible
        to the webpage.
      </p>

      <button
        onClick={handleVerify}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5"
      >
        {copied ? (
          <CheckIcon className="h-3.5 w-3.5 text-[var(--accent-good)]" />
        ) : (
          <CopyIcon className="h-3.5 w-3.5" />
        )}
        {copied ? "Instructions copied" : "Verify in DevTools"}
      </button>
      <p className="mt-2 text-[11px] leading-snug text-[var(--muted)]">
        {DEVTOOLS_INSTRUCTIONS}
      </p>
    </div>
  );
}
