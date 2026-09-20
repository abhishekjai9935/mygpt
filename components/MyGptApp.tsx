"use client";

import { useEffect, useState } from "react";
import { useLocalAI } from "@/lib/useLocalAI";
import { ChatWindow } from "./ChatWindow";
import { SettingsDrawer } from "./SettingsDrawer";
import { StatusPill } from "./StatusPill";
import { OfflineBanner } from "./OfflineBanner";
import { DesktopRecommendedBanner } from "./DesktopRecommendedBanner";
import { ThemeToggleButton } from "./ThemeToggleButton";
import { LockIcon, LogoMark } from "./icons";

export function MyGptApp() {
  const ai = useLocalAI();
  // Open by default on desktop, where the panel just pushes the chat over.
  // On a narrow/mobile viewport it would cover the whole screen instead, so
  // start closed there and let people open it deliberately via the pill.
  const [settingsOpen, setSettingsOpen] = useState(true);

  useEffect(() => {
    // Viewport width is only knowable client-side; adjusting the SSR-safe
    // default here (rather than reading it in the initializer) avoids a
    // hydration mismatch.
    if (!window.matchMedia("(min-width: 768px)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSettingsOpen(false);
    }
  }, []);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-black/10 px-4 py-2.5 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-primary)] text-white">
            <LogoMark className="h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold">MyGPT</span>
            <span className="hidden text-xs text-[var(--muted)] sm:inline">
              by Ekya Tech
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1 rounded-full bg-[var(--accent-good)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--accent-good)] sm:flex">
            <LockIcon className="h-3 w-3" />
            100% private
          </span>
          <ThemeToggleButton />
          <StatusPill
            status={ai.state.status}
            active={settingsOpen}
            onClick={() => setSettingsOpen((open) => !open)}
          />
        </div>
      </header>

      <DesktopRecommendedBanner
        show={ai.isMobileDevice && ai.state.status === "unsupported"}
      />

      {!ai.isOnline && (
        <OfflineBanner modelAvailable={ai.state.status === "available"} />
      )}

      <div className="flex min-h-0 flex-1">
        <div className="min-h-0 min-w-0 flex-1">
          <ChatWindow ai={ai} />
        </div>
        <SettingsDrawer
          ai={ai}
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </div>
    </div>
  );
}
