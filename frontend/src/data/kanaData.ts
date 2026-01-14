// Complete Kana Dataset with all Hiragana and Katakana characters
// Including basic (gojūon), diacritics (dakuten/handakuten), and combinations (yōon)

export interface KanaCharacter {
  character: string;
  romaji: string[]; // Multiple valid romanizations
  type: "hiragana" | "katakana";
  category: "basic" | "dakuten" | "handakuten" | "combination";
  row: string; // For filtering by row (a, ka, sa, etc.)
}

// Basic Hiragana (46 characters)
const basicHiragana: KanaCharacter[] = [
  // Vowels (a-row)
  {
    character: "あ",
    romaji: ["a"],
    type: "hiragana",
    category: "basic",
    row: "a",
  },
  {
    character: "い",
    romaji: ["i"],
    type: "hiragana",
    category: "basic",
    row: "a",
  },
  {
    character: "う",
    romaji: ["u"],
    type: "hiragana",
    category: "basic",
    row: "a",
  },
  {
    character: "え",
    romaji: ["e"],
    type: "hiragana",
    category: "basic",
    row: "a",
  },
  {
    character: "お",
    romaji: ["o"],
    type: "hiragana",
    category: "basic",
    row: "a",
  },
  // K-row
  {
    character: "か",
    romaji: ["ka"],
    type: "hiragana",
    category: "basic",
    row: "ka",
  },
  {
    character: "き",
    romaji: ["ki"],
    type: "hiragana",
    category: "basic",
    row: "ka",
  },
  {
    character: "く",
    romaji: ["ku"],
    type: "hiragana",
    category: "basic",
    row: "ka",
  },
  {
    character: "け",
    romaji: ["ke"],
    type: "hiragana",
    category: "basic",
    row: "ka",
  },
  {
    character: "こ",
    romaji: ["ko"],
    type: "hiragana",
    category: "basic",
    row: "ka",
  },
  // S-row
  {
    character: "さ",
    romaji: ["sa"],
    type: "hiragana",
    category: "basic",
    row: "sa",
  },
  {
    character: "し",
    romaji: ["shi", "si"],
    type: "hiragana",
    category: "basic",
    row: "sa",
  },
  {
    character: "す",
    romaji: ["su"],
    type: "hiragana",
    category: "basic",
    row: "sa",
  },
  {
    character: "せ",
    romaji: ["se"],
    type: "hiragana",
    category: "basic",
    row: "sa",
  },
  {
    character: "そ",
    romaji: ["so"],
    type: "hiragana",
    category: "basic",
    row: "sa",
  },
  // T-row
  {
    character: "た",
    romaji: ["ta"],
    type: "hiragana",
    category: "basic",
    row: "ta",
  },
  {
    character: "ち",
    romaji: ["chi", "ti"],
    type: "hiragana",
    category: "basic",
    row: "ta",
  },
  {
    character: "つ",
    romaji: ["tsu", "tu"],
    type: "hiragana",
    category: "basic",
    row: "ta",
  },
  {
    character: "て",
    romaji: ["te"],
    type: "hiragana",
    category: "basic",
    row: "ta",
  },
  {
    character: "と",
    romaji: ["to"],
    type: "hiragana",
    category: "basic",
    row: "ta",
  },
  // N-row
  {
    character: "な",
    romaji: ["na"],
    type: "hiragana",
    category: "basic",
    row: "na",
  },
  {
    character: "に",
    romaji: ["ni"],
    type: "hiragana",
    category: "basic",
    row: "na",
  },
  {
    character: "ぬ",
    romaji: ["nu"],
    type: "hiragana",
    category: "basic",
    row: "na",
  },
  {
    character: "ね",
    romaji: ["ne"],
    type: "hiragana",
    category: "basic",
    row: "na",
  },
  {
    character: "の",
    romaji: ["no"],
    type: "hiragana",
    category: "basic",
    row: "na",
  },
  // H-row
  {
    character: "は",
    romaji: ["ha"],
    type: "hiragana",
    category: "basic",
    row: "ha",
  },
  {
    character: "ひ",
    romaji: ["hi"],
    type: "hiragana",
    category: "basic",
    row: "ha",
  },
  {
    character: "ふ",
    romaji: ["fu", "hu"],
    type: "hiragana",
    category: "basic",
    row: "ha",
  },
  {
    character: "へ",
    romaji: ["he"],
    type: "hiragana",
    category: "basic",
    row: "ha",
  },
  {
    character: "ほ",
    romaji: ["ho"],
    type: "hiragana",
    category: "basic",
    row: "ha",
  },
  // M-row
  {
    character: "ま",
    romaji: ["ma"],
    type: "hiragana",
    category: "basic",
    row: "ma",
  },
  {
    character: "み",
    romaji: ["mi"],
    type: "hiragana",
    category: "basic",
    row: "ma",
  },
  {
    character: "む",
    romaji: ["mu"],
    type: "hiragana",
    category: "basic",
    row: "ma",
  },
  {
    character: "め",
    romaji: ["me"],
    type: "hiragana",
    category: "basic",
    row: "ma",
  },
  {
    character: "も",
    romaji: ["mo"],
    type: "hiragana",
    category: "basic",
    row: "ma",
  },
  // Y-row
  {
    character: "や",
    romaji: ["ya"],
    type: "hiragana",
    category: "basic",
    row: "ya",
  },
  {
    character: "ゆ",
    romaji: ["yu"],
    type: "hiragana",
    category: "basic",
    row: "ya",
  },
  {
    character: "よ",
    romaji: ["yo"],
    type: "hiragana",
    category: "basic",
    row: "ya",
  },
  // R-row
  {
    character: "ら",
    romaji: ["ra"],
    type: "hiragana",
    category: "basic",
    row: "ra",
  },
  {
    character: "り",
    romaji: ["ri"],
    type: "hiragana",
    category: "basic",
    row: "ra",
  },
  {
    character: "る",
    romaji: ["ru"],
    type: "hiragana",
    category: "basic",
    row: "ra",
  },
  {
    character: "れ",
    romaji: ["re"],
    type: "hiragana",
    category: "basic",
    row: "ra",
  },
  {
    character: "ろ",
    romaji: ["ro"],
    type: "hiragana",
    category: "basic",
    row: "ra",
  },
  // W-row
  {
    character: "わ",
    romaji: ["wa"],
    type: "hiragana",
    category: "basic",
    row: "wa",
  },
  {
    character: "を",
    romaji: ["wo", "o"],
    type: "hiragana",
    category: "basic",
    row: "wa",
  },
  // N
  {
    character: "ん",
    romaji: ["n", "nn"],
    type: "hiragana",
    category: "basic",
    row: "n",
  },
];

