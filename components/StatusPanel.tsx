import type { useLocalAI } from "@/lib/useLocalAI";
import { MetricCard } from "./MetricCard";
import { InfoTooltip } from "./InfoTooltip";
import { LockIcon } from "./icons";

const STATUS_LABEL: Record<string, string> = {
  checking: "Checking…",
  unsupported: "Not available",
  unavailable: "Not available",
  downloadable: "Download required",
  downloading: "Downloading",
  available: "Available",
  error: "Error",
};

const STATUS_TONE: Record<string, "neutral" | "good" | "warn" | "bad"> = {
  checking: "neutral",
  unsupported: "neutral",
  unavailable: "neutral",
  downloadable: "warn",
  downloading: "warn",
  available: "good",
  error: "bad",
};

const STATUS_CAPTION: Record<string, string> = {
  checking: "Looking for Chrome's built-in AI in this browser.",
  unsupported: "This browser doesn't expose Chrome's on-device AI.",
  unavailable: "Reported unavailable right now — can depend on hardware or storage.",
  downloadable: "The model needs to download once before you can chat.",
  downloading: "Chrome is downloading the on-device model.",
  available: "Running Chrome's built-in model locally, on this device.",
  error: "Something went wrong creating the local session.",
};

function formatTokens(n: number | null): string {
  return n === null ? "—" : n.toLocaleString();
}

export function StatusPanel({ ai }: { ai: ReturnType<typeof useLocalAI> }) {
  const { state, isOnline, deviceInfo } = ai;

  const used = state.contextUsage;
  const total = state.contextWindow;
  const remaining = used !== null && total !== null ? Math.max(total - used, 0) : null;
  const usedPct = used !== null && total ? Math.min((used / total) * 100, 100) : 0;

  const modelStatusValue =
    state.status === "downloading" && state.downloadProgress !== null
      ? `Downloading ${state.downloadProgress}%`
      : STATUS_LABEL[state.status] ?? state.status;

  return (
    <div className="flex flex-col gap-3 p-4">
      <MetricCard
        label="Local AI"
        value={modelStatusValue}
        tone={STATUS_TONE[state.status] ?? "neutral"}
        info={STATUS_CAPTION[state.status]}
      />

      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          <span>Context</span>
          <InfoTooltip text="Once you send a message, this shows tokens used out of the total context window (session.contextUsage / session.contextWindow), and how many remain before you'd need to start a new chat." />
        </div>
        <div className="mb-1 flex items-baseline gap-1.5">
          <span className="text-lg font-semibold text-[var(--foreground)]">
            {formatTokens(used)}
          </span>
          <span className="text-sm text-[var(--muted)]">
            / {formatTokens(total)} tokens used
          </span>
        </div>
        <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-[var(--accent-primary)] transition-[width]"
            style={{ width: `${usedPct}%` }}
          />
        </div>
        {remaining !== null && (
          <p className="text-xs leading-snug text-[var(--muted)]">
            {formatTokens(remaining)} tokens remaining in this chat before
            you&apos;ll need to start a new one.
          </p>
        )}
      </div>

      <MetricCard
        label="Network"
        value={isOnline ? "Online" : "Offline"}
        tone={isOnline ? "neutral" : "warn"}
        caption={
          isOnline
            ? "You can go offline anytime — once the model's downloaded, MyGPT keeps working without internet."
            : state.status === "available"
            ? "You're offline, but the model already lives on this device — chat still works."
            : "Reconnect to finish downloading the model before you can chat."
        }
        info="From navigator.onLine, the browser's own connectivity signal."
      />

      <MetricCard
        label="Last response"
        value={
          state.lastInferenceMs === null
            ? "—"
            : state.lastInferenceMs < 1000
            ? `${state.lastInferenceMs} ms`
            : `${(state.lastInferenceMs / 1000).toFixed(1)} s`
        }
        info="How long the most recent reply took to generate, in this tab — measured with performance.now() around the prompt() call. A wall-clock time for this device, not a benchmark."
      />

      <MetricCard
        label="Device"
        value={
          <span>
            {deviceInfo?.deviceMemory ? `${deviceInfo.deviceMemory} GB RAM` : "RAM not exposed"}
            {" · "}
            {deviceInfo?.hardwareConcurrency ?? "?"} CPU threads
          </span>
        }
        info="Approximate figures from your browser, not a live system reading. navigator.deviceMemory is a coarse bucket, not live free RAM; navigator.hardwareConcurrency is logical core count, not live CPU usage. Neither reflects real-time load, and browsers don't expose that to webpages."
      />

      <div className="rounded-xl border border-[var(--accent-good)]/30 bg-gradient-to-br from-[var(--accent-good)]/10 to-transparent p-4">
        <div className="mb-2 flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-good)] text-white">
            <LockIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-good)]">
              100% private by design
            </div>
            <div className="text-sm font-semibold text-[var(--foreground)]">
              Prompts never leave this device
            </div>
          </div>
        </div>
        <ul className="space-y-1 pl-1 text-xs text-[var(--muted)]">
          <li>No server-side AI route — this app has none</li>
          <li>Nothing is logged, because nothing is ever sent anywhere</li>
          <li>Keeps working offline once the model is downloaded</li>
        </ul>
      </div>
    </div>
  );
}
