import { useState } from "react";
import { useThemeStore } from "../store/themeStore";

interface Character {
  hiragana: string;
  katakana: string;
  romaji: string;
}

const basicCharacters: Character[] = [
  // Vowels
  { hiragana: "あ", katakana: "ア", romaji: "a" },
  { hiragana: "い", katakana: "イ", romaji: "i" },
  { hiragana: "う", katakana: "ウ", romaji: "u" },
  { hiragana: "え", katakana: "エ", romaji: "e" },
  { hiragana: "お", katakana: "オ", romaji: "o" },
  // K row
  { hiragana: "か", katakana: "カ", romaji: "ka" },
  { hiragana: "き", katakana: "キ", romaji: "ki" },
  { hiragana: "く", katakana: "ク", romaji: "ku" },
  { hiragana: "け", katakana: "ケ", romaji: "ke" },
  { hiragana: "こ", katakana: "コ", romaji: "ko" },
  // S row
  { hiragana: "さ", katakana: "サ", romaji: "sa" },
  { hiragana: "し", katakana: "シ", romaji: "shi" },
  { hiragana: "す", katakana: "ス", romaji: "su" },
  { hiragana: "せ", katakana: "セ", romaji: "se" },
  { hiragana: "そ", katakana: "ソ", romaji: "so" },
  // T row
  { hiragana: "た", katakana: "タ", romaji: "ta" },
  { hiragana: "ち", katakana: "チ", romaji: "chi" },
  { hiragana: "つ", katakana: "ツ", romaji: "tsu" },
  { hiragana: "て", katakana: "テ", romaji: "te" },
  { hiragana: "と", katakana: "ト", romaji: "to" },
  // N row
  { hiragana: "な", katakana: "ナ", romaji: "na" },
  { hiragana: "に", katakana: "ニ", romaji: "ni" },
  { hiragana: "ぬ", katakana: "ヌ", romaji: "nu" },
  { hiragana: "ね", katakana: "ネ", romaji: "ne" },
  { hiragana: "の", katakana: "ノ", romaji: "no" },
  // H row
  { hiragana: "は", katakana: "ハ", romaji: "ha" },
  { hiragana: "ひ", katakana: "ヒ", romaji: "hi" },
  { hiragana: "ふ", katakana: "フ", romaji: "fu" },
  { hiragana: "へ", katakana: "ヘ", romaji: "he" },
  { hiragana: "ほ", katakana: "ホ", romaji: "ho" },
  // M row
  { hiragana: "ま", katakana: "マ", romaji: "ma" },
  { hiragana: "み", katakana: "ミ", romaji: "mi" },
  { hiragana: "む", katakana: "ム", romaji: "mu" },
  { hiragana: "め", katakana: "メ", romaji: "me" },
  { hiragana: "も", katakana: "モ", romaji: "mo" },
  // Y row
  { hiragana: "や", katakana: "ヤ", romaji: "ya" },
  { hiragana: "ゆ", katakana: "ユ", romaji: "yu" },
  { hiragana: "よ", katakana: "ヨ", romaji: "yo" },
  // R row
  { hiragana: "ら", katakana: "ラ", romaji: "ra" },
  { hiragana: "り", katakana: "リ", romaji: "ri" },
  { hiragana: "る", katakana: "ル", romaji: "ru" },
  { hiragana: "れ", katakana: "レ", romaji: "re" },
  { hiragana: "ろ", katakana: "ロ", romaji: "ro" },
  // W row
  { hiragana: "わ", katakana: "ワ", romaji: "wa" },
  { hiragana: "を", katakana: "ヲ", romaji: "wo" },
  // N
  { hiragana: "ん", katakana: "ン", romaji: "n" },
];

