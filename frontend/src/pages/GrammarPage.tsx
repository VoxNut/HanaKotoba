import { Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeStore } from "../store/themeStore";

interface GrammarHub {
  id: string;
  title: string;
  description: string;
  color: string;
  slug?: string;
}

interface GrammarPoint {
  id: string;
  title: string;
  description: string;
  tag: string;
  tagColor: string;
  slug?: string;
}

export default function GrammarPage() {
  const isDark = useThemeStore((state) => state.isDark);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL PAGES");

  const grammarHubs: GrammarHub[] = [
    {
      id: "verb-conjugation",
      title: "VERB CONJUGATION",
      description:
        "Japanese verbs have different conjugation patterns depending on what type they are — godan, ichidan, or irregular. Learn all about verb types and conjugation on this page.",
      color: "from-orange-500 to-orange-600",
      slug: "verb-conjugation-groups",
    },
    {
      id: "transitive-intransitive",
      title: "TRANSITIVE AND INTRANSITIVE VERBS",
      description:
        "Transitive verbs describe actions that happen to something else. Intransitive verbs describe actions that happen by themselves.",
      color: "from-orange-500 to-orange-600",
      slug: "transitive-intransitive-verbs",
    },
    {
      id: "sentences-clauses",
      title: "BUILDING SENTENCES AND CLAUSES",
      description:
        "Understanding clauses will help you to break down and understand complicated sentences in Japanese.",
      color: "from-orange-500 to-orange-600",
    },
    {
      id: "plural-quantity",
      title: "PLURAL AND QUANTITY",
      description:
        "The ways we express plurality and quantity are different in Japanese and English. In Japanese, we use quantifiers, plural suffixes, and repetition words.",
      color: "from-orange-500 to-orange-600",
    },
    {
      id: "personal-pronouns",
      title: "PERSONAL PRONOUNS",
      description:
        "Personal pronouns are used to refer to people from various perspectives: the first person (I, we), the second person (you), and the third person (she, he, they).",
      color: "from-orange-500 to-orange-600",
    },
    {
      id: "numbers-counters",
      title: "NUMBERS AND COUNTERS",
      description:
        "Japanese has two ways to count. Numbers are followed by different counters, or 助数詞 (じょすうし), depending on the thing being counted.",
      color: "from-orange-500 to-orange-600",
    },
    {
      id: "nouns",
      title: "NOUNS",
      description:
        "Nouns are words that label the world around us and are used to identify things.",
      color: "from-orange-500 to-orange-600",
    },
    {
      id: "na-adjectives",
      title: "な-ADJECTIVES",
      description:
        "な-adjectives are one type of adjective in Japanese. Their main function is to describe nouns, but many can function as nouns themselves.",
      color: "from-orange-500 to-orange-600",
    },
  ];

  const grammarPoints: GrammarPoint[] = [
    {
      id: "koso-a-do",
      title: "こそあど言葉 (KO-SO-A-DO WORDS)",
      description:
        "こそあど言葉 (ko-so-a-do words) are a series of Japanese words that can be used to refer to things, people and locations. The word you choose to use mostly depends on the distance between you and whatever you're talking about.",
      tag: "",
      tagColor: "bg-gray-200 text-gray-700",
    },
    {
      id: "i-adjectives",
      title: "い-ADJECTIVES",
      description:
        "い-adjectives are one type of adjective in Japanese. Their main function is to describe nouns, and they can take different ending to change their meaning.",
      tag: "",
      tagColor: "bg-gray-200 text-gray-700",
    },
    {
      id: "date-time",
      title: "DATE AND TIME",
      description:
        "To give the date, you use 〜年 (year), 〜月 (month), 〜日 (day), and 〜曜日 (day of the week). To tell time, you use 〜時 (hour), 〜分 (minute), and 〜秒 (second).",
      tag: "SUFFIX",
      tagColor: "bg-orange-500 text-white",
    },
    {
      id: "adjective-sa",
      title: "ADJECTIVE さ (OBJECTIVE NOUNS)",
      description:
        "Adding 〜さ to an adjective turns it into a noun, and gives it the nuance that the noun is objective and measurable.",
      tag: "ADJECTIVE FORM",
      tagColor: "bg-orange-500 text-white",
    },
    {
      id: "adjective-sou",
      title: "ADJECTIVE そう",
      description:
        '〜そう can be added to adjectives to mark them as speculative, such as おいしそう = "looks delicious".',
      tag: "ADJECTIVE FORM",
      tagColor: "bg-orange-500 text-white",
    },
    {
      id: "adjective-mi",
      title: "ADJECTIVE み (SUBJECTIVE NOUNS)",
      description:
        'Adding 〜み to an adjective turns it into a noun with a subjective quality, like the "warmth" of a person or the "weight" of a decision.',
      tag: "ADJECTIVE FORM",
      tagColor: "bg-orange-500 text-white",
    },
    {
      id: "building-sentences",
      title: "BUILDING SENTENCES AND CLAUSES",
      description:
        "Understanding clauses will help you to break down and understand complicated sentences in Japanese.",
      tag: "CLAUSE",
      tagColor: "bg-orange-500 text-white",
    },
    {
      id: "command-form",
      title: "COMMAND FORM",
      description:
        "Verbs in the command form express strong orders or demands. The form changes depending on the verb type, so learn more, 読め (read it)!",
      tag: "VERB FORM",
      tagColor: "bg-orange-500 text-white",
    },
    {
      id: "particle-node",
      title: "CONJUNCTIVE PARTICLE のて",
      description:
        'Just like the English conjunction "so," のて is a conjunctive particle that explains a reason or cause. It also contains a polite feel, a...',
      tag: "PARTICLE",
      tagColor: "bg-orange-500 text-white",
    },
    {
      id: "particle-noni",
      title: "CONJUNCTIVE PARTICLE のに",
      description:
        "のに is a conjunctive particle that expresses a sense of surprise or frustration when something goes against the set expectation.",
      tag: "PARTICLE",
      tagColor: "bg-orange-500 text-white",
    },
    {
      id: "particles-ga-kedo",
      title: "CONJUNCTIVE PARTICLES が・けど",
      description:
        'Conjunctive particles が and けど are often used in a similar way to the English word "but." Additionally, they can be used to link contex...',
      tag: "PARTICLE",
      tagColor: "bg-orange-500 text-white",
    },
    {
      id: "first-person-pronouns",
      title: "FIRST-PERSON PRONOUNS",
      description:
        'First-person pronouns are words that a speaker or a writer uses when they refer to themselves, like "I" or "we" in English.',
      tag: "PRONOUN",
      tagColor: "bg-orange-500 text-white",
    },
  ];

  const filterTags = [
    "ALL PAGES",
    "ADJECTIVE FORM",
    "ADVERB",
    "CLAUSE",
    "CLAUSE LINK",
    "CONDITIONAL",
    "DEMONSTRATIVE",
    "HONORIFIC",
    "NOUN",
    "PARTICLE",
    "PHRASE",
    "PLURALITY",
    "PREFIX",
    "PRONOUN",
    "SUFFIX",
    "TRANSITIVITY",
    "UNCERTAINTY",
    "VERB",
    "VERB FORM",
    "VOCABULARY",
    "だ/です",
  ];

  const filteredPoints = grammarPoints.filter(
    (point) =>
      (selectedFilter === "ALL PAGES" || point.tag === selectedFilter) &&
      (searchQuery === "" ||
        point.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        point.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div
      className={`min-h-screen ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header with Glasses Icon */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-primary-600">Japanese Grammar</span>
          </h1>
        </div>

        {/* Grammar Hubs Section */}
        <section className="mb-16">
          <h2
            className={`text-3xl font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            GRAMMAR HUBS
          </h2>
          <p
            className={`text-lg mb-8 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            These hubs connect grammar concepts to give you a deeper
            understanding of how Japanese works. Learn the ins and outs of
            Japanese word types, conjugations and forms, and how culture affects
            communication.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {grammarHubs.map((hub) => (
              <div
                key={hub.id}
                onClick={() => hub.slug && navigate(`/grammar/${hub.slug}`)}
                className={`relative p-6 rounded-2xl border transition-all hover:scale-105 cursor-pointer ${
                  isDark
                    ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <h3
                  className={`text-xl font-bold mb-3 ${
                    isDark ? "text-orange-400" : "text-orange-600"
                  }`}
                >
                  {hub.title}
                </h3>
                <p
                  className={`text-sm ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {hub.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Grammar Points Section */}
        <section>
          <h2
            className={`text-3xl font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            GRAMMAR POINTS
          </h2>
          <p
            className={`text-lg mb-8 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            These help you grasp how to use a particular grammar point, word,
            particle, or form.
          </p>

          {/* Search Box */}
          <div className="relative mb-6">
            <Search
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            />
            <input
              type="text"
              placeholder="Type page title to search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
              }`}
            />
          </div>

          {/* Filter Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {filterTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedFilter(tag)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedFilter === tag
                    ? "bg-orange-500 text-white"
                    : isDark
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Grammar Points Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPoints.map((point) => (
              <div
                key={point.id}
                onClick={() => point.slug && navigate(`/grammar/${point.slug}`)}
                className={`p-6 rounded-2xl border transition-all hover:scale-105 cursor-pointer ${
                  isDark
                    ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <h3
                  className={`text-xl font-bold mb-3 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {point.title}
                </h3>
                <p
                  className={`text-sm mb-4 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {point.description}
                </p>
                {point.tag && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-orange-500 text-white">
                    {point.tag}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
