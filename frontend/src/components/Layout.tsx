import { Outlet, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center">
                <span className="text-2xl font-bold text-primary-600">
                  花言葉
                </span>
                <span className="ml-2 text-lg text-gray-700">HanaKotoba</span>
              </Link>

              {isAuthenticated && (
                <div className="ml-10 flex items-center space-x-4">
                  <Link
                    to="/dashboard"
                    className="text-gray-700 hover:text-primary-600"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/vocabulary"
                    className="text-gray-700 hover:text-primary-600"
                  >
                    Vocabulary
                  </Link>
                  <Link
                    to="/kanji"
                    className="text-gray-700 hover:text-primary-600"
                  >
                    Kanji
                  </Link>
                  <Link
                    to="/grammar"
                    className="text-gray-700 hover:text-primary-600"
                  >
                    Grammar
                  </Link>
                  <Link
                    to="/practice"
                    className="text-gray-700 hover:text-primary-600"
                  >
                    Practice
                  </Link>
                  <Link
                    to="/flashcards"
                    className="text-gray-700 hover:text-primary-600"
                  >
                    Flashcards
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    {user?.username} | {user?.japanese_level}
                  </span>
                  <button
                    onClick={logout}
                    className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-x-2">
                  <Link
                    to="/login"
                    className="bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md text-sm"
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

      <footer className="bg-white mt-12 border-t">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © 2024 HanaKotoba - Japanese Language Learning Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
