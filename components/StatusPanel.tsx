import type { useLocalAI } from "@/lib/useLocalAI";
import { MetricCard } from "./MetricCard";

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

function formatTokens(n: number | null): string {
  return n === null ? "—" : n.toLocaleString();
}

export function StatusPanel({ ai }: { ai: ReturnType<typeof useLocalAI> }) {
  const { state, isOnline, deviceInfo } = ai;

  const remaining =
    state.contextUsage !== null && state.contextWindow !== null
      ? Math.max(state.contextWindow - state.contextUsage, 0)
      : null;

  const modelStatusValue =
    state.status === "downloading" && state.downloadProgress !== null
      ? `Downloading ${state.downloadProgress}%`
      : STATUS_LABEL[state.status] ?? state.status;

  return (
    <div className="flex flex-col gap-3 p-4">
      <MetricCard
        label="Local AI"
        value={state.status === "available" ? "Enabled" : "Not enabled"}
        tone={state.status === "available" ? "good" : "neutral"}
        info="Whether an on-device model session is ready to answer prompts right now."
      />
      <MetricCard
        label="Model status"
        value={modelStatusValue}
        tone={STATUS_TONE[state.status] ?? "neutral"}
        info="Reported by Chrome's LanguageModel.availability() and the session's download monitor."
      />
      <MetricCard
        label="Inference mode"
        value="Local browser model"
        info="Every response is generated on this device by Chrome's built-in model — never sent to a server."
      />
      <MetricCard
        label="Context used / window"
        value={`${formatTokens(state.contextUsage)} / ${formatTokens(
          state.contextWindow
        )}`}
        info="Tokens consumed by the current session vs. its total capacity, from session.contextUsage and session.contextWindow."
      />
      <MetricCard
        label="Context remaining"
        value={formatTokens(remaining)}
        tone={remaining !== null && state.contextWindow && remaining < state.contextWindow * 0.1 ? "warn" : "neutral"}
        info="Approximate tokens left before you'll need to start a new chat."
      />
      <MetricCard
        label="Last inference"
        value={
          state.lastInferenceMs === null
            ? "—"
            : state.lastInferenceMs < 1000
            ? `${state.lastInferenceMs} ms`
            : `${(state.lastInferenceMs / 1000).toFixed(1)} s`
        }
        info="Wall-clock time for the most recent response, measured with performance.now() in this tab."
      />
      <MetricCard
        label="Network"
        value={isOnline ? "Online" : "Offline"}
        tone={isOnline ? "neutral" : "warn"}
        info="From navigator.onLine. Once the model is downloaded, chat can keep working while offline."
      />
      <MetricCard
        label="Device"
        value={
          <span>
            Approx. RAM:{" "}
            {deviceInfo?.deviceMemory ? `${deviceInfo.deviceMemory} GB` : "Not exposed"}
            <br />
            CPU threads: {deviceInfo?.hardwareConcurrency ?? "Not exposed"}
          </span>
        }
        info="navigator.deviceMemory is a coarse bucket, not live free RAM; navigator.hardwareConcurrency is logical core count, not live CPU usage. Neither reflects real-time system load, and browsers don't expose that to webpages."
      />
      <MetricCard
        label="Privacy"
        value="Prompts never leave this device"
        tone="good"
        info="MyGPT has no server-side AI route. Chat requests go directly from your browser to Chrome's local model."
      />
    </div>
  );
}
