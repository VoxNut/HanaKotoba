import { useThemeStore } from "../store/themeStore";

export default function DashboardPage() {
  const isDark = useThemeStore((state) => state.isDark);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1
        className={`text-3xl font-bold mb-6 ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Dashboard
      </h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div
          className={`p-6 rounded-lg shadow ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h3
            className={`text-lg font-semibold mb-2 ${
              isDark ? "text-gray-200" : "text-gray-900"
            }`}
          >
            Study Streak
          </h3>
          <p className="text-3xl font-bold text-primary-600">0 days</p>
        </div>
        <div
          className={`p-6 rounded-lg shadow ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h3
            className={`text-lg font-semibold mb-2 ${
              isDark ? "text-gray-200" : "text-gray-900"
            }`}
          >
            Words Learned
          </h3>
          <p className="text-3xl font-bold text-primary-600">0</p>
        </div>
        <div
          className={`p-6 rounded-lg shadow ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h3
            className={`text-lg font-semibold mb-2 ${
              isDark ? "text-gray-200" : "text-gray-900"
            }`}
          >
            Kanji Mastered
          </h3>
          <p className="text-3xl font-bold text-primary-600">0</p>
        </div>
      </div>
      <div
        className={`mt-8 p-6 rounded-lg shadow ${
          isDark ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h2
          className={`text-xl font-bold mb-4 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Today's Recommendations
        </h2>
        <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Start studying to get personalized recommendations!
        </p>
      </div>
    </div>
  );
}
