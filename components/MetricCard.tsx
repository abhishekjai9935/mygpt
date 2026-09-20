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
    <div className="flex flex-col gap-1 rounded-lg border border-black/10 bg-[var(--panel)] p-3 dark:border-white/10">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
        <span>{label}</span>
        {info && <InfoTooltip text={info} />}
      </div>
      <div className={`text-sm font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}
