import { ArrowLeft, Book } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useThemeStore } from "../store/themeStore";

interface TableRow {
  [key: string]: string;
}

interface Section {
  id: string;
  type: "text" | "table" | "list" | "warning" | "example";
  title?: string;
  content?: string;
  items?: string[];
  columns?: string[];
  rows?: TableRow[];
}

interface GrammarDetailData {
  id: string;
  title: string;
  japaneseTitle?: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  introduction: string;
  quickSummary: {
    what: string;
    categories?: string[];
    why: string;
  };
  sections: Array<{
    headline: string;
    subsections: Section[];
  }>;
  relatedGrammar?: Array<{
    title: string;
    url: string;
  }>;
}

// Static data for verb-conjugation-groups
const grammarData: Record<string, GrammarDetailData> = {
  "verb-conjugation-groups": {
    id: "verb-conjugation-groups",
    title: "VERB CONJUGATION",
    subtitle:
      "Japanese verbs have different conjugation patterns depending on what type they are — godan, ichidan, or irregular. Learn all about verb types and conjugation on this page.",
    tag: "VERB FORM",
    tagColor: "bg-orange-500 text-white",
    introduction: `Japanese verbs can conjugate (that is, take a variety of endings) to express a whole range of meanings. Conjugation can show us whether a verb is in the present or past, whether it's positive or negative, and more. Before jumping into verb conjugation, though, it's helpful to become familiar with verb types.

Japanese verbs come in three types: godan verbs, ichidan verbs, and irregular verbs. You'll probably also see them go by other names in all the various learning materials out there. For example, godan verbs can be referred to as う-verbs, Group I verbs, and consonant-root verbs. Ichidan verbs are also called る-verbs, Group II verbs, and vowel-root verbs.

Whatever term you prefer, what's important is understanding how each verb type requires a different method of attaching conjugational verb endings.`,
    quickSummary: {
      what: "Verb conjugation groups determine how verbs change their form",
      categories: [
        "Godan Verbs (五段動詞) - Five-level verbs / う-verbs",
        "Ichidan Verbs (一段動詞) - One-level verbs / る-verbs",
        "Irregular Verbs (変格動詞) - する and 来る only",
      ],
      why: "Understanding verb types is essential because each requires a different conjugation pattern",
    },
    sections: [
      {
        headline: "The Basics",
        subsections: [
          {
            id: "godan-intro",
            type: "text",
            title: "Godan Verbs (五段動詞)",
            content: `Let's start off with godan verbs. Examples of verbs in this category are 読む (yomu) "to read," 書く (kaku), "to write," 話す (hanasu), "to speak," and 聞く (kiku), "to listen." Notice that each of these end in a character on the う-line of the hiragana chart when they are in the plain/dictionary form, which explains why they're often called "う-verbs" in textbooks.

As these verbs conjugate, the う-line character will shift through the five vowel sounds in the hiragana chart (あ, い, う, え, お). This is where they get the name 五段 (five-level) verbs.`,
          },
          {
            id: "godan-table",
            type: "table",
            title: "聞く Conjugation Example",
            columns: ["Hiragana Chart Line", "Japanese", "Romaji", "English"],
            rows: [
              {
                "Hiragana Chart Line": "あ /a/",
                Japanese: "聞かない",
                Romaji: "kikanai",
                English: "not listen",
              },
              {
                "Hiragana Chart Line": "い /i/",
                Japanese: "聞きます",
                Romaji: "kikimasu",
                English: "listen (polite)",
              },
              {
                "Hiragana Chart Line": "う /u/",
                Japanese: "聞く",
                Romaji: "kiku",
                English: "listen (plain)",
              },
              {
                "Hiragana Chart Line": "え /e/",
                Japanese: "聞ける",
                Romaji: "kikeru",
                English: "can listen",
              },
              {
                "Hiragana Chart Line": "お /o/",
                Japanese: "聞こう",
                Romaji: "kikou",
                English: "let's listen",
              },
            ],
          },
          {
            id: "godan-root",
            type: "text",
            content: `The "root" is the part of the verb that (almost always) remains the same when the verb is conjugated. In 聞く, the root is "kik." Since the last part of the root of these verbs are consonants like /k/, these verbs are called "consonant-root verbs."`,
          },
          {
            id: "ichidan-intro",
            type: "text",
            title: "Ichidan Verbs (一段動詞)",
            content: `The next group of verbs we'll look at is ichidan verbs. Examples of these verbs include 見る (miru), "to see," 起きる (okiru), "to wake up," 開ける (akeru), "to open," and 食べる (taberu), "to eat."

These verbs are called "る-verbs" in many Japanese textbooks because they all end in the hiragana character る. Conjugating these verbs is easy — the る ending is replaced with a new verb ending. Because only one hiragana line is involved per verb root, these verbs are called 一段 (one-level) verbs.`,
          },
          {
            id: "ichidan-table",
            type: "table",
            title: "食べる Conjugation Example",
            columns: ["Hiragana Chart Line", "Japanese", "Romaji", "English"],
            rows: [
              {
                "Hiragana Chart Line": "え /e/",
                Japanese: "食べない",
                Romaji: "tabenai",
                English: "not eat",
              },
              {
                "Hiragana Chart Line": "",
                Japanese: "食べます",
                Romaji: "tabemasu",
                English: "eat (polite)",
              },
              {
                "Hiragana Chart Line": "",
                Japanese: "食べる",
                Romaji: "taberu",
                English: "eat (plain)",
              },
              {
                "Hiragana Chart Line": "",
                Japanese: "食べられる",
                Romaji: "taberareru",
                English: "can eat",
              },
              {
                "Hiragana Chart Line": "",
                Japanese: "食べよう",
                Romaji: "tabeyou",
                English: "let's eat",
              },
            ],
          },
          {
            id: "disguised-godan",
            type: "text",
            title: "Godan Verbs Disguised as Ichidan Verbs",
            content: `Some godan verbs are not immediately recognizable as such because they end in the hiragana character る, so they appear to be ichidan verbs.

**The Trick:** If the vowel sound that comes before る is /a/, /u/, or /o/, it is **definitely** a godan verb. If the vowel sound that comes before る is /e/ or /i/, it is **probably** an ichidan verb (but there are exceptions!).`,
          },
          {
            id: "disguised-table",
            type: "table",
            columns: ["Verb Group", "Japanese", "Romaji", "English"],
            rows: [
              {
                "Verb Group": "Godan (う verb ending in る)",
                Japanese: "分かる",
                Romaji: "wakaru",
                English: "to understand",
              },
              {
                "Verb Group": "",
                Japanese: "作る",
                Romaji: "tsukuru",
                English: "to make",
              },
              {
                "Verb Group": "",
                Japanese: "折る",
                Romaji: "oru",
                English: "to fold",
              },
              {
                "Verb Group": "Ichidan (る verb)",
                Japanese: "食べる",
                Romaji: "taberu",
                English: "to eat",
              },
              {
                "Verb Group": "",
                Japanese: "起きる",
                Romaji: "okiru",
                English: "to wake up",
              },
            ],
          },
          {
            id: "common-exceptions",
            type: "warning",
            title: "Common Godan Verbs Ending in /iru/ or /eru/",
            items: [
              "いる (to need)",
              "入る (to enter)",
              "走る (to run)",
              "帰る (to return)",
              "減る (to decrease)",
              "喋る (to chat)",
            ],
          },
          {
            id: "irregular",
            type: "text",
            title: "Irregular Verbs (変格動詞)",
            content: `Out of all the verbs in Japanese, only two fall outside of the godan and ichidan verb groups: する (to do) and 来る (to come). These verbs are so common that as you learn new conjugations for them, you'll get enough practice that they will seem easy as pie.`,
          },
        ],
      },
      {
        headline: "Beyond the Basics",
        subsections: [
          {
            id: "w-sound",
            type: "text",
            title: "The Loss of the /W/ Sound",
            content: `The sounds in every language change gradually over time. In Japanese, one sound drift that occurred over the past 1000 years was the loss of the /w/ sound at the beginning of certain syllables. We still have わ /wa/, but there is no hiragana character for /wi/, /wu/, or /we/.

This affects verb conjugations, especially for verbs ending in う. Around 1000 A.D., 買う was pronounced /kawu/. This is why the negative form is 買わない (kawanai) - it still uses the /w/ sound!`,
          },
          {
            id: "w-sound-table",
            type: "table",
            title: "買う Conjugations with /w/",
            columns: ["Conjugation Form", "Japanese", "Romaji"],
            rows: [
              {
                "Conjugation Form": "Negative (Plain)",
                Japanese: "買わない",
                Romaji: "kawanai",
              },
              {
                "Conjugation Form": "Passive",
                Japanese: "買われる",
                Romaji: "kawareru",
              },
              {
                "Conjugation Form": "Causative",
                Japanese: "買わせる",
                Romaji: "kawaseru",
              },
            ],
          },
          {
            id: "onbin-intro",
            type: "text",
            title: '音便 ("Sound Convenience") in Conjugations',
            content: `There is a concept in Japanese linguistics called 音便 (onbin), which refers to changes in pronunciation that occur to make a word easier to say. Ancient Japanese speakers decided that some conjugations that begin with a /t/ sound (like the て form) were too difficult to pronounce with certain verb roots.

Three unique conjugation patterns were born from this:`,
          },
          {
            id: "onbin-double",
            type: "table",
            title: "1. Double Consonant with Small っ",
            columns: ["Verb", "Root", "Expected て Form", "Actual て Form"],
            rows: [
              {
                Verb: "買う",
                Root: "ka(w)",
                "Expected て Form": "買いて",
                "Actual て Form": "買って",
              },
              {
                Verb: "持つ",
                Root: "mot(s)",
                "Expected て Form": "持ちて",
                "Actual て Form": "持って",
              },
              {
                Verb: "降る",
                Root: "fur",
                "Expected て Form": "降りて",
                "Actual て Form": "降って",
              },
            ],
          },
          {
            id: "onbin-assimilation",
            type: "table",
            title: "2. Assimilation with ん",
            columns: ["Verb", "Root", "Expected て Form", "Actual て Form"],
            rows: [
              {
                Verb: "飲む",
                Root: "nom",
                "Expected て Form": "飲みて",
                "Actual て Form": "飲んで",
              },
              {
                Verb: "死ぬ",
                Root: "shin",
                "Expected て Form": "死にて",
                "Actual て Form": "死んで",
              },
              {
                Verb: "呼ぶ",
                Root: "yob",
                "Expected て Form": "呼びて",
                "Actual て Form": "呼んで",
              },
            ],
          },
          {
            id: "onbin-removal",
            type: "table",
            title: "3. Consonant Removal",
            columns: ["Verb", "Root", "Expected て Form", "Actual て Form"],
            rows: [
              {
                Verb: "聞く",
                Root: "kik",
                "Expected て Form": "聞きて",
                "Actual て Form": "聞いて",
              },
              {
                Verb: "急ぐ",
                Root: "isog",
                "Expected て Form": "急ぎて",
                "Actual て Form": "急いで",
              },
            ],
          },
        ],
      },
    ],
    relatedGrammar: [
      { title: "〜た (Past, Plain)", url: "/grammar/verb-past-ta-form" },
      {
        title: "〜ない (Negative, Plain)",
        url: "/grammar/verb-negative-nai-form",
      },
      { title: "て Form", url: "/grammar/te-form" },
      {
        title: "〜ている (Continuous)",
        url: "/grammar/verb-continuous-form-teiru",
      },
      { title: "〜そう (Looks Like)", url: "/grammar/verb-sou" },
      { title: "〜たい (Desire)", url: "/grammar/tai-form" },
      { title: "Command Form", url: "/grammar/verb-command-form-ro" },
      {
        title: "〜させる (Causative)",
        url: "/grammar/verb-causative-form-saseru",
      },
      { title: "〜られる (Passive)", url: "/grammar/verb-passive-form-rareru" },
    ],
  },
  "transitive-intransitive-verbs": {
    id: "transitive-intransitive-verbs",
    title: "TRANSITIVE AND INTRANSITIVE VERBS",
    subtitle:
      "Transitive verbs describe actions that happen to something else. Intransitive verbs describe actions that happen by themselves.",
    tag: "TRANSITIVITY",
    tagColor: "bg-orange-500 text-white",
    introduction: `Japanese verbs are often categorized into one of two categories — "transitive" or "intransitive". For most learners, transitivity is a concept that they encounter for the first time when studying foreign language, so you might be surprised to learn that it exists in most, if not all languages — even English! Transitivity in Japanese operates differently than in English, which is why it can be so hard to wrap your mind around. In this page, we'll explore what transitivity is, and how it differs in English and Japanese.`,
    quickSummary: {
      what: "Transitivity determines whether a verb acts on an object or not",
      categories: [
        "Transitive Verbs - Actions that happen TO something (uses を particle)",
        "Intransitive Verbs - Actions that happen BY themselves (uses が particle)",
        "Transitivity Pairs - Related verbs with both forms",
      ],
      why: "Understanding transitivity helps you choose the correct particle and verb form, making your Japanese sound natural",
    },
    sections: [
      {
        headline: "The Basics",
        subsections: [
          {
            id: "what-is-transitivity",
            type: "text",
            title: "What is transitivity?",
            content: `In linguistics, transitivity is a way to categorize verbs based on whether or not they act on a direct object. A **transitive verb** acts on a direct object (e.g., "I broke the vase"). An **intransitive verb** does not act on a direct object (e.g., "The vase broke").

In English, many verbs can be both transitive and intransitive depending on the sentence. The verb "to break" is a good example of this. In Japanese, however, most verbs are strictly either transitive or intransitive. You have to use different verbs depending on whether there is a direct object or not.`,
          },
          {
            id: "transitivity-pairs",
            type: "text",
            title: "Transitivity Pairs",
            content: `Many Japanese verbs come in transitivity pairs — two verbs that have similar meanings, but one is transitive and the other is intransitive. Learning these pairs is important because you need to use the right verb for the situation.

Here are some common transitivity pairs:`,
          },
          {
            id: "pairs-table",
            type: "table",
            columns: [
              "Transitive",
              "Trans. Meaning",
              "Intransitive",
              "Intrans. Meaning",
            ],
            rows: [
              {
                Transitive: "開ける",
                "Trans. Meaning": "to open (something)",
                Intransitive: "開く",
                "Intrans. Meaning": "to open",
              },
              {
                Transitive: "閉める",
                "Trans. Meaning": "to close (something)",
                Intransitive: "閉まる",
                "Intrans. Meaning": "to close",
              },
              {
                Transitive: "消す",
                "Trans. Meaning": "to turn off (something)",
                Intransitive: "消える",
                "Intrans. Meaning": "to turn off",
              },
              {
                Transitive: "つける",
                "Trans. Meaning": "to turn on (something)",
                Intransitive: "つく",
                "Intrans. Meaning": "to turn on",
              },
              {
                Transitive: "壊す",
                "Trans. Meaning": "to break (something)",
                Intransitive: "壊れる",
                "Intrans. Meaning": "to break",
              },
              {
                Transitive: "始める",
                "Trans. Meaning": "to begin (something)",
                Intransitive: "始まる",
                "Intrans. Meaning": "to begin",
              },
              {
                Transitive: "落とす",
                "Trans. Meaning": "to drop (something)",
                Intransitive: "落ちる",
                "Intrans. Meaning": "to fall",
              },
              {
                Transitive: "出す",
                "Trans. Meaning": "to take out (something)",
                Intransitive: "出る",
                "Intrans. Meaning": "to go out",
              },
            ],
          },
          {
            id: "particles",
            type: "text",
            title: "Particles を and が",
            content: `The biggest difference between transitive and intransitive verbs in Japanese is the particle they use:

**Transitive verbs use を:** The を particle marks the direct object — the thing that the action is being done to.

Example: ドアを開けた (I opened the door)

**Intransitive verbs use が:** The が particle marks the subject — the thing that is performing the action or experiencing the state.

Example: ドアが開いた (The door opened)

Notice how in English we can use "open" for both sentences, but in Japanese we must use different verbs (開ける vs 開く) and different particles (を vs が).`,
          },
          {
            id: "example-comparison",
            type: "table",
            title: "Transitive vs Intransitive Examples",
            columns: ["Type", "Japanese", "Romaji", "English"],
            rows: [
              {
                Type: "Transitive",
                Japanese: "私は電気をつけた。",
                Romaji: "Watashi wa denki wo tsuketa.",
                English: "I turned on the light.",
              },
              {
                Type: "Intransitive",
                Japanese: "電気がついた。",
                Romaji: "Denki ga tsuita.",
                English: "The light turned on.",
              },
              {
                Type: "Transitive",
                Japanese: "彼は窓を閉めた。",
                Romaji: "Kare wa mado wo shimeta.",
                English: "He closed the window.",
              },
              {
                Type: "Intransitive",
                Japanese: "窓が閉まった。",
                Romaji: "Mado ga shimatta.",
                English: "The window closed.",
              },
              {
                Type: "Transitive",
                Japanese: "弟が花瓶を壊した。",
                Romaji: "Otouto ga kabin wo kowashita.",
                English: "My brother broke the vase.",
              },
              {
                Type: "Intransitive",
                Japanese: "花瓶が壊れた。",
                Romaji: "Kabin ga kowareta.",
                English: "The vase broke.",
              },
            ],
          },
        ],
      },
      {
        headline: "Beyond the Basics",
        subsections: [
          {
            id: "english-vs-japanese",
            type: "text",
            title: "English vs. Japanese Transitivity",
            content: `As mentioned earlier, English verbs can often be both transitive and intransitive. Japanese is much more strict — most verbs are clearly one or the other.

In English, we might say "I opened the door" (transitive) or "The door opened" (intransitive) using the same verb "open." In Japanese, these require different verbs:
- ドアを開けた (transitive - someone opened it)
- ドアが開いた (intransitive - it opened by itself)

This distinction is important because it affects how we understand WHO or WHAT is responsible for the action.`,
          },
          {
            id: "intransitive-with-particle-wo",
            type: "text",
            title: "Intransitive Verbs with Particle を",
            content: `Here's where things get interesting: some intransitive verbs can actually use the を particle! These are special cases where を marks a place that the subject is moving through or away from, rather than marking a direct object.

Common intransitive verbs that use を include:`,
          },
          {
            id: "special-verbs",
            type: "table",
            columns: ["Category", "Verb", "Romaji", "Example"],
            rows: [
              {
                Category: "Verbs with Intention",
                Verb: "歩く",
                Romaji: "aruku (to walk)",
                Example: "道を歩く (walk along the road)",
              },
              {
                Category: "",
                Verb: "走る",
                Romaji: "hashiru (to run)",
                Example: "公園を走る (run through the park)",
              },
              {
                Category: "",
                Verb: "泳ぐ",
                Romaji: "oyogu (to swim)",
                Example: "海を泳ぐ (swim in the ocean)",
              },
              {
                Category: "Movement Verbs",
                Verb: "出る",
                Romaji: "deru (to exit)",
                Example: "家を出る (leave the house)",
              },
              {
                Category: "",
                Verb: "降りる",
                Romaji: "oriru (to get off)",
                Example: "バスを降りる (get off the bus)",
              },
              {
                Category: "",
                Verb: "渡る",
                Romaji: "wataru (to cross)",
                Example: "橋を渡る (cross the bridge)",
              },
            ],
          },
          {
            id: "movement-explanation",
            type: "text",
            content: `These verbs are still intransitive because they don't act on a direct object. The を particle here doesn't mark what's being acted upon, but rather marks the space through which the movement happens. This is an important exception to remember!`,
          },
        ],
      },
    ],
    relatedGrammar: [
      { title: "Particle を", url: "/grammar/particle-wo" },
      { title: "Particle が", url: "/grammar/particle-ga" },
      { title: "Verb Conjugation", url: "/grammar/verb-conjugation-groups" },
      {
        title: "〜ている (Continuous)",
        url: "/grammar/verb-continuous-form-teiru",
      },
      {
        title: "Causative Form 〜させる",
        url: "/grammar/verb-causative-form-saseru",
      },
      {
        title: "Passive Form 〜られる",
        url: "/grammar/verb-passive-form-rareru",
      },
    ],
  },
};

