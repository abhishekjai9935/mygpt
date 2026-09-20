import type { ReactNode } from "react";
import { InfoTooltip } from "./InfoTooltip";

export function MetricCard({
  label,
  value,
  info,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  info?: string;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const toneClass = {
    neutral: "text-[var(--foreground)]",
    good: "text-[var(--accent-good)]",
    warn: "text-[var(--accent-warn)]",
    bad: "text-[var(--accent-bad)]",
  }[tone];

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-2.5">
      <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted)]">
        {label}
        {info && <InfoTooltip text={info} />}
      </span>
      <span className={`text-sm font-semibold ${toneClass}`}>{value}</span>
    </div>
  );
}