// Combination characters (digraphs)
const combinationCharacters: Character[][] = [
  // K combinations
  [
    { hiragana: "きゃ", katakana: "キャ", romaji: "kya" },
    { hiragana: "きゅ", katakana: "キュ", romaji: "kyu" },
    { hiragana: "きょ", katakana: "キョ", romaji: "kyo" },
  ],
  // S combinations
  [
    { hiragana: "しゃ", katakana: "シャ", romaji: "sha" },
    { hiragana: "しゅ", katakana: "シュ", romaji: "shu" },
    { hiragana: "しょ", katakana: "ショ", romaji: "sho" },
  ],
  // C combinations
  [
    { hiragana: "ちゃ", katakana: "チャ", romaji: "cha" },
    { hiragana: "ちゅ", katakana: "チュ", romaji: "chu" },
    { hiragana: "ちょ", katakana: "チョ", romaji: "cho" },
  ],
  // N combinations
  [
    { hiragana: "にゃ", katakana: "ニャ", romaji: "nya" },
    { hiragana: "にゅ", katakana: "ニュ", romaji: "nyu" },
    { hiragana: "にょ", katakana: "ニョ", romaji: "nyo" },
  ],
  // H combinations
  [
    { hiragana: "ひゃ", katakana: "ヒャ", romaji: "hya" },
    { hiragana: "ひゅ", katakana: "ヒュ", romaji: "hyu" },
    { hiragana: "ひょ", katakana: "ヒョ", romaji: "hyo" },
  ],
  // M combinations
  [
    { hiragana: "みゃ", katakana: "ミャ", romaji: "mya" },
    { hiragana: "みゅ", katakana: "ミュ", romaji: "myu" },
    { hiragana: "みょ", katakana: "ミョ", romaji: "myo" },
  ],
  // R combinations
  [
    { hiragana: "りゃ", katakana: "リャ", romaji: "rya" },
    { hiragana: "りゅ", katakana: "リュ", romaji: "ryu" },
    { hiragana: "りょ", katakana: "リョ", romaji: "ryo" },
  ],
  // G combinations
  [
    { hiragana: "ぎゃ", katakana: "ギャ", romaji: "gya" },
    { hiragana: "ぎゅ", katakana: "ギュ", romaji: "gyu" },
    { hiragana: "ぎょ", katakana: "ギョ", romaji: "gyo" },
  ],
  // J combinations
  [
    { hiragana: "じゃ", katakana: "ジャ", romaji: "ja" },
    { hiragana: "じゅ", katakana: "ジュ", romaji: "ju" },
    { hiragana: "じょ", katakana: "ジョ", romaji: "jo" },
  ],
  // B combinations
  [
    { hiragana: "びゃ", katakana: "ビャ", romaji: "bya" },
    { hiragana: "びゅ", katakana: "ビュ", romaji: "byu" },
    { hiragana: "びょ", katakana: "ビョ", romaji: "byo" },
  ],
  // P combinations
  [
    { hiragana: "ぴゃ", katakana: "ピャ", romaji: "pya" },
    { hiragana: "ぴゅ", katakana: "ピュ", romaji: "pyu" },
    { hiragana: "ぴょ", katakana: "ピョ", romaji: "pyo" },
  ],
];

