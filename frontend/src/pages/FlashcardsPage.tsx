import { useThemeStore } from "../store/themeStore";

export default function FlashcardsPage() {
  const isDark = useThemeStore((state) => state.isDark);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1
        className={`text-3xl font-bold mb-6 ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Flashcards
      </h1>
      <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
        Create and study AI-generated flashcards
      </p>
    </div>
  );
}