// Basic Katakana (46 characters)
const basicKatakana: KanaCharacter[] = [
  // Vowels (a-row)
  {
    character: "ア",
    romaji: ["a"],
    type: "katakana",
    category: "basic",
    row: "a",
  },
  {
    character: "イ",
    romaji: ["i"],
    type: "katakana",
    category: "basic",
    row: "a",
  },
  {
    character: "ウ",
    romaji: ["u"],
    type: "katakana",
    category: "basic",
    row: "a",
  },
  {
    character: "エ",
    romaji: ["e"],
    type: "katakana",
    category: "basic",
    row: "a",
  },
  {
    character: "オ",
    romaji: ["o"],
    type: "katakana",
    category: "basic",
    row: "a",
  },
  // K-row
  {
    character: "カ",
    romaji: ["ka"],
    type: "katakana",
    category: "basic",
    row: "ka",
  },
  {
    character: "キ",
    romaji: ["ki"],
    type: "katakana",
    category: "basic",
    row: "ka",
  },
  {
    character: "ク",
    romaji: ["ku"],
    type: "katakana",
    category: "basic",
    row: "ka",
  },
  {
    character: "ケ",
    romaji: ["ke"],
    type: "katakana",
    category: "basic",
    row: "ka",
  },
  {
    character: "コ",
    romaji: ["ko"],
    type: "katakana",
    category: "basic",
    row: "ka",
  },
  // S-row
  {
    character: "サ",
    romaji: ["sa"],
    type: "katakana",
    category: "basic",
    row: "sa",
  },
  {
    character: "シ",
    romaji: ["shi", "si"],
    type: "katakana",
    category: "basic",
    row: "sa",
  },
  {
    character: "ス",
    romaji: ["su"],
    type: "katakana",
    category: "basic",
    row: "sa",
  },
  {
    character: "セ",
    romaji: ["se"],
    type: "katakana",
    category: "basic",
    row: "sa",
  },
  {
    character: "ソ",
    romaji: ["so"],
    type: "katakana",
    category: "basic",
    row: "sa",
  },
  // T-row
  {
    character: "タ",
    romaji: ["ta"],
    type: "katakana",
    category: "basic",
    row: "ta",
  },
  {
    character: "チ",
    romaji: ["chi", "ti"],
    type: "katakana",
    category: "basic",
    row: "ta",
  },
  {
    character: "ツ",
    romaji: ["tsu", "tu"],
    type: "katakana",
    category: "basic",
    row: "ta",
  },
  {
    character: "テ",
    romaji: ["te"],
    type: "katakana",
    category: "basic",
    row: "ta",
  },
  {
    character: "ト",
    romaji: ["to"],
    type: "katakana",
    category: "basic",
    row: "ta",
  },
  // N-row
  {
    character: "ナ",
    romaji: ["na"],
    type: "katakana",
    category: "basic",
    row: "na",
  },
  {
    character: "ニ",
    romaji: ["ni"],
    type: "katakana",
    category: "basic",
    row: "na",
  },
  {
    character: "ヌ",
    romaji: ["nu"],
    type: "katakana",
    category: "basic",
    row: "na",
  },
  {
    character: "ネ",
    romaji: ["ne"],
    type: "katakana",
    category: "basic",
    row: "na",
  },
  {
    character: "ノ",
    romaji: ["no"],
    type: "katakana",
    category: "basic",
    row: "na",
  },
  // H-row
  {
    character: "ハ",
    romaji: ["ha"],
    type: "katakana",
    category: "basic",
    row: "ha",
  },
  {
    character: "ヒ",
    romaji: ["hi"],
    type: "katakana",
    category: "basic",
    row: "ha",
  },
  {
    character: "フ",
    romaji: ["fu", "hu"],
    type: "katakana",
    category: "basic",
    row: "ha",
  },
  {
    character: "ヘ",
    romaji: ["he"],
    type: "katakana",
    category: "basic",
    row: "ha",
  },
  {
    character: "ホ",
    romaji: ["ho"],
    type: "katakana",
    category: "basic",
    row: "ha",
  },
  // M-row
  {
    character: "マ",
    romaji: ["ma"],
    type: "katakana",
    category: "basic",
    row: "ma",
  },
  {
    character: "ミ",
    romaji: ["mi"],
    type: "katakana",
    category: "basic",
    row: "ma",
  },
  {
    character: "ム",
    romaji: ["mu"],
    type: "katakana",
    category: "basic",
    row: "ma",
  },
  {
    character: "メ",
    romaji: ["me"],
    type: "katakana",
    category: "basic",
    row: "ma",
  },
  {
    character: "モ",
    romaji: ["mo"],
    type: "katakana",
    category: "basic",
    row: "ma",
  },
  // Y-row
  {
    character: "ヤ",
    romaji: ["ya"],
    type: "katakana",
    category: "basic",
    row: "ya",
  },
  {
    character: "ユ",
    romaji: ["yu"],
    type: "katakana",
    category: "basic",
    row: "ya",
  },
  {
    character: "ヨ",
    romaji: ["yo"],
    type: "katakana",
    category: "basic",
    row: "ya",
  },
  // R-row
  {
    character: "ラ",
    romaji: ["ra"],
    type: "katakana",
    category: "basic",
    row: "ra",
  },
  {
    character: "リ",
    romaji: ["ri"],
    type: "katakana",
    category: "basic",
    row: "ra",
  },
  {
    character: "ル",
    romaji: ["ru"],
    type: "katakana",
    category: "basic",
    row: "ra",
  },
  {
    character: "レ",
    romaji: ["re"],
    type: "katakana",
    category: "basic",
    row: "ra",
  },
  {
    character: "ロ",
    romaji: ["ro"],
    type: "katakana",
    category: "basic",
    row: "ra",
  },
  // W-row
  {
    character: "ワ",
    romaji: ["wa"],
    type: "katakana",
    category: "basic",
    row: "wa",
  },
  {
    character: "ヲ",
    romaji: ["wo", "o"],
    type: "katakana",
    category: "basic",
    row: "wa",
  },
  // N
  {
    character: "ン",
    romaji: ["n", "nn"],
    type: "katakana",
    category: "basic",
    row: "n",
  },
];

