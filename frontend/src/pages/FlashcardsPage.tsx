import {
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "../services/api";
import { useThemeStore } from "../store/themeStore";

interface Card {
  id: number;
  content_type: string;
  object_id: number;
  ease_factor: number;
  interval: number;
  repetitions: number;
  last_reviewed: string | null;
  next_review: string;
  total_reviews: number;
  correct_reviews: number;
  state: "new" | "learning" | "reviewing" | "mastered";
  created_at: string;
}

interface Kanji {
  id: number;
  character: string;
  meaning: string;
  kun_reading: string;
  on_reading: string;
}

interface CardWithKanji extends Card {
  kanji?: Kanji;
}

interface Stats {
  total: number;
  new: number;
  learning: number;
  reviewing: number;
  mastered: number;
  due_today: number;
}

interface ReviewCard {
  card: CardWithKanji;
  showAnswer: boolean;
}

export default function FlashcardsPage() {
  const isDark = useThemeStore((state) => state.isDark);
  const [cards, setCards] = useState<CardWithKanji[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "due" | "review">("all");

  // Review mode state
  const [reviewMode, setReviewMode] = useState(false);
  const [currentReview, setCurrentReview] = useState<ReviewCard | null>(null);
  const [reviewQueue, setReviewQueue] = useState<CardWithKanji[]>([]);
  const [reviewStartTime, setReviewStartTime] = useState<number>(0);

  useEffect(() => {
    fetchCards();
    fetchStats();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      console.log("Fetching cards from /srs/cards/");
      const response = await api.get("/srs/cards/");
      console.log("API Response:", response);
      console.log("Cards data:", response.data);

      // Handle paginated response from DRF
      const cardsData = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      console.log("Processed cards array:", cardsData);

      // Fetch kanji details for each card
      const cardsWithKanji = await Promise.all(
        cardsData.map(async (card: Card) => {
          if (card.content_type === "kanji") {
            try {
              const kanjiResponse = await api.get(
                `/vocabulary/kanji/${card.object_id}/`
              );
              return { ...card, kanji: kanjiResponse.data };
            } catch (err) {
              console.error("Error fetching kanji:", err);
              return card;
            }
          }
          return card;
        })
      );

      console.log("Cards with kanji:", cardsWithKanji);
      setCards(cardsWithKanji);
    } catch (err) {
      console.error("Error fetching cards:", err);
      console.error("Error details:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/srs/cards/stats/");
      setStats(response.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const startReview = () => {
    const dueCards = cards.filter(
      (card) => new Date(card.next_review) <= new Date()
    );
    console.log(
      "Starting review with",
      dueCards.length,
      "due cards out of",
      cards.length,
      "total cards"
    );
    console.log("Due cards:", dueCards);
    if (dueCards.length > 0) {
      setReviewQueue(dueCards);
      setCurrentReview({ card: dueCards[0], showAnswer: false });
      setReviewMode(true);
      setReviewStartTime(Date.now());
    } else {
      console.log("No cards are due for review");
    }
  };

  const handleReview = async (quality: number) => {
    if (!currentReview) return;

    try {
      const timeSpent = Math.floor((Date.now() - reviewStartTime) / 1000);
      await api.post(`/srs/cards/${currentReview.card.id}/review/`, {
        quality,
        time_spent_seconds: timeSpent,
      });

      // Move to next card
      const nextIndex =
        reviewQueue.findIndex((c) => c.id === currentReview.card.id) + 1;
      if (nextIndex < reviewQueue.length) {
        setCurrentReview({ card: reviewQueue[nextIndex], showAnswer: false });
        setReviewStartTime(Date.now());
      } else {
        // Review session complete
        setReviewMode(false);
        setCurrentReview(null);
        setReviewQueue([]);
        fetchCards();
        fetchStats();
      }
    } catch (err) {
      console.error("Error reviewing card:", err);
    }
  };

  const getFilteredCards = () => {
    if (activeTab === "due") {
      return cards.filter((card) => new Date(card.next_review) <= new Date());
    }
    return cards;
  };

  const filteredCards = getFilteredCards();

  if (reviewMode && currentReview) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="max-w-2xl w-full mx-4">
          {/* Progress */}
          <div className="mb-6 text-center">
            <p
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Card{" "}
              {reviewQueue.findIndex((c) => c.id === currentReview.card.id) + 1}{" "}
              of {reviewQueue.length}
            </p>
          </div>

          {/* Flashcard */}
          <div
            className={`rounded-2xl shadow-2xl p-12 min-h-[400px] flex flex-col items-center justify-center ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            {!currentReview.showAnswer ? (
              <>
                <div
                  className={`text-8xl japanese-text mb-6 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {currentReview.card.kanji?.character}
                </div>
                <button
                  onClick={() =>
                    setCurrentReview({ ...currentReview, showAnswer: true })
                  }
                  className="mt-8 px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-all"
                >
                  Show Answer
                </button>
              </>
            ) : (
              <>
                <div
                  className={`text-6xl japanese-text mb-4 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {currentReview.card.kanji?.character}
                </div>
                <div
                  className={`text-2xl mb-4 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {currentReview.card.kanji?.meaning}
                </div>
                <div
                  className={`text-lg mb-8 japanese-text ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {currentReview.card.kanji?.kun_reading} •{" "}
                  {currentReview.card.kanji?.on_reading}
                </div>

                {/* Quality buttons */}
                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => handleReview(1)}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all"
                  >
                    Again
                  </button>
                  <button
                    onClick={() => handleReview(3)}
                    className="px-6 py-3 bg-primary-400 hover:bg-primary-500 text-white rounded-lg font-medium transition-all"
                  >
                    Hard
                  </button>
                  <button
                    onClick={() => handleReview(4)}
                    className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-all"
                  >
                    Good
                  </button>
                  <button
                    onClick={() => handleReview(5)}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all"
                  >
                    Easy
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Exit Review */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setReviewMode(false);
                setCurrentReview(null);
                setReviewQueue([]);
              }}
              className={`text-sm ${
                isDark
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Exit Review
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1
          className={`text-3xl font-bold mb-2 flex items-center gap-3 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          <BookOpen size={32} className="text-primary-500" />
          Flashcards
        </h1>
        <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Practice with spaced repetition system
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            icon={<BookOpen size={20} />}
            label="Total"
            value={stats.total}
            color="blue"
            isDark={isDark}
          />
          <StatCard
            icon={<Clock size={20} />}
            label="Due Today"
            value={stats.due_today}
            color="red"
            isDark={isDark}
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="New"
            value={stats.new}
            color="green"
            isDark={isDark}
          />
          <StatCard
            icon={<Brain size={20} />}
            label="Learning"
            value={stats.learning}
            color="yellow"
            isDark={isDark}
          />
          <StatCard
            icon={<Target size={20} />}
            label="Reviewing"
            value={stats.reviewing}
            color="purple"
            isDark={isDark}
          />
          <StatCard
            icon={<CheckCircle2 size={20} />}
            label="Mastered"
            value={stats.mastered}
            color="emerald"
            isDark={isDark}
          />
        </div>
      )}

      {/* Review Button */}
      {stats && stats.due_today > 0 && (
        <button
          onClick={startReview}
          className="w-full mb-6 px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium text-lg transition-all flex items-center justify-center gap-3"
        >
          <Target size={24} />
          Start Review ({stats.due_today} cards due)
        </button>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === "all"
              ? "bg-primary-500 text-white"
              : isDark
              ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          }`}
        >
          All Cards ({cards.length})
        </button>
        <button
          onClick={() => setActiveTab("due")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === "due"
              ? "bg-primary-500 text-white"
              : isDark
              ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          }`}
        >
          Due Today (
          {cards.filter((c) => new Date(c.next_review) <= new Date()).length})
        </button>
      </div>

      {/* Cards List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      ) : filteredCards.length === 0 ? (
        <div
          className={`text-center py-12 rounded-lg ${
            isDark ? "bg-gray-800" : "bg-gray-100"
          }`}
        >
          <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
            {activeTab === "due"
              ? "No cards due for review! Great job! ✨"
              : "No flashcards yet. Add some kanji from the Kanji page!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className={`p-6 rounded-lg transition-all ${
                isDark
                  ? "bg-gray-800 hover:bg-gray-750"
                  : "bg-white hover:bg-gray-50"
              } border ${isDark ? "border-gray-700" : "border-gray-200"}`}
            >
              <div
                className={`text-5xl japanese-text text-center mb-4 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {card.kanji?.character}
              </div>
              <div
                className={`text-center mb-4 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {card.kanji?.meaning}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span
                  className={`px-3 py-1 rounded-full ${
                    card.state === "new"
                      ? "bg-green-500/20 text-green-500"
                      : card.state === "learning"
                      ? "bg-yellow-500/20 text-yellow-500"
                      : card.state === "reviewing"
                      ? "bg-blue-500/20 text-blue-500"
                      : "bg-purple-500/20 text-purple-500"
                  }`}
                >
                  {card.state}
                </span>
                <span
                  className={`${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  Next: {new Date(card.next_review).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  isDark,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  isDark: boolean;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-500",
    red: "bg-red-500/10 text-red-500",
    green: "bg-green-500/10 text-green-500",
    yellow: "bg-yellow-500/10 text-yellow-500",
    purple: "bg-purple-500/10 text-purple-500",
    emerald: "bg-emerald-500/10 text-emerald-500",
  };

  return (
    <div
      className={`p-4 rounded-lg ${
        isDark ? "bg-gray-800" : "bg-white"
      } border ${isDark ? "border-gray-700" : "border-gray-200"}`}
    >
      <div
        className={`${colorClasses[color]} w-10 h-10 rounded-lg flex items-center justify-center mb-2`}
      >
        {icon}
      </div>
      <div
        className={`text-2xl font-bold ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        {value}
      </div>
      <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        {label}
      </div>
    </div>
  );
}
