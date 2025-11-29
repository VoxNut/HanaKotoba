import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Lightweight shim for `next/navigation` used in this project while running under Vite.
// Provides `useRouter`, `usePathname`, and `notFound` with minimal behavior.

export const usePathname = () => {
  const location = useLocation();
  return location.pathname;
};

export const useRouter = () => {
  const navigate = useNavigate();
  const push = useCallback((to: string) => navigate(to), [navigate]);
  // prefetch is a no-op in this shim
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const prefetch = useCallback((_to: string) => Promise.resolve(), []);
  return { push, prefetch } as const;
};

export const notFound = () => {
  throw new Error("notFound()");
};

export default null;