// Dakuten Hiragana (20 characters)
const dakutenHiragana: KanaCharacter[] = [
  // G-row
  {
    character: "が",
    romaji: ["ga"],
    type: "hiragana",
    category: "dakuten",
    row: "ga",
  },
  {
    character: "ぎ",
    romaji: ["gi"],
    type: "hiragana",
    category: "dakuten",
    row: "ga",
  },
  {
    character: "ぐ",
    romaji: ["gu"],
    type: "hiragana",
    category: "dakuten",
    row: "ga",
  },
  {
    character: "げ",
    romaji: ["ge"],
    type: "hiragana",
    category: "dakuten",
    row: "ga",
  },
  {
    character: "ご",
    romaji: ["go"],
    type: "hiragana",
    category: "dakuten",
    row: "ga",
  },
  // Z-row
  {
    character: "ざ",
    romaji: ["za"],
    type: "hiragana",
    category: "dakuten",
    row: "za",
  },
  {
    character: "じ",
    romaji: ["ji", "zi"],
    type: "hiragana",
    category: "dakuten",
    row: "za",
  },
  {
    character: "ず",
    romaji: ["zu"],
    type: "hiragana",
    category: "dakuten",
    row: "za",
  },
  {
    character: "ぜ",
    romaji: ["ze"],
    type: "hiragana",
    category: "dakuten",
    row: "za",
  },
  {
    character: "ぞ",
    romaji: ["zo"],
    type: "hiragana",
    category: "dakuten",
    row: "za",
  },
  // D-row
  {
    character: "だ",
    romaji: ["da"],
    type: "hiragana",
    category: "dakuten",
    row: "da",
  },
  {
    character: "ぢ",
    romaji: ["ji", "di", "zi"],
    type: "hiragana",
    category: "dakuten",
    row: "da",
  },
  {
    character: "づ",
    romaji: ["zu", "du"],
    type: "hiragana",
    category: "dakuten",
    row: "da",
  },
  {
    character: "で",
    romaji: ["de"],
    type: "hiragana",
    category: "dakuten",
    row: "da",
  },
  {
    character: "ど",
    romaji: ["do"],
    type: "hiragana",
    category: "dakuten",
    row: "da",
  },
  // B-row
  {
    character: "ば",
    romaji: ["ba"],
    type: "hiragana",
    category: "dakuten",
    row: "ba",
  },
  {
    character: "び",
    romaji: ["bi"],
    type: "hiragana",
    category: "dakuten",
    row: "ba",
  },
  {
    character: "ぶ",
    romaji: ["bu"],
    type: "hiragana",
    category: "dakuten",
    row: "ba",
  },
  {
    character: "べ",
    romaji: ["be"],
    type: "hiragana",
    category: "dakuten",
    row: "ba",
  },
  {
    character: "ぼ",
    romaji: ["bo"],
    type: "hiragana",
    category: "dakuten",
    row: "ba",
  },
];