export default function GrammarDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isDark = useThemeStore((state) => state.isDark);

  const data = slug ? grammarData[slug] : null;

  if (!data) {
    return (
      <div
        className={`min-h-screen ${
          isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold">Grammar point not found</h1>
          <button
            onClick={() => navigate("/grammar")}
            className="mt-4 text-primary-600 hover:underline"
          >
            ← Back to Grammar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <button
          onClick={() => navigate("/grammar")}
          className={`flex items-center gap-2 mb-6 transition-colors ${
            isDark
              ? "text-gray-400 hover:text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Grammar
        </button>
      </div>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Book className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
          </div>
          <div className="mb-4">
            <span
              className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${data.tagColor}`}
            >
              {data.tag}
            </span>
          </div>
          <h1 className="text-5xl font-bold mb-4">{data.title}</h1>
          {data.japaneseTitle && (
            <p className="text-2xl mb-4 text-gray-600">{data.japaneseTitle}</p>
          )}
          <p
            className={`text-xl ${isDark ? "text-gray-400" : "text-gray-700"}`}
          >
            {data.subtitle}
          </p>
        </div>

        {/* Table of Contents */}
        <div
          className={`p-6 rounded-lg border mb-12 ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <h2 className="text-2xl font-bold mb-4">TABLE OF CONTENTS</h2>
          <ul className="space-y-2">
            {data.sections.map((section, idx) => (
              <li key={idx}>
                <a
                  href={`#section-${idx}`}
                  className="text-primary-600 hover:underline font-semibold"
                >
                  {section.headline}
                </a>
                {/* Show subsection titles */}
                {section.subsections.some((sub) => sub.title) && (
                  <ul className="ml-6 mt-2 space-y-1">
                    {section.subsections
                      .filter((sub) => sub.title)
                      .map((subsection, subIdx) => (
                        <li key={subIdx}>
                          <a
                            href={`#${subsection.id}`}
                            className={`text-sm hover:underline ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {subsection.title}
                          </a>
                        </li>
                      ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Introduction */}
        <div className="mb-12">
          <div className={`prose max-w-none ${isDark ? "prose-invert" : ""}`}>
            {data.introduction.split("\n\n").map((para, idx) => (
              <p
                key={idx}
                className={`text-lg leading-relaxed mb-4 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {para}
              </p>
            ))}
          </div>
        </div>

        {/* Quick Summary Box */}
        <div
          className={`p-8 rounded-lg border mb-12 ${
            isDark
              ? "bg-gradient-to-br from-orange-900/20 to-orange-800/20 border-orange-700"
              : "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
          }`}
        >
          <h2 className="text-2xl font-bold mb-4">QUICK SUMMARY</h2>
          <div className="space-y-4">
            <div>
              <strong className="text-lg">What does this grammar do?</strong>
              <p
                className={`mt-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                {data.quickSummary.what}
              </p>
            </div>
            {data.quickSummary.categories && (
              <div>
                <strong className="text-lg">Key Categories:</strong>
                <ul
                  className={`mt-2 space-y-2 list-disc list-inside ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {data.quickSummary.categories.map((cat, idx) => (
                    <li key={idx}>{cat}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <strong className="text-lg">Why is this important?</strong>
              <p
                className={`mt-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                {data.quickSummary.why}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Sections */}
        {data.sections.map((section, sectionIdx) => (
          <div key={sectionIdx} id={`section-${sectionIdx}`} className="mb-16">
            <h2 className="text-4xl font-bold mb-8 pb-4 border-b border-gray-300">
              {section.headline}
            </h2>

            {section.subsections.map((subsection, subIdx) => (
              <div key={subIdx} id={subsection.id} className="mb-8">
                {subsection.title && (
                  <h3 className="text-2xl font-bold mb-4">
                    {subsection.title}
                  </h3>
                )}

                {subsection.type === "text" && subsection.content && (
                  <div
                    className={`prose max-w-none ${
                      isDark ? "prose-invert" : ""
                    }`}
                  >
                    {subsection.content.split("\n\n").map((para, idx) => (
                      <p
                        key={idx}
                        className={`text-lg leading-relaxed mb-4 ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {para
                          .split("**")
                          .map((part, i) =>
                            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                          )}
                      </p>
                    ))}
                  </div>
                )}

                {subsection.type === "table" &&
                  subsection.columns &&
                  subsection.rows && (
                    <div className="overflow-x-auto mb-6">
                      <table
                        className={`w-full border-collapse ${
                          isDark ? "border-gray-700" : "border-gray-300"
                        }`}
                      >
                        <thead>
                          <tr
                            className={isDark ? "bg-gray-800" : "bg-gray-100"}
                          >
                            {subsection.columns.map((col, idx) => (
                              <th
                                key={idx}
                                className="border border-gray-300 px-4 py-3 text-left font-bold"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {subsection.rows.map((row, idx) => (
                            <tr
                              key={idx}
                              className={
                                idx % 2 === 0
                                  ? isDark
                                    ? "bg-gray-900"
                                    : "bg-white"
                                  : isDark
                                  ? "bg-gray-800"
                                  : "bg-gray-50"
                              }
                            >
                              {subsection.columns!.map((col, colIdx) => (
                                <td
                                  key={colIdx}
                                  className="border border-gray-300 px-4 py-3"
                                >
                                  {row[col]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                {subsection.type === "warning" && subsection.items && (
                  <div
                    className={`p-6 rounded-lg border-l-4 ${
                      isDark
                        ? "bg-yellow-900/20 border-yellow-500"
                        : "bg-yellow-50 border-yellow-500"
                    }`}
                  >
                    <ul className="space-y-2">
                      {subsection.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-yellow-600 mt-1">⚠️</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {/* Related Grammar */}
        {data.relatedGrammar && data.relatedGrammar.length > 0 && (
          <div
            className={`p-8 rounded-lg border mb-12 ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <h2 className="text-2xl font-bold mb-6">RELATED GRAMMAR POINTS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.relatedGrammar.map((item, idx) => (
                <a
                  key={idx}
                  href={item.url}
                  className={`p-4 rounded-lg border transition-all hover:scale-105 ${
                    isDark
                      ? "bg-gray-900 border-gray-700 hover:border-orange-500"
                      : "bg-gray-50 border-gray-200 hover:border-orange-500"
                  }`}
                >
                  <span className="text-primary-600 font-medium">
                    {item.title}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
