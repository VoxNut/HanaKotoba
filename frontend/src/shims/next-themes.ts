import { useEffect, useState } from "react";

// Minimal shim for `next-themes` providing a `useTheme` hook.
export const useTheme = () => {
  const [resolvedTheme, setResolvedTheme] = useState<string>(
    typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
  );

  useEffect(() => {
    const handler = () =>
      setResolvedTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      );
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return { resolvedTheme } as const;
};

export default null;