// Dakuten Katakana (20 characters)
const dakutenKatakana: KanaCharacter[] = [
  // G-row
  {
    character: "ガ",
    romaji: ["ga"],
    type: "katakana",
    category: "dakuten",
    row: "ga",
  },
  {
    character: "ギ",
    romaji: ["gi"],
    type: "katakana",
    category: "dakuten",
    row: "ga",
  },
  {
    character: "グ",
    romaji: ["gu"],
    type: "katakana",
    category: "dakuten",
    row: "ga",
  },
  {
    character: "ゲ",
    romaji: ["ge"],
    type: "katakana",
    category: "dakuten",
    row: "ga",
  },
  {
    character: "ゴ",
    romaji: ["go"],
    type: "katakana",
    category: "dakuten",
    row: "ga",
  },
  // Z-row
  {
    character: "ザ",
    romaji: ["za"],
    type: "katakana",
    category: "dakuten",
    row: "za",
  },
  {
    character: "ジ",
    romaji: ["ji", "zi"],
    type: "katakana",
    category: "dakuten",
    row: "za",
  },
  {
    character: "ズ",
    romaji: ["zu"],
    type: "katakana",
    category: "dakuten",
    row: "za",
  },
  {
    character: "ゼ",
    romaji: ["ze"],
    type: "katakana",
    category: "dakuten",
    row: "za",
  },
  {
    character: "ゾ",
    romaji: ["zo"],
    type: "katakana",
    category: "dakuten",
    row: "za",
  },
  // D-row
  {
    character: "ダ",
    romaji: ["da"],
    type: "katakana",
    category: "dakuten",
    row: "da",
  },
  {
    character: "ヂ",
    romaji: ["ji", "di", "zi"],
    type: "katakana",
    category: "dakuten",
    row: "da",
  },
  {
    character: "ヅ",
    romaji: ["zu", "du"],
    type: "katakana",
    category: "dakuten",
    row: "da",
  },
  {
    character: "デ",
    romaji: ["de"],
    type: "katakana",
    category: "dakuten",
    row: "da",
  },
  {
    character: "ド",
    romaji: ["do"],
    type: "katakana",
    category: "dakuten",
    row: "da",
  },
  // B-row
  {
    character: "バ",
    romaji: ["ba"],
    type: "katakana",
    category: "dakuten",
    row: "ba",
  },
  {
    character: "ビ",
    romaji: ["bi"],
    type: "katakana",
    category: "dakuten",
    row: "ba",
  },
  {
    character: "ブ",
    romaji: ["bu"],
    type: "katakana",
    category: "dakuten",
    row: "ba",
  },
  {
    character: "ベ",
    romaji: ["be"],
    type: "katakana",
    category: "dakuten",
    row: "ba",
  },
  {
    character: "ボ",
    romaji: ["bo"],
    type: "katakana",
    category: "dakuten",
    row: "ba",
  },
];