// Diacritics (dakuten and handakuten)
const diacriticCharacters: Character[][] = [
  // G row (ga, gi, gu, ge, go)
  [
    { hiragana: "が", katakana: "ガ", romaji: "ga" },
    { hiragana: "ぎ", katakana: "ギ", romaji: "gi" },
    { hiragana: "ぐ", katakana: "グ", romaji: "gu" },
    { hiragana: "げ", katakana: "ゲ", romaji: "ge" },
    { hiragana: "ご", katakana: "ゴ", romaji: "go" },
  ],
  // Z row (za, ji, zu, ze, zo)
  [
    { hiragana: "ざ", katakana: "ザ", romaji: "za" },
    { hiragana: "じ", katakana: "ジ", romaji: "ji" },
    { hiragana: "ず", katakana: "ズ", romaji: "zu" },
    { hiragana: "ぜ", katakana: "ゼ", romaji: "ze" },
    { hiragana: "ぞ", katakana: "ゾ", romaji: "zo" },
  ],
  // D row (da, ji, zu, de, do)
  [
    { hiragana: "だ", katakana: "ダ", romaji: "da" },
    { hiragana: "ぢ", katakana: "ヂ", romaji: "ji" },
    { hiragana: "づ", katakana: "ヅ", romaji: "zu" },
    { hiragana: "で", katakana: "デ", romaji: "de" },
    { hiragana: "ど", katakana: "ド", romaji: "do" },
  ],
  // B row (ba, bi, bu, be, bo)
  [
    { hiragana: "ば", katakana: "バ", romaji: "ba" },
    { hiragana: "び", katakana: "ビ", romaji: "bi" },
    { hiragana: "ぶ", katakana: "ブ", romaji: "bu" },
    { hiragana: "べ", katakana: "ベ", romaji: "be" },
    { hiragana: "ぼ", katakana: "ボ", romaji: "bo" },
  ],
  // P row (pa, pi, pu, pe, po)
  [
    { hiragana: "ぱ", katakana: "パ", romaji: "pa" },
    { hiragana: "ぴ", katakana: "ピ", romaji: "pi" },
    { hiragana: "ぷ", katakana: "プ", romaji: "pu" },
    { hiragana: "ぺ", katakana: "ペ", romaji: "pe" },
    { hiragana: "ぽ", katakana: "ポ", romaji: "po" },
  ],
];

