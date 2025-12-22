import { TooltipProvider } from "@/components/ui/tooltip";
import { ChevronDown, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { useToastStore } from "../store/toastStore";
import AudioControl from "./AudioControl";
import { ConfirmDialog } from "./ConfirmDialog";
import { ToastItem } from "./Toast";

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { toasts, removeToast } = useToastStore();
  const [showNav, setShowNav] = useState(false);

  return (
    <TooltipProvider>
      <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        <nav
          className={`sticky top-0 z-40 backdrop-blur-md transition-colors duration-200 ${
            isDark
              ? "bg-gray-900/75 border-b border-gray-800 text-gray-100"
              : "bg-white/85 border-b border-gray-200 text-gray-900"
          } shadow-sm`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link to="/" className="flex items-center space-x-3">
                  <div>
                    <div className="text-xl font-bold text-primary-600">
                      花言葉
                    </div>
                    <div className="text-sm opacity-80">
                      HanaKotoba — Learn Japanese
                    </div>
                  </div>
                </Link>

                {/* Navigation Menu */}
                {isAuthenticated && (
                  <div className="relative ml-8">
                    <button
                      onClick={() => setShowNav(!showNav)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        isDark
                          ? "hover:bg-gray-800 text-gray-200"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <span className="font-medium">Learn</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          showNav ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {showNav && (
                      <div
                        className={`absolute top-full left-0 mt-2 w-48 rounded-lg shadow-lg border ${
                          isDark
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-gray-200"
                        }`}
                        onMouseLeave={() => setShowNav(false)}
                      >
                        <Link
                          to="/dashboard"
                          className={`block px-4 py-2 rounded-t-lg transition-colors ${
                            isDark
                              ? "hover:bg-gray-700 text-gray-200"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                          onClick={() => setShowNav(false)}
                        >
                          Dashboard
                        </Link>
                        <Link
                          to="/vocabulary"
                          className={`block px-4 py-2 transition-colors ${
                            isDark
                              ? "hover:bg-gray-700 text-gray-200"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                          onClick={() => setShowNav(false)}
                        >
                          Vocabulary
                        </Link>
                        <Link
                          to="/kanji"
                          className={`block px-4 py-2 transition-colors ${
                            isDark
                              ? "hover:bg-gray-700 text-gray-200"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                          onClick={() => setShowNav(false)}
                        >
                          Kanji
                        </Link>
                        <Link
                          to="/kanji-graph"
                          className={`block px-4 py-2 transition-colors ${
                            isDark
                              ? "hover:bg-gray-700 text-gray-200"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                          onClick={() => setShowNav(false)}
                        >
                          Kanji Graph
                        </Link>
                        <Link
                          to="/grammar"
                          className={`block px-4 py-2 transition-colors ${
                            isDark
                              ? "hover:bg-gray-700 text-gray-200"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                          onClick={() => setShowNav(false)}
                        >
                          Grammar
                        </Link>
                        <Link
                          to="/hiragana-katakana"
                          className={`block px-4 py-2 transition-colors ${
                            isDark
                              ? "hover:bg-gray-700 text-gray-200"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                          onClick={() => setShowNav(false)}
                        >
                          Hiragana/Katakana
                        </Link>
                        <Link
                          to="/flashcards"
                          className={`block px-4 py-2 transition-colors ${
                            isDark
                              ? "hover:bg-gray-700 text-gray-200"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                          onClick={() => setShowNav(false)}
                        >
                          Flashcards
                        </Link>
                        <Link
                          to="/practice"
                          className={`block px-4 py-2 transition-colors ${
                            isDark
                              ? "hover:bg-gray-700 text-gray-200"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                          onClick={() => setShowNav(false)}
                        >
                          Practice
                        </Link>
                        <Link
                          to="/text-to-speech"
                          className={`block px-4 py-2 rounded-b-lg transition-colors ${
                            isDark
                              ? "hover:bg-gray-700 text-gray-200"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                          onClick={() => setShowNav(false)}
                        >
                          Text-to-Speech
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <AudioControl />
                {/* Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg ${
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                  aria-label="Toggle theme"
                >
                  {isDark ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </button>

                {isAuthenticated ? (
                  <div className="flex items-center space-x-4">
                    <span
                      className={`text-sm ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {user?.username} | {user?.japanese_level}
                    </span>
                    <button
                      onClick={logout}
                      className={`px-4 py-2 rounded-md text-sm ${
                        isDark
                          ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-x-2">
                    <Link
                      to="/login"
                      className={`px-4 py-2 rounded-md text-sm ${
                        isDark
                          ? "bg-gray-700 border border-gray-600 hover:bg-gray-600 text-gray-200"
                          : "bg-white border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main>
          <Outlet />
        </main>

        {/* Toast Notifications */}
        <div className="fixed top-20 right-4 z-50 flex flex-col items-end">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
          ))}
        </div>

        {/* Confirm Dialog */}
        <ConfirmDialog />

        <footer
          className={`mt-12 border-t py-10 transition-colors duration-200 ${
            isDark
              ? "bg-gray-900 border-gray-800 text-gray-300"
              : "bg-white border-gray-200 text-gray-600"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold text-primary-600">花言葉</h3>
                <p className="text-sm mt-1">
                  Your comprehensive platform for learning Japanese.
                </p>
              </div>

              <div className="flex items-center gap-6">
                <nav className="hidden sm:flex gap-4">
                  <Link to="/vocabulary" className="hover:underline">
                    Vocabulary
                  </Link>
                  <Link to="/kanji" className="hover:underline">
                    Kanji
                  </Link>
                  <Link to="/grammar" className="hover:underline">
                    Grammar
                  </Link>
                </nav>

                <div className="flex items-center gap-4">
                  {/* Inline GitHub link */}
                  <a
                    href="https://github.com/VoxNut/HanaKotoba"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100/60 dark:hover:bg-gray-800/60 transition"
                    aria-label="HanaKotoba on GitHub"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.93 3.19 9.11 7.62 10.58.56.1.77-.24.77-.53 0-.26-.01-1.12-.02-2.03-3.1.67-3.76-1.49-3.76-1.49-.51-1.29-1.25-1.63-1.25-1.63-1.02-.7.08-.69.08-.69 1.12.08 1.71 1.15 1.71 1.15 1 .17 1.56-.75 1.56-.75.92-1.58 2.41-1.12 3-.86.09-.67.39-1.12.71-1.38-2.48-.28-5.09-1.24-5.09-5.53 0-1.22.44-2.22 1.16-3-.12-.28-.5-1.42.11-2.96 0 0 .95-.3 3.12 1.15.9-.25 1.87-.37 2.83-.38.96.01 1.93.13 2.83.38 2.17-1.45 3.12-1.15 3.12-1.15.61 1.54.23 2.68.11 2.96.72.78 1.16 1.78 1.16 3 0 4.3-2.61 5.25-5.1 5.52.4.35.76 1.04.76 2.1 0 1.52-.01 2.75-.01 3.12 0 .29.2.64.78.53 4.42-1.48 7.6-5.66 7.6-10.58C23.25 5.48 18.27.5 12 .5z" />
                    </svg>
                    <span className="text-sm">GitHub</span>
                  </a>

                  {/* Theme toggle remains */}
                  <div className="hidden sm:block">
                    {/* keep small controls here if needed */}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} HanaKotoba. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}