// Handakuten Hiragana (5 characters)
const handakutenHiragana: KanaCharacter[] = [
  {
    character: "ぱ",
    romaji: ["pa"],
    type: "hiragana",
    category: "handakuten",
    row: "pa",
  },
  {
    character: "ぴ",
    romaji: ["pi"],
    type: "hiragana",
    category: "handakuten",
    row: "pa",
  },
  {
    character: "ぷ",
    romaji: ["pu"],
    type: "hiragana",
    category: "handakuten",
    row: "pa",
  },
  {
    character: "ぺ",
    romaji: ["pe"],
    type: "hiragana",
    category: "handakuten",
    row: "pa",
  },
  {
    character: "ぽ",
    romaji: ["po"],
    type: "hiragana",
    category: "handakuten",
    row: "pa",
  },
];

// Handakuten Katakana (5 characters)
const handakutenKatakana: KanaCharacter[] = [
  {
    character: "パ",
    romaji: ["pa"],
    type: "katakana",
    category: "handakuten",
    row: "pa",
  },
  {
    character: "ピ",
    romaji: ["pi"],
    type: "katakana",
    category: "handakuten",
    row: "pa",
  },
  {
    character: "プ",
    romaji: ["pu"],
    type: "katakana",
    category: "handakuten",
    row: "pa",
  },
  {
    character: "ペ",
    romaji: ["pe"],
    type: "katakana",
    category: "handakuten",
    row: "pa",
  },
  {
    character: "ポ",
    romaji: ["po"],
    type: "katakana",
    category: "handakuten",
    row: "pa",
  },
];

