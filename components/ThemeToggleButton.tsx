"use client";

import { useEffect, useState } from "react";
import { applyTheme, isDarkNow, saveTheme } from "@/lib/theme";
import { MoonIcon, SunIcon } from "./icons";

export function ThemeToggleButton() {
  // SSR-safe default; the real value (which depends on localStorage and/or
  // the OS preference) is resolved post-mount, same pattern as the rest of
  // the app's browser-derived state.
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(isDarkNow());
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next ? "dark" : "light");
    saveTheme(next ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-[var(--muted)] hover:bg-black/5 hover:text-[var(--foreground)] dark:border-white/10 dark:hover:bg-white/5"
    >
      {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
    </button>
  );
}
