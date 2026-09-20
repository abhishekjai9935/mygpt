"use client";

import type { useLocalAI } from "@/lib/useLocalAI";
import { InfoTooltip } from "./InfoTooltip";
import { ShieldIcon } from "./icons";

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

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-[var(--muted)]">
        <ShieldIcon className="h-3.5 w-3.5" />
        <span>Local privacy check</span>
        <InfoTooltip text="A real, live count from the browser. Chrome's own model downloads and other browser-level traffic aren't visible to this page. To verify yourself: DevTools → Network → Fetch/XHR, clear the log, send a prompt." />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-1 text-[var(--muted)]">
            App network requests during this chat
            <InfoTooltip text="Includes ordinary page navigation, like clicking 'How it works' — not just AI activity." />
          </span>
          <span className="font-medium text-[var(--foreground)]">
            {apiRequestCount}
          </span>
        </div>
        <Row label="Prompt uploaded to our server" value="No" tone="good" />
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-1 text-[var(--muted)]">
            Cloud AI request
            <InfoTooltip text="The chat code never calls fetch or XHR — verified in source, not guessed from the count above." />
          </span>
          <span className="font-medium text-[var(--accent-good)]">
            None detected
          </span>
        </div>
      </div>
    </div>
  );
}