// Combination Hiragana (Yōon) - 33 characters
const combinationHiragana: KanaCharacter[] = [
  // K combinations
  {
    character: "きゃ",
    romaji: ["kya"],
    type: "hiragana",
    category: "combination",
    row: "kya",
  },
  {
    character: "きゅ",
    romaji: ["kyu"],
    type: "hiragana",
    category: "combination",
    row: "kya",
  },
  {
    character: "きょ",
    romaji: ["kyo"],
    type: "hiragana",
    category: "combination",
    row: "kya",
  },
  // S combinations
  {
    character: "しゃ",
    romaji: ["sha", "sya"],
    type: "hiragana",
    category: "combination",
    row: "sha",
  },
  {
    character: "しゅ",
    romaji: ["shu", "syu"],
    type: "hiragana",
    category: "combination",
    row: "sha",
  },
  {
    character: "しょ",
    romaji: ["sho", "syo"],
    type: "hiragana",
    category: "combination",
    row: "sha",
  },
  // C combinations
  {
    character: "ちゃ",
    romaji: ["cha", "tya"],
    type: "hiragana",
    category: "combination",
    row: "cha",
  },
  {
    character: "ちゅ",
    romaji: ["chu", "tyu"],
    type: "hiragana",
    category: "combination",
    row: "cha",
  },
  {
    character: "ちょ",
    romaji: ["cho", "tyo"],
    type: "hiragana",
    category: "combination",
    row: "cha",
  },
  // N combinations
  {
    character: "にゃ",
    romaji: ["nya"],
    type: "hiragana",
    category: "combination",
    row: "nya",
  },
  {
    character: "にゅ",
    romaji: ["nyu"],
    type: "hiragana",
    category: "combination",
    row: "nya",
  },
  {
    character: "にょ",
    romaji: ["nyo"],
    type: "hiragana",
    category: "combination",
    row: "nya",
  },
  // H combinations
  {
    character: "ひゃ",
    romaji: ["hya"],
    type: "hiragana",
    category: "combination",
    row: "hya",
  },
  {
    character: "ひゅ",
    romaji: ["hyu"],
    type: "hiragana",
    category: "combination",
    row: "hya",
  },
  {
    character: "ひょ",
    romaji: ["hyo"],
    type: "hiragana",
    category: "combination",
    row: "hya",
  },
  // M combinations
  {
    character: "みゃ",
    romaji: ["mya"],
    type: "hiragana",
    category: "combination",
    row: "mya",
  },
  {
    character: "みゅ",
    romaji: ["myu"],
    type: "hiragana",
    category: "combination",
    row: "mya",
  },
  {
    character: "みょ",
    romaji: ["myo"],
    type: "hiragana",
    category: "combination",
    row: "mya",
  },
  // R combinations
  {
    character: "りゃ",
    romaji: ["rya"],
    type: "hiragana",
    category: "combination",
    row: "rya",
  },
  {
    character: "りゅ",
    romaji: ["ryu"],
    type: "hiragana",
    category: "combination",
    row: "rya",
  },
  {
    character: "りょ",
    romaji: ["ryo"],
    type: "hiragana",
    category: "combination",
    row: "rya",
  },
  // G combinations
  {
    character: "ぎゃ",
    romaji: ["gya"],
    type: "hiragana",
    category: "combination",
    row: "gya",
  },
  {
    character: "ぎゅ",
    romaji: ["gyu"],
    type: "hiragana",
    category: "combination",
    row: "gya",
  },
  {
    character: "ぎょ",
    romaji: ["gyo"],
    type: "hiragana",
    category: "combination",
    row: "gya",
  },
  // J combinations
  {
    character: "じゃ",
    romaji: ["ja", "jya", "zya"],
    type: "hiragana",
    category: "combination",
    row: "ja",
  },
  {
    character: "じゅ",
    romaji: ["ju", "jyu", "zyu"],
    type: "hiragana",
    category: "combination",
    row: "ja",
  },
  {
    character: "じょ",
    romaji: ["jo", "jyo", "zyo"],
    type: "hiragana",
    category: "combination",
    row: "ja",
  },
  // B combinations
  {
    character: "びゃ",
    romaji: ["bya"],
    type: "hiragana",
    category: "combination",
    row: "bya",
  },
  {
    character: "びゅ",
    romaji: ["byu"],
    type: "hiragana",
    category: "combination",
    row: "bya",
  },
  {
    character: "びょ",
    romaji: ["byo"],
    type: "hiragana",
    category: "combination",
    row: "bya",
  },
  // P combinations
  {
    character: "ぴゃ",
    romaji: ["pya"],
    type: "hiragana",
    category: "combination",
    row: "pya",
  },
  {
    character: "ぴゅ",
    romaji: ["pyu"],
    type: "hiragana",
    category: "combination",
    row: "pya",
  },
  {
    character: "ぴょ",
    romaji: ["pyo"],
    type: "hiragana",
    category: "combination",
    row: "pya",
  },
];