export default function HiraganaKatakanaPage() {
  const isDark = useThemeStore((state) => state.isDark);
  const [selectedScript, setSelectedScript] = useState<"hiragana" | "katakana">(
    "hiragana"
  );
  const [showRomaji, setShowRomaji] = useState(true);

  return (
    <div
      className={`min-h-screen ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {selectedScript === "hiragana"
              ? "Hiragana (ひらがな)"
              : "Katakana (カタカナ)"}
          </h1>
          <p
            className={`text-lg max-w-3xl mx-auto ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {selectedScript === "hiragana"
              ? "Master the 46 basic Hiragana characters - the foundation of Japanese writing for native words and grammar."
              : "Master the 46 basic Katakana characters - used for foreign words, emphasis, and onomatopoeia."}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12">
          {/* Script Toggle */}
          <div
            className={`inline-flex rounded-lg p-1 ${
              isDark ? "bg-gray-800" : "bg-gray-200"
            }`}
          >
            <button
              onClick={() => setSelectedScript("hiragana")}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                selectedScript === "hiragana"
                  ? "bg-red-600 text-white"
                  : isDark
                  ? "text-gray-300 hover:text-white"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              Hiragana
            </button>
            <button
              onClick={() => setSelectedScript("katakana")}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                selectedScript === "katakana"
                  ? "bg-red-600 text-white"
                  : isDark
                  ? "text-gray-300 hover:text-white"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              Katakana
            </button>
          </div>

          {/* Romaji Toggle */}
          <button
            onClick={() => setShowRomaji(!showRomaji)}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              showRomaji
                ? "bg-red-600 text-white"
                : isDark
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {showRomaji ? "Hide" : "Show"} Romaji
          </button>
        </div>

        {/* Character Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-4">
          {basicCharacters.map((char, index) => (
            <div
              key={index}
              className={`rounded-xl p-4 border transition-all duration-200 hover:scale-110 hover:shadow-lg cursor-pointer ${
                isDark
                  ? "bg-gray-800 border-gray-700 hover:border-red-600"
                  : "bg-white border-gray-200 hover:border-red-400"
              }`}
            >
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2 japanese-text">
                  {selectedScript === "hiragana"
                    ? char.hiragana
                    : char.katakana}
                </div>
                {showRomaji && (
                  <div
                    className={`text-xs md:text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {char.romaji}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Diacritics Section */}
        <div className="mt-16">
          <h2
            className={`text-3xl font-bold mb-8 text-center ${
              selectedScript === "hiragana" ? "text-red-400" : "text-red-400"
            }`}
          >
            {selectedScript === "hiragana"
              ? "Hiragana with Diacritics"
              : "Katakana with Diacritics"}
          </h2>
          <div className="space-y-2">
            {diacriticCharacters.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="flex gap-2 justify-center flex-wrap"
              >
                {row.map((char, colIndex) => (
                  <div
                    key={colIndex}
                    className={`w-20 h-20 md:w-24 md:h-24 rounded-xl flex items-center justify-center transition-all duration-200 border cursor-pointer hover:scale-110 hover:shadow-lg ${
                      isDark
                        ? "bg-red-600 border-red-700 hover:border-red-500"
                        : "bg-red-500 border-red-600 hover:border-red-400"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-white japanese-text mb-1">
                        {selectedScript === "hiragana"
                          ? char.hiragana
                          : char.katakana}
                      </div>
                      {showRomaji && (
                        <div className="text-xs text-white/90">
                          {char.romaji}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Combinations Section */}
        <div className="mt-16">
          <h2
            className={`text-3xl font-bold mb-8 text-center ${
              selectedScript === "hiragana" ? "text-red-400" : "text-red-400"
            }`}
          >
            {selectedScript === "hiragana"
              ? "Hiragana Combinations (Digraphs)"
              : "Katakana Combinations (Digraphs)"}
          </h2>
          <div className="space-y-2">
            {combinationCharacters.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="flex gap-2 justify-center flex-wrap"
              >
                {row.map((char, colIndex) => (
                  <div
                    key={colIndex}
                    className={`w-20 h-20 md:w-24 md:h-24 rounded-xl flex items-center justify-center transition-all duration-200 border cursor-pointer hover:scale-110 hover:shadow-lg ${
                      isDark
                        ? "bg-red-600 border-red-700 hover:border-red-500"
                        : "bg-red-500 border-red-600 hover:border-red-400"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-white japanese-text mb-1">
                        {selectedScript === "hiragana"
                          ? char.hiragana
                          : char.katakana}
                      </div>
                      {showRomaji && (
                        <div className="text-xs text-white/90">
                          {char.romaji}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div
          className={`mt-16 p-8 rounded-2xl ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h2 className="text-2xl font-bold mb-4">
            {selectedScript === "hiragana"
              ? "About Hiragana"
              : "About Katakana"}
          </h2>
          <div
            className={`space-y-4 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            {selectedScript === "hiragana" ? (
              <>
                <p>
                  <strong>Hiragana (ひらがな)</strong> is one of the three main
                  writing systems in Japanese. It consists of 46 basic
                  characters, each representing a syllable.
                </p>
                <p>
                  <strong>Usage:</strong> Hiragana is primarily used for native
                  Japanese words, grammatical particles, verb endings, and words
                  without kanji representations.
                </p>
                <p>
                  <strong>Tips:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Learn the basic 46 characters first</li>
                  <li>Practice writing stroke order for better retention</li>
                  <li>Read children's books written entirely in hiragana</li>
                  <li>Use mnemonics to remember similar-looking characters</li>
                </ul>
              </>
            ) : (
              <>
                <p>
                  <strong>Katakana (カタカナ)</strong> is the second syllabary
                  in Japanese, also consisting of 46 basic characters with the
                  same sounds as hiragana but different shapes.
                </p>
                <p>
                  <strong>Usage:</strong> Katakana is used for foreign words,
                  loanwords, names, scientific terms, onomatopoeia, and for
                  emphasis (similar to italics in English).
                </p>
                <p>
                  <strong>Tips:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>More angular and straight compared to hiragana</li>
                  <li>Learn it after mastering hiragana</li>
                  <li>
                    Practice reading manga and game titles (often in katakana)
                  </li>
                  <li>
                    Be careful with similar characters like シ (shi) and ツ
                    (tsu)
                  </li>
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
