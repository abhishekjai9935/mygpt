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
    <div className="flex flex-col gap-1.5 border-b border-black/10 p-4 dark:border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium">
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
          className="relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150"
          style={{
            backgroundColor: isPermanent
              ? "var(--accent-good)"
              : "rgba(120,120,128,0.32)",
          }}
        >
          <span
            className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-150"
            style={{
              transform: isPermanent ? "translateX(18px)" : "translateX(2px)",
            }}
          />
        </button>
      </div>
      <p className="text-[11px] text-[var(--muted)]">
        {isPermanent
          ? "Stored on this device until you clear it or Chrome clears site data."
          : idleExpiresAt
          ? `Auto-clears in ${formatCountdown(idleExpiresAt - now)} if you go idle.`
          : "Auto-clears 20 minutes after your last message if you don't return."}
      </p>
    </div>
  );
}
