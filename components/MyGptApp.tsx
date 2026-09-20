"use client";

import { useState } from "react";
import { useLocalAI } from "@/lib/useLocalAI";
import { ChatWindow } from "./ChatWindow";
import { SettingsDrawer } from "./SettingsDrawer";
import { StatusPill } from "./StatusPill";
import { OfflineBanner } from "./OfflineBanner";
import { DesktopRecommendedBanner } from "./DesktopRecommendedBanner";
import { LogoMark } from "./icons";

export function MyGptApp() {
  const ai = useLocalAI();
  const [settingsOpen, setSettingsOpen] = useState(false);

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
        <StatusPill
          status={ai.state.status}
          onClick={() => setSettingsOpen(true)}
        />
      </header>

      <DesktopRecommendedBanner />

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
