import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const isDark = useThemeStore((state) => state.isDark);
  const navigate = useNavigate();

  const features = [
    {
      title: "Vocabulary",
      icon: "📚",
      description:
        "Master 2,000+ words across all JLPT levels with spaced repetition and contextual examples..",
      route: "/vocabulary",
    },
    {
      title: "Kanji",
      icon: "🖊️",
      description:
        "Write and recognize kanji naturally with AI handwriting analysis. Get instant feedback on stroke order, readings, and memorable mnemonics.",
      route: "/kanji",
    },
    {
      title: "Grammar",
      icon: "📖",
      description:
        "Understand N5-N1 grammar patterns through clear explanations, real-world examples, and practice exercises.",
      route: "/grammar",
    },
    {
      title: "Flashcards",
      icon: "💳",
      description:
        "Study smarter with AI-generated flashcards. Upload any Japanese text and get instant study materials.",
      route: "/flashcards",
    },
    {
      title: "Practice",
      icon: "✏️",
      description:
        "Retain what you learn with scientifically-proven spaced repetition. Review at optimal intervals for maximum retention.",
      route: "/practice",
    },
    {
      title: "AI Features",
      icon: "🤖",
      description:
        "Get personalized mnemonics for every kanji, accurate pitch accent diagrams, and daily recommendations tailored to your level.",
      route: "/dashboard",
    },
  ];

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? "bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-b from-white via-gray-50 to-gray-100"
      }`}
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Cherry Blossom Decorations */}
        <div className="absolute top-20 left-10 text-6xl opacity-20 animate-pulse">
          🌸
        </div>
        <div className="absolute top-40 right-20 text-5xl opacity-20 animate-pulse delay-1000">
          🌸
        </div>
        <div className="absolute bottom-20 left-1/4 text-4xl opacity-20 animate-pulse delay-500">
          🌸
        </div>

        <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center relative z-10">
            {/* Icon */}
            <div className="flex justify-center mb-8">
              <div
                className={`${
                  isDark ? "bg-gray-700" : "bg-gray-200"
                } rounded-full p-8`}
              >
                <span className="text-6xl">🍒</span>
              </div>
            </div>

            {/* Title */}
            <h1
              className={`text-6xl md:text-7xl font-bold mb-6 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              日本語を勉強しましょう！
            </h1>

            {/* Subtitle */}
            <p
              className={`text-xl md:text-2xl mb-8 max-w-4xl mx-auto ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Master Japanese through AI-powered learning
            </p>

            {/* CTA Button */}
            <div className="flex justify-center">
              {user ? (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-full text-lg font-medium transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <span>🎯</span>
                  Go to Dashboard
                </button>
              ) : (
                <Link
                  to="/register"
                  className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-full text-lg font-medium transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <span>🎯</span>
                  Start Learning
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Complete Learning System Section */}
      <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2
            className={`text-4xl md:text-5xl font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Complete Japanese Learning System
          </h2>
          <p
            className={`text-xl max-w-3xl mx-auto ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Master Japanese with our beautifully designed learning modules, each
            crafted to guide you through your language journey.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`rounded-2xl p-8 border transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                isDark
                  ? "bg-gradient-to-br from-gray-800 to-gray-900 border-red-900/30 hover:border-red-600/50 hover:shadow-red-900/20"
                  : "bg-white border-gray-200 hover:border-red-300 hover:shadow-red-200/20"
              }`}
            >
              {/* Icon */}
              <div className="text-5xl mb-4 text-red-500">{feature.icon}</div>

              {/* Title */}
              <h3
                className={`text-2xl font-bold mb-4 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {feature.title}
              </h3>

              {/* Description */}
              <p
                className={`mb-6 leading-relaxed ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {feature.description}
              </p>

              {/* CTA Link */}
              {user ? (
                <button
                  onClick={() => navigate(feature.route)}
                  className="text-red-500 hover:text-red-400 font-medium flex items-center gap-2 group"
                >
                  Start Learning
                  <span className="transform group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </button>
              ) : (
                <Link
                  to="/register"
                  className="text-red-500 hover:text-red-400 font-medium flex items-center gap-2 group"
                >
                  Start Learning
                  <span className="transform group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
