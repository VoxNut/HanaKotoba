import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/auth";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    japanese_level: "N5",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const isDark = useThemeStore((state) => state.isDark);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.password_confirm) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const user = await authService.register(formData);
      setUser(user);
      navigate("/dashboard");
    } catch (err: unknown) {
      let message = "Registration failed. Please try again.";
      if (typeof err === "object" && err !== null) {
        const maybeAxios = err as { response?: { data?: { detail?: string } } };
        if (maybeAxios.response?.data?.detail) {
          message = maybeAxios.response.data.detail;
        }
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
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
          Create Account
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
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
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
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
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
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white focus:ring-red-500"
                  : "bg-white border-gray-300 text-gray-900 focus:ring-primary-500"
              }`}
              required
              minLength={8}
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDark ? "text-gray-200" : "text-gray-700"
              }`}
            >
              Confirm Password
            </label>
            <input
              type="password"
              value={formData.password_confirm}
              onChange={(e) =>
                setFormData({ ...formData, password_confirm: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white focus:ring-red-500"
                  : "bg-white border-gray-300 text-gray-900 focus:ring-primary-500"
              }`}
              required
              minLength={8}
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDark ? "text-gray-200" : "text-gray-700"
              }`}
            >
              Current Japanese Level
            </label>
            <select
              value={formData.japanese_level}
              onChange={(e) =>
                setFormData({ ...formData, japanese_level: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white focus:ring-red-500"
                  : "bg-white border-gray-300 text-gray-900 focus:ring-primary-500"
              }`}
            >
              <option value="N5">Beginner (N5)</option>
              <option value="N4">Elementary (N4)</option>
              <option value="N3">Intermediate (N3)</option>
              <option value="N2">Advanced (N2)</option>
              <option value="N1">Expert (N1)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 rounded-md font-medium"
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p
          className={`mt-4 text-center text-sm ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-red-500 hover:text-red-400 font-medium"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
