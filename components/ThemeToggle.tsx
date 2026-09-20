"use client";

import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, saveTheme, type Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function ThemeToggle() {
  // Starts at the SSR-safe default and picks up the real stored value after
  // mount — the actual page theme is already correct pre-hydration via the
  // inline script in <head>, this only affects which button looks selected.
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(getStoredTheme());
  }, []);

  const handleSelect = (value: Theme) => {
    setTheme(value);
    saveTheme(value);
    applyTheme(value);
  };

  return (
    <div className="flex flex-col gap-2 border-b border-black/10 p-4 dark:border-white/10">
      <span className="text-sm font-medium text-[var(--foreground)]">
        Appearance
      </span>
      <div className="inline-flex rounded-lg border border-black/10 p-0.5 dark:border-white/10">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={theme === opt.value}
            onClick={() => handleSelect(opt.value)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              theme === opt.value
                ? "bg-[var(--accent-primary)] text-white"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="text-xs leading-snug text-[var(--muted)]">
        Auto follows your device&apos;s light/dark setting. Light and Dark
        override it just for MyGPT.
      </p>
    </div>
  );
}
