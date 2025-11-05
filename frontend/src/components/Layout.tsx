import { Moon, Sun } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      <nav
        className={`${
          isDark ? "bg-gray-800 border-b border-gray-700" : "bg-white"
        } shadow-sm`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center">
                <span className="text-2xl font-bold text-primary-600">
                  花言葉
                </span>
                <span
                  className={`ml-2 text-lg ${
                    isDark ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  HanaKotoba
                </span>
              </Link>

              {isAuthenticated && (
                <div className="ml-10 flex items-center space-x-4">
                  <Link
                    to="/dashboard"
                    className={`${
                      isDark
                        ? "text-gray-300 hover:text-red-400"
                        : "text-gray-700 hover:text-primary-600"
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/hiragana-katakana"
                    className={`${
                      isDark
                        ? "text-gray-300 hover:text-red-400"
                        : "text-gray-700 hover:text-primary-600"
                    }`}
                  >
                    Hiragana/Katakana
                  </Link>
                  <Link
                    to="/kanji"
                    className={`${
                      isDark
                        ? "text-gray-300 hover:text-red-400"
                        : "text-gray-700 hover:text-primary-600"
                    }`}
                  >
                    Kanji
                  </Link>
                  <Link
                    to="/vocabulary"
                    className={`${
                      isDark
                        ? "text-gray-300 hover:text-red-400"
                        : "text-gray-700 hover:text-primary-600"
                    }`}
                  >
                    Vocabulary
                  </Link>

                  <Link
                    to="/grammar"
                    className={`${
                      isDark
                        ? "text-gray-300 hover:text-red-400"
                        : "text-gray-700 hover:text-primary-600"
                    }`}
                  >
                    Grammar
                  </Link>
                  <Link
                    to="/practice"
                    className={`${
                      isDark
                        ? "text-gray-300 hover:text-red-400"
                        : "text-gray-700 hover:text-primary-600"
                    }`}
                  >
                    Practice
                  </Link>
                  <Link
                    to="/flashcards"
                    className={`${
                      isDark
                        ? "text-gray-300 hover:text-red-400"
                        : "text-gray-700 hover:text-primary-600"
                    }`}
                  >
                    Flashcards
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
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

      <footer
        className={`${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white"
        } mt-12 border-t`}
      >
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3
              className={`text-2xl font-bold mb-4 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              花言葉 HanaKotoba
            </h3>
            <p className={`mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Your comprehensive platform for learning Japanese language.
            </p>
            <div
              className={`flex justify-center gap-6 mb-6 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              <Link
                to="/vocabulary"
                className={`${
                  isDark ? "hover:text-red-400" : "hover:text-primary-600"
                }`}
              >
                Vocabulary
              </Link>
              <Link
                to="/kanji"
                className={`${
                  isDark ? "hover:text-red-400" : "hover:text-primary-600"
                }`}
              >
                Kanji
              </Link>
              <Link
                to="/grammar"
                className={`${
                  isDark ? "hover:text-red-400" : "hover:text-primary-600"
                }`}
              >
                Grammar
              </Link>
              <Link
                to="/flashcards"
                className={`${
                  isDark ? "hover:text-red-400" : "hover:text-primary-600"
                }`}
              >
                Flashcards
              </Link>
            </div>
            <p
              className={`text-sm ${
                isDark ? "text-gray-500" : "text-gray-500"
              }`}
            >
              © 2025 HanaKotoba. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
