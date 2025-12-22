import { Volume2 } from "lucide-react";
import { useState } from "react";
import { PitchAccentGraph } from "../components/PitchAccentGraph";
import { TextToSpeech } from "../components/TextToSpeech";
import { useThemeStore } from "../store/themeStore";

export default function TextToSpeechPage() {
  const isDark = useThemeStore((state) => state.isDark);
  const [text, setText] = useState("");
  const [language] = useState<"ja" | "auto">("ja");

  const exampleTexts = {
    conversational: "こんにちは、元気ですか？今日はいい天気ですね。",
    formal: "お疲れ様です。本日のご報告をさせていただきます。",
    learning:
      "日本語の勉強を頑張ってください。分からないことがあれば、教えてください。",
  };

  return (
    <div
      className={`min-h-screen ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Volume2 className="w-12 h-12 text-primary-600" />
            <h1 className="text-4xl md:text-5xl font-bold text-primary-600">
              Text-to-Speech
            </h1>
          </div>
          <p
            className={`text-lg max-w-2xl mx-auto ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Convert any text to natural speech. Perfect for practicing Japanese
            pronunciation and listening comprehension.
          </p>
        </div>

        {/* Main Content */}
        <div
          className={`p-8 rounded-2xl border ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          {/* Pitch Accent Graph */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <h3
                className={`text-lg font-semibold ${
                  isDark ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Pitch Accent Visualization
              </h3>
            </div>
            <PitchAccentGraph text={text} />
            <p
              className={`text-xs mt-2 ${
                isDark ? "text-gray-500" : "text-gray-500"
              }`}
            >
              <span className="text-red-500">Red text</span> = particles •
              Orange line = pitch contour • ⊗ = downstep (pitch drop)
            </p>
          </div>

          {/* Text Input */}
          <div className="mb-6">
            <label
              className={`block text-sm font-medium mb-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Text to Speak
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Japanese text here... (ひらがな、カタカナ、漢字)"
              rows={8}
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium ${
                isDark
                  ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
              }`}
            />
            <div
              className={`text-xs mt-2 flex justify-between ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              <span>{text.length} characters</span>
              <span>
                {text.length > 0 ? "Ready to speak" : "Enter some text"}
              </span>
            </div>
          </div>

          {/* Quick Examples */}
          <div className="mb-6">
            <label
              className={`block text-sm font-medium mb-3 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Quick Examples
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => setText(exampleTexts.conversational)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isDark
                    ? "bg-primary-900/30 hover:bg-primary-900/50 text-primary-300 border border-primary-700"
                    : "bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200"
                }`}
              >
                会話
              </button>
              <button
                onClick={() => setText(exampleTexts.formal)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isDark
                    ? "bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-700"
                    : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                }`}
              >
                ビジネス
              </button>
              <button
                onClick={() => setText(exampleTexts.learning)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isDark
                    ? "bg-green-900/30 hover:bg-green-900/50 text-green-300 border border-green-700"
                    : "bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
                }`}
              >
                学習
              </button>
            </div>
          </div>

          {/* Divider */}
          <div
            className={`my-8 border-t ${
              isDark ? "border-gray-700" : "border-gray-200"
            }`}
          />

          {/* TTS Component */}
          <TextToSpeech text={text} language={language} />
        </div>
      </div>
    </div>
  );
}
