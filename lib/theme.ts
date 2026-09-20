export type Theme = "system" | "light" | "dark";

const THEME_KEY = "mygpt.theme";

/**
 * Inlined into <head> so the theme applies before first paint / hydration.
 * Resolves "no explicit choice" against the OS preference once, then sets a
 * `.dark` class on <html> — the single source of truth both for this file's
 * CSS custom properties (globals.css) and for every Tailwind `dark:` utility
 * across the app (see the `@custom-variant dark` in globals.css).
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem('${THEME_KEY}');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');}}catch(e){}`;

export function getStoredTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

/** Reads the class the init script (or a previous toggle) already applied —
 * the single source of truth, rather than re-deriving it independently. */
export function isDarkNow(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
  );
}

export function applyTheme(theme: "light" | "dark"): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function saveTheme(theme: Theme): void {
  try {
    if (theme === "system") {
      localStorage.removeItem(THEME_KEY);
    } else {
      localStorage.setItem(THEME_KEY, theme);
    }
  } catch {
    // Storage may be unavailable — theme selection just won't persist.
  }
}
