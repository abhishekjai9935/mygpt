import type { LocalAIStatus } from "@/lib/types";
import { SettingsIcon } from "./icons";

const DOT_COLOR: Record<LocalAIStatus, string> = {
  checking: "var(--muted)",
  unsupported: "var(--muted)",
  unavailable: "var(--muted)",
  downloadable: "var(--accent-warn)",
  downloading: "var(--accent-warn)",
  available: "var(--accent-good)",
  error: "var(--accent-bad)",
};

const LABEL: Record<LocalAIStatus, string> = {
  checking: "Checking…",
  unsupported: "Unsupported",
  unavailable: "Unavailable",
  downloadable: "Download required",
  downloading: "Downloading…",
  available: "Local AI on",
  error: "Error",
};

export function StatusPill({
  status,
  active,
  onClick,
}: {
  status: LocalAIStatus;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label="Toggle status & settings"
      className={`flex items-center gap-2 rounded-full border py-1.5 pl-3 pr-2 text-xs font-medium transition-colors ${
        active
          ? "border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10 text-[var(--foreground)]"
          : "border-black/10 text-[var(--foreground)] hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
      }`}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: DOT_COLOR[status] }}
      />
      <span className="hidden sm:inline">{LABEL[status]}</span>
      <SettingsIcon className="h-3.5 w-3.5 text-[var(--muted)]" />
    </button>
  );
}
