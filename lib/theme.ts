export type Theme = "system" | "light" | "dark";

const THEME_KEY = "mygpt.theme";

/** Inlined into <head> so the theme applies before first paint / hydration. */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}`;

export function getStoredTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

/** Resolves "system" against the OS preference so a simple light/dark toggle
 * knows which state it's actually in right now. */
export function isDarkNow(): boolean {
  const stored = getStoredTheme();
  if (stored !== "system") return stored === "dark";
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
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
