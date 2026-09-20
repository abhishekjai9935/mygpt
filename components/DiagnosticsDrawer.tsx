"use client";

import { useState } from "react";
import type { useLocalAI } from "@/lib/useLocalAI";
import { isSupported } from "@/lib/local-ai";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

export function DiagnosticsDrawer({ ai }: { ai: ReturnType<typeof useLocalAI> }) {
  const { state, isOnline, deviceInfo, diagnostics, clearDiagnostics, sessionMode, idleExpiresAt } = ai;
  const [open, setOpen] = useState(false);

  const rows: [string, string][] = [
    ["API exists", String(isSupported())],
    ["Availability", state.status],
    ["Session created", String(state.status === "available")],
    ["Session mode", sessionMode],
    [
      "Auto-clear at",
      idleExpiresAt ? new Date(idleExpiresAt).toLocaleTimeString() : "—",
    ],
    ["Context usage", String(state.contextUsage ?? "—")],
    ["Context window", String(state.contextWindow ?? "—")],
    ["Network", isOnline ? "online" : "offline"],
    [
      "Last inference",
      state.lastInferenceMs !== null ? `${state.lastInferenceMs} ms` : "—",
    ],
    ["Last error", state.error ?? "—"],
    ["User agent", deviceInfo?.userAgent ?? "—"],
    ["hardwareConcurrency", String(deviceInfo?.hardwareConcurrency ?? "—")],
    ["deviceMemory", String(deviceInfo?.deviceMemory ?? "—")],
  ];

  return (
    <div className="border-t border-black/10 dark:border-white/10">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2 text-xs font-medium uppercase tracking-wide text-[var(--muted)]"
        aria-expanded={open}
      >
        <span>Developer diagnostics</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="max-h-64 overflow-y-auto px-4 pb-4 text-xs">
          <dl className="mb-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-[var(--muted)]">{label}</dt>
                <dd className="break-all font-mono">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[var(--muted)]">Event log</span>
            <button
              onClick={clearDiagnostics}
              className="text-[var(--accent-primary)]"
            >
              Clear
            </button>
          </div>
          <ul className="space-y-0.5 font-mono">
            {diagnostics.length === 0 && (
              <li className="text-[var(--muted)]">No events yet.</li>
            )}
            {diagnostics
              .slice()
              .reverse()
              .map((entry) => (
                <li key={entry.id}>
                  <span className="text-[var(--muted)]">
                    {formatTime(entry.timestamp)}
                  </span>{" "}
                  {entry.message}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
