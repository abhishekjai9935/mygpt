"use client";

import { useEffect, useState } from "react";
import type { useLocalAI } from "@/lib/useLocalAI";
import { InfoTooltip } from "./InfoTooltip";

function formatCountdown(msRemaining: number): string {
  const totalSeconds = Math.max(Math.ceil(msRemaining / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function SessionModeToggle({ ai }: { ai: ReturnType<typeof useLocalAI> }) {
  const { sessionMode, setSessionMode, idleExpiresAt } = ai;
  const isPermanent = sessionMode === "permanent";
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!idleExpiresAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [idleExpiresAt]);

  return (
    <div className="flex flex-col gap-2 border-b border-[var(--border)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)]">
          <span>Permanent session</span>
          <InfoTooltip
            text={
              isPermanent
                ? "Chat is saved to this browser's local storage and reloads next visit. Retention still follows Chrome's own storage policy — it isn't guaranteed to persist forever (e.g. if the user clears site data)."
                : "Chat auto-clears after 20 minutes since your last message if you don't come back. Toggle on to keep it saved in this browser instead."
            }
          />
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isPermanent}
          onClick={() => setSessionMode(isPermanent ? "temporary" : "permanent")}
          className="relative box-content h-5 w-9 shrink-0 rounded-full border border-[var(--border)] transition-colors duration-150"
          style={{
            backgroundColor: isPermanent
              ? "var(--accent-good)"
              : "var(--toggle-track-off)",
          }}
        >
          <span
            className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-150"
            style={{
              transform: isPermanent ? "translateX(16px)" : "translateX(0px)",
            }}
          />
        </button>
      </div>
      <p className="text-xs leading-snug text-[var(--muted)]">
        {isPermanent ? (
          "Stored on this device until you clear it or Chrome clears site data."
        ) : idleExpiresAt ? (
          <>
            Auto-clears 20 minutes after you go idle — sending a message
            resets the timer. Time remaining:{" "}
            <span className="font-medium text-[var(--foreground)]">
              {formatCountdown(idleExpiresAt - now)}
            </span>
          </>
        ) : (
          "Auto-clears 20 minutes after your last message if you don't return."
        )}
      </p>
    </div>
  );
}
