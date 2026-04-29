export type AppThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "bs-lab-theme";

function resolveEffective(mode: AppThemeMode): "light" | "dark" {
  if (mode === "light") return "light";
  if (mode === "dark") return "dark";
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** 将当前存储的主题应用到 `document.documentElement` 的 `.dark` 类 */
export function applyStoredTheme(): void {
  if (typeof document === "undefined") return;
  const mode = getStoredTheme();
  const effective = resolveEffective(mode);
  document.documentElement.classList.toggle("dark", effective === "dark");
}

export function getStoredTheme(): AppThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    /* ignore */
  }
  return "system";
}

export function setStoredTheme(mode: AppThemeMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
  applyStoredTheme();
}