// Combination Katakana (Yōon) - 33 characters
const combinationKatakana: KanaCharacter[] = [
  // K combinations
  {
    character: "キャ",
    romaji: ["kya"],
    type: "katakana",
    category: "combination",
    row: "kya",
  },
  {
    character: "キュ",
    romaji: ["kyu"],
    type: "katakana",
    category: "combination",
    row: "kya",
  },
  {
    character: "キョ",
    romaji: ["kyo"],
    type: "katakana",
    category: "combination",
    row: "kya",
  },
  // S combinations
  {
    character: "シャ",
    romaji: ["sha", "sya"],
    type: "katakana",
    category: "combination",
    row: "sha",
  },
  {
    character: "シュ",
    romaji: ["shu", "syu"],
    type: "katakana",
    category: "combination",
    row: "sha",
  },
  {
    character: "ショ",
    romaji: ["sho", "syo"],
    type: "katakana",
    category: "combination",
    row: "sha",
  },
  // C combinations
  {
    character: "チャ",
    romaji: ["cha", "tya"],
    type: "katakana",
    category: "combination",
    row: "cha",
  },
  {
    character: "チュ",
    romaji: ["chu", "tyu"],
    type: "katakana",
    category: "combination",
    row: "cha",
  },
  {
    character: "チョ",
    romaji: ["cho", "tyo"],
    type: "katakana",
    category: "combination",
    row: "cha",
  },
  // N combinations
  {
    character: "ニャ",
    romaji: ["nya"],
    type: "katakana",
    category: "combination",
    row: "nya",
  },
  {
    character: "ニュ",
    romaji: ["nyu"],
    type: "katakana",
    category: "combination",
    row: "nya",
  },
  {
    character: "ニョ",
    romaji: ["nyo"],
    type: "katakana",
    category: "combination",
    row: "nya",
  },
  // H combinations
  {
    character: "ヒャ",
    romaji: ["hya"],
    type: "katakana",
    category: "combination",
    row: "hya",
  },
  {
    character: "ヒュ",
    romaji: ["hyu"],
    type: "katakana",
    category: "combination",
    row: "hya",
  },
  {
    character: "ヒョ",
    romaji: ["hyo"],
    type: "katakana",
    category: "combination",
    row: "hya",
  },
  // M combinations
  {
    character: "ミャ",
    romaji: ["mya"],
    type: "katakana",
    category: "combination",
    row: "mya",
  },
  {
    character: "ミュ",
    romaji: ["myu"],
    type: "katakana",
    category: "combination",
    row: "mya",
  },
  {
    character: "ミョ",
    romaji: ["myo"],
    type: "katakana",
    category: "combination",
    row: "mya",
  },
  // R combinations
  {
    character: "リャ",
    romaji: ["rya"],
    type: "katakana",
    category: "combination",
    row: "rya",
  },
  {
    character: "リュ",
    romaji: ["ryu"],
    type: "katakana",
    category: "combination",
    row: "rya",
  },
  {
    character: "リョ",
    romaji: ["ryo"],
    type: "katakana",
    category: "combination",
    row: "rya",
  },
  // G combinations
  {
    character: "ギャ",
    romaji: ["gya"],
    type: "katakana",
    category: "combination",
    row: "gya",
  },
  {
    character: "ギュ",
    romaji: ["gyu"],
    type: "katakana",
    category: "combination",
    row: "gya",
  },
  {
    character: "ギョ",
    romaji: ["gyo"],
    type: "katakana",
    category: "combination",
    row: "gya",
  },
  // J combinations
  {
    character: "ジャ",
    romaji: ["ja", "jya", "zya"],
    type: "katakana",
    category: "combination",
    row: "ja",
  },
  {
    character: "ジュ",
    romaji: ["ju", "jyu", "zyu"],
    type: "katakana",
    category: "combination",
    row: "ja",
  },
  {
    character: "ジョ",
    romaji: ["jo", "jyo", "zyo"],
    type: "katakana",
    category: "combination",
    row: "ja",
  },
  // B combinations
  {
    character: "ビャ",
    romaji: ["bya"],
    type: "katakana",
    category: "combination",
    row: "bya",
  },
  {
    character: "ビュ",
    romaji: ["byu"],
    type: "katakana",
    category: "combination",
    row: "bya",
  },
  {
    character: "ビョ",
    romaji: ["byo"],
    type: "katakana",
    category: "combination",
    row: "bya",
  },
  // P combinations
  {
    character: "ピャ",
    romaji: ["pya"],
    type: "katakana",
    category: "combination",
    row: "pya",
  },
  {
    character: "ピュ",
    romaji: ["pyu"],
    type: "katakana",
    category: "combination",
    row: "pya",
  },
  {
    character: "ピョ",
    romaji: ["pyo"],
    type: "katakana",
    category: "combination",
    row: "pya",
  },
];

