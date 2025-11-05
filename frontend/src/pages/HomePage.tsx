import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            <span className="text-primary-600">花言葉</span> HanaKotoba
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Master Japanese with AI-Powered Learning
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-12">
            Learn Hiragana, Katakana, Kanji, Vocabulary, and Grammar with
            intelligent spaced repetition, handwriting recognition, and
            AI-generated mnemonics.
          </p>

          <div className="flex justify-center gap-4">
            <Link
              to="/register"
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg text-lg font-medium"
            >
              Start Learning Free
            </Link>
            <Link
              to="/login"
              className="bg-white border-2 border-gray-300 hover:border-gray-400 px-8 py-3 rounded-lg text-lg font-medium"
            >
              Login
            </Link>
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">🖊️ Kanji Recognition</h3>
            <p className="text-gray-600">
              Draw kanji with your mouse and get instant AI-powered recognition
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">🧠 Smart Mnemonics</h3>
            <p className="text-gray-600">
              AI-generated stories make kanji memorable and easy to learn
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">📚 Spaced Repetition</h3>
            <p className="text-gray-600">
              Anki-style SRS algorithm ensures efficient long-term retention
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">
              🎯 Daily Recommendations
            </h3>
            <p className="text-gray-600">
              Personalized kanji and vocabulary suggestions every day
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">🗣️ Pitch Accent</h3>
            <p className="text-gray-600">
              Learn proper pronunciation with AI-generated pitch patterns
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">💳 Smart Flashcards</h3>
            <p className="text-gray-600">
              Auto-generate flashcards from any Japanese text
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
