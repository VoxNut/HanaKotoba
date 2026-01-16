import {
  BookOpen,
  BookOpenCheck,
  BookText,
  ChartNetwork,
  ClipboardCheck,
  FlowerIcon,
  Gamepad2,
  Languages,
  LayoutGrid,
  Library,
  PenTool,
  Scroll,
  Speech,
  Target,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const isDark = useThemeStore((state) => state.isDark);
  const navigate = useNavigate();

  const features = [
    {
      title: "Hiragana/Katakana",
      icon: Scroll,
      description:
        "Master the Japanese phonetic alphabets with comprehensive charts and interative practive",
      route: "/hiragana-katakana",
    },
    {
      title: "Kana Practice Game",
      icon: Gamepad2,
      description:
        "Test your hiragana and katakana skills with our fun, gamified practice mode. Track your progress and beat your high score!",
      route: "/kana-practice",
    },
    {
      title: "Kanji",
      icon: PenTool,
      description:
        "Write and recognize kanji naturally with AI handwriting analysis. Get instant feedback on stroke order, readings, and memorable mnemonics.",
      route: "/kanji",
    },
    {
      title: "Vocabulary",
      icon: BookOpen,
      description:
        "Master 2,000+ words across all JLPT levels with spaced repetition and contextual examples..",
      route: "/vocabulary",
    },
    {
      title: "Grammar",
      icon: BookOpenCheck,
      description:
        "Understand N5-N1 grammar patterns through clear explanations, real-world examples, and practice exercises.",
      route: "/grammar",
    },
    {
      title: "Flashcards",
      icon: LayoutGrid,
      description:
        "Study smarter with AI-generated flashcards. Upload any Japanese text and get instant study materials.",
      route: "/flashcards",
    },
    {
      title: "Practice",
      icon: ClipboardCheck,
      description:
        "Retain what you learn with scientifically-proven spaced repetition. Review at optimal intervals for maximum retention.",
      route: "/practice",
    },
    {
      title: "Decompose Kanji",
      icon: ChartNetwork,
      description: "Show Kanji information and decomposition in graph form",
      route: "/kanji-graph",
    },
    {
      title: "Text-to-Speech",
      icon: Speech,
      description:
        "Convert any Japanese text to natural speech. Perfect for practicing pronunciation and listening comprehension.",
      route: "/text-to-speech",
    },
    {
      title: "Translation",
      icon: Languages,
      description:
        "Translate between Japanese and English with auto-detection. Powered by free NLLB-200 AI model.",
      route: "/translation",
    },
    {
      title: "Manga Reader",
      icon: BookText,
      description:
        "Read manga with AI-powered OCR. Hover over text to see readings, pitch accent, and translations. Add words to your flashcards with one click.",
      route: "/manga-reader",
    },
    {
      title: "Manga Library",
      icon: Library,
      description:
        "Manage your manga collection. View, search, sort, and delete volumes. Track storage usage and OCR status.",
      route: "/library",
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
      <div
        className={`relative overflow-hidden ${
          isDark ? "" : "bg-gradient-to-b from-pink-100 to-white"
        }`}
      >
        {/* Cherry Blossom Decorations with Floating Animation */}
        <div className="absolute top-20 left-10 text-6xl opacity-20 animate-float">
          🌸
        </div>
        <div className="absolute top-40 right-20 text-5xl opacity-20 animate-float-delay-1">
          🌸
        </div>
        <div className="absolute bottom-20 left-1/4 text-4xl opacity-20 animate-float-delay-2">
          🌸
        </div>
        <div className="absolute bottom-10 right-1/3 text-5xl opacity-10 animate-float-delayed">
          🌸
        </div>

        <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center relative z-10">
            {/* Icon */}
            <div className="flex justify-center mb-8">
              <div
                className={`${
                  isDark ? "bg-gray-700" : "bg-pink-100"
                } rounded-full p-8 flex items-center justify-center`}
              >
                <FlowerIcon className="w-14 h-14 text-primary-500" />
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
                  onClick={() => navigate("/flashcards")}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-10 py-4 rounded-full text-lg font-medium transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <Target className="w-5 h-5" />
                  Start Learning
                </button>
              ) : (
                <Link
                  to="/register"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-10 py-4 rounded-full text-lg font-medium transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <Target className="w-5 h-5" />
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
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className={`rounded-2xl p-8 border transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                  isDark
                    ? "bg-gradient-to-br from-gray-800 to-gray-900 border-primary-900/30 hover:border-primary-600/50 hover:shadow-primary-900/20"
                    : "bg-white border-gray-200 hover:border-primary-300 hover:shadow-primary-200/20"
                }`}
              >
                {/* Icon */}
                <div className="mb-4 text-primary-500">
                  <IconComponent className="w-14 h-14" />
                </div>

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
                    className="text-primary-500 hover:text-primary-400 font-medium flex items-center gap-2 group"
                  >
                    Start Learning
                    <span className="transform group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </button>
                ) : (
                  <Link
                    to="/register"
                    className="text-primary-500 hover:text-primary-400 font-medium flex items-center gap-2 group"
                  >
                    Start Learning
                    <span className="transform group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
