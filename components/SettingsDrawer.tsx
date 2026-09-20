"use client";

import { useEffect } from "react";
import type { useLocalAI } from "@/lib/useLocalAI";
import { StatusPanel } from "./StatusPanel";
import { SessionModeToggle } from "./SessionModeToggle";
import { DiagnosticsDrawer } from "./DiagnosticsDrawer";
import { InfoSections } from "./InfoSections";

export function SettingsDrawer({
  ai,
  open,
  onClose,
}: {
  ai: ReturnType<typeof useLocalAI>;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      {/* Below md there's no room to push the chat over, so fall back to an
          overlay with a backdrop; md+ renders the aside in normal flow so it
          resizes the chat column instead of covering it. */}
      {open && (
        <button
          aria-label="Close settings"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
        />
      )}
      <aside
        className={`shrink-0 overflow-y-auto border-black/10 bg-[var(--background)] transition-[width] duration-200 dark:border-white/10 ${
          open
            ? "fixed inset-y-0 right-0 z-40 w-full max-w-sm border-l shadow-xl md:static md:z-auto md:w-[340px] md:shadow-none"
            : "fixed inset-y-0 right-0 z-40 w-0 md:static md:w-0 md:border-l-0"
        }`}
      >
        {open && (
          <div className="w-full max-w-sm md:w-[340px]">
            <div className="border-b border-black/10 p-4 dark:border-white/10">
              <h2 className="text-sm font-semibold">Status &amp; settings</h2>
            </div>
            <SessionModeToggle ai={ai} />
            <StatusPanel ai={ai} />
            <InfoSections />
            <DiagnosticsDrawer ai={ai} />
          </div>
        )}
      </aside>
    </>
  );
}
