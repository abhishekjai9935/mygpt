import type { ReactNode } from "react";
import { InfoTooltip } from "./InfoTooltip";

export function MetricCard({
  label,
  value,
  caption,
  info,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  /** Always-visible one-line context, e.g. a caveat worth surfacing without a hover. */
  caption?: ReactNode;
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
    <div className="flex flex-col gap-1.5 rounded-xl border border-black/10 bg-[var(--panel)] p-4 dark:border-white/10">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        <span>{label}</span>
        {info && <InfoTooltip text={info} />}
      </div>
      <div className={`text-lg font-semibold leading-tight ${toneClass}`}>
        {value}
      </div>
      {caption && (
        <p className="text-xs leading-snug text-[var(--muted)]">{caption}</p>
      )}
    </div>
  );
}
