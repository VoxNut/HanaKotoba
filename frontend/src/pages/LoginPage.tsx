import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/auth";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const isDark = useThemeStore((state) => state.isDark);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const user = await authService.login({ username, password });
      setUser(user);
      navigate("/dashboard");
    } catch (err: unknown) {
      const defaultMessage = "Login failed. Please try again.";

      type AxiosErrorLike = { response?: { data?: { detail?: string } } };

      const isAxiosErrorLike = (e: unknown): e is AxiosErrorLike =>
        typeof e === "object" && e !== null && "response" in e;

      if (isAxiosErrorLike(err) && err.response?.data?.detail) {
        setError(String(err.response.data.detail));
      } else if (err instanceof Error) {
        setError(err.message || defaultMessage);
      } else {
        setError(defaultMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div
        className={`max-w-md w-full p-8 rounded-lg shadow-md ${
          isDark ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h2
          className={`text-3xl font-bold text-center mb-6 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Login
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDark ? "text-gray-200" : "text-gray-700"
              }`}
            >
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white focus:ring-red-500"
                  : "bg-white border-gray-300 text-gray-900 focus:ring-primary-500"
              }`}
              required
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDark ? "text-gray-200" : "text-gray-700"
              }`}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white focus:ring-red-500"
                  : "bg-white border-gray-300 text-gray-900 focus:ring-primary-500"
              }`}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 rounded-md font-medium"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p
          className={`mt-4 text-center text-sm ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-red-500 hover:text-red-400 font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
