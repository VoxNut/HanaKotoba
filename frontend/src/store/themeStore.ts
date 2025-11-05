import { create } from "zustand";

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

// Get initial theme from localStorage or default to dark
const getInitialTheme = (): boolean => {
  const stored = localStorage.getItem("theme");
  if (stored) {
    return stored === "dark";
  }
  // Default to dark theme
  return true;
};

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const newTheme = !state.isDark;
      localStorage.setItem("theme", newTheme ? "dark" : "light");
      return { isDark: newTheme };
    }),
}));