// Export all kana
export const ALL_HIRAGANA: KanaCharacter[] = [
  ...basicHiragana,
  ...dakutenHiragana,
  ...handakutenHiragana,
  ...combinationHiragana,
];

export const ALL_KATAKANA: KanaCharacter[] = [
  ...basicKatakana,
  ...dakutenKatakana,
  ...handakutenKatakana,
  ...combinationKatakana,
];

export const ALL_KANA: KanaCharacter[] = [...ALL_HIRAGANA, ...ALL_KATAKANA];

// Export by category for filtering
export const BASIC_HIRAGANA = basicHiragana;
export const BASIC_KATAKANA = basicKatakana;
export const DAKUTEN_HIRAGANA = dakutenHiragana;
export const DAKUTEN_KATAKANA = dakutenKatakana;
export const HANDAKUTEN_HIRAGANA = handakutenHiragana;
export const HANDAKUTEN_KATAKANA = handakutenKatakana;
export const COMBINATION_HIRAGANA = combinationHiragana;
export const COMBINATION_KATAKANA = combinationKatakana;

// Variant selection interface (imported from gameUtils would cause circular dep)
interface VariantSelection {
  monographs: boolean;
  diacritics: boolean;
  digraphs: boolean;
}

// Helper function to get kana by multiple variant selections (GoKana-style)
// Supports "both" mode for combined hiragana + katakana
export function getKanaByVariants(
  type: "hiragana" | "katakana" | "both",
  variants: VariantSelection
): KanaCharacter[] {
  let pool: KanaCharacter[] = [];

  const addHiragana = type === "hiragana" || type === "both";
  const addKatakana = type === "katakana" || type === "both";

  if (addHiragana) {
    if (variants.monographs) pool = [...pool, ...basicHiragana];
    if (variants.diacritics)
      pool = [...pool, ...dakutenHiragana, ...handakutenHiragana];
    if (variants.digraphs) pool = [...pool, ...combinationHiragana];
  }

  if (addKatakana) {
    if (variants.monographs) pool = [...pool, ...basicKatakana];
    if (variants.diacritics)
      pool = [...pool, ...dakutenKatakana, ...handakutenKatakana];
    if (variants.digraphs) pool = [...pool, ...combinationKatakana];
  }

  // If nothing selected, default to monographs
  if (pool.length === 0) {
    if (addHiragana && addKatakana) {
      return [...basicHiragana, ...basicKatakana];
    }
    return type === "hiragana" ? basicHiragana : basicKatakana;
  }

  return pool;
}

// Helper function to get kana by difficulty (legacy)
export function getKanaByDifficulty(
  type: "hiragana" | "katakana" | "mixed",
  difficulty: "beginner" | "intermediate" | "advanced"
): KanaCharacter[] {
  let hiraganaPool: KanaCharacter[] = [];
  let katakanaPool: KanaCharacter[] = [];

  switch (difficulty) {
    case "beginner":
      hiraganaPool = basicHiragana;
      katakanaPool = basicKatakana;
      break;
    case "intermediate":
      hiraganaPool = [
        ...basicHiragana,
        ...dakutenHiragana,
        ...handakutenHiragana,
      ];
      katakanaPool = [
        ...basicKatakana,
        ...dakutenKatakana,
        ...handakutenKatakana,
      ];
      break;
    case "advanced":
      hiraganaPool = ALL_HIRAGANA;
      katakanaPool = ALL_KATAKANA;
      break;
  }

  switch (type) {
    case "hiragana":
      return hiraganaPool;
    case "katakana":
      return katakanaPool;
    case "mixed":
      return [...hiraganaPool, ...katakanaPool];
  }
}

// Statistics
export const KANA_STATS = {
  totalHiragana: ALL_HIRAGANA.length, // 104
  totalKatakana: ALL_KATAKANA.length, // 104
  totalKana: ALL_KANA.length, // 208
  basicCount: basicHiragana.length + basicKatakana.length, // 92
  dakutenCount: dakutenHiragana.length + dakutenKatakana.length, // 40
  handakutenCount: handakutenHiragana.length + handakutenKatakana.length, // 10
  combinationCount: combinationHiragana.length + combinationKatakana.length, // 66
};
