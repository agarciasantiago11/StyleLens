import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ThemeId =
  | "purple-pink"
  | "blue-cyan"
  | "orange-red"
  | "green-emerald"
  | "pink-purple"
  | "dark";

type ThemeOption = {
  id: ThemeId;
  name: string;
  colors: [string, string];
};

type AppTheme = {
  id: ThemeId;
  name: string;
  gradient: [string, string];
  appBackground: string;
  headerBackground: string;
  surface: string;
  surfaceSoft: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  accentSoftStrong: string;
  onAccent: string;
  danger: string;
};

type AppThemeContextValue = {
  theme: AppTheme;
  themes: ThemeOption[];
  selectedThemeId: ThemeId;
  setSelectedThemeId: (id: ThemeId) => void;
};

const THEME_STORAGE_KEY = "stylelens.theme.id";

const THEMES: ThemeOption[] = [
  { id: "purple-pink", name: "Purpura y Rosa", colors: ["#a855f7", "#ec4899"] },
  { id: "blue-cyan", name: "Azul y Cyan", colors: ["#3b82f6", "#06b6d4"] },
  { id: "orange-red", name: "Naranja y Rojo", colors: ["#f97316", "#ef4444"] },
  { id: "green-emerald", name: "Verde y Esmeralda", colors: ["#22c55e", "#10b981"] },
  { id: "pink-purple", name: "Rosa y Purpura", colors: ["#ec4899", "#9333ea"] },
  { id: "dark", name: "Oscuro", colors: ["#475569", "#111827"] },
];

function hexToRgba(hexColor: string, alpha: number) {
  const clean = hexColor.replace("#", "");
  const value =
    clean.length === 3
      ? clean
          .split("")
          .map((char) => char + char)
          .join("")
      : clean;

  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildTheme(option: ThemeOption): AppTheme {
  const isDark = option.id === "dark";

  return {
    id: option.id,
    name: option.name,
    gradient: option.colors,
    appBackground: isDark ? "#0b1220" : "#fdf4f8",
    headerBackground: isDark ? "#111827" : "#ffffff",
    surface: isDark ? "#1f2937" : "#ffffff",
    surfaceSoft: isDark ? "#0f172a" : "#f9fafb",
    border: isDark ? "#334155" : "#e5e7eb",
    textPrimary: isDark ? "#f9fafb" : "#111111",
    textSecondary: isDark ? "#cbd5e1" : "#6b7280",
    textMuted: isDark ? "#94a3b8" : "#9ca3af",
    accent: option.colors[0],
    accentSoft: isDark ? hexToRgba(option.colors[0], 0.24) : hexToRgba(option.colors[0], 0.1),
    accentSoftStrong: isDark ? hexToRgba(option.colors[0], 0.32) : hexToRgba(option.colors[0], 0.2),
    onAccent: "#ffffff",
    danger: "#dc2626",
  };
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [selectedThemeId, setSelectedThemeIdState] = useState<ThemeId>("purple-pink");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        const exists = THEMES.find((item) => item.id === saved);
        if (mounted && exists) {
          setSelectedThemeIdState(exists.id);
        }
      } finally {
        if (mounted) {
          setHydrated(true);
        }
      }
    };

    loadTheme();

    return () => {
      mounted = false;
    };
  }, []);

  const setSelectedThemeId = useCallback((id: ThemeId) => {
    setSelectedThemeIdState(id);
    AsyncStorage.setItem(THEME_STORAGE_KEY, id).catch(() => {
      // Ignore storage errors to avoid blocking UI updates.
    });
  }, []);

  const selectedThemeOption = useMemo(
    () => THEMES.find((item) => item.id === selectedThemeId) ?? THEMES[0],
    [selectedThemeId]
  );

  const value = useMemo<AppThemeContextValue>(
    () => ({
      theme: buildTheme(selectedThemeOption),
      themes: THEMES,
      selectedThemeId,
      setSelectedThemeId,
    }),
    [selectedThemeOption, selectedThemeId, setSelectedThemeId]
  );

  if (!hydrated) {
    return null;
  }

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used inside AppThemeProvider");
  }

  return context;
}

export type { ThemeId, ThemeOption, AppTheme };
