import {
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "../services/api";
import { useConfirmStore } from "../store/confirmStore";
import { useThemeStore } from "../store/themeStore";
import { useToastStore } from "../store/toastStore";

interface Card {
  id: number;
  content_type: "kanji" | "vocabulary" | "grammar" | "custom";
  object_id: number | null;
  front?: string;
  back?: string;
  hint?: string;
  tags?: string[];
  ease_factor: number;
  interval: number;
  repetitions: number;
  last_reviewed: string | null;
  next_review: string;
  total_reviews: number;
  correct_reviews: number;
  state: "new" | "learning" | "reviewing" | "mastered";
  is_suspended: boolean;
  created_at: string;
  kanji?: {
    id: number;
    character: string;
    meaning: string;
    kun_reading: string;
    on_reading: string;
  };
  vocabulary?: {
    id: number;
    word: string;
    reading: string;
    meaning: string;
    example_sentences?: Array<{ japanese: string; english: string }>;
  };
  grammar?: {
    id: number;
    title: string;
    grammar_pattern: string;
    meaning: string;
  };
}

interface Stats {
  total: number;
  new: number;
  learning: number;
  reviewing: number;
  mastered: number;
  due_today: number;
  suspended: number;
  by_type: {
    kanji: number;
    vocabulary: number;
    grammar: number;
    custom: number;
  };
}

interface ReviewCard {
  card: Card;
  showAnswer: boolean;
}

export default function FlashcardsPage() {
  const isDark = useThemeStore((state) => state.isDark);
  const addToast = useToastStore((state) => state.addToast);
  const showConfirm = useConfirmStore((state) => state.showConfirm);
  const [cards, setCards] = useState<Card[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "due" | "suspended">(
    "all"
  );
  const [filterType] = useState<string | null>(null);
  const [showCustomCardModal, setShowCustomCardModal] = useState(false);

  // Review mode state
  const [reviewMode, setReviewMode] = useState(false);
  const [currentReview, setCurrentReview] = useState<ReviewCard | null>(null);
  const [reviewQueue, setReviewQueue] = useState<Card[]>([]);
  const [reviewStartTime, setReviewStartTime] = useState<number>(0);

  // Custom card form
  const [customCardForm, setCustomCardForm] = useState({
    front: "",
    back: "",
    hint: "",
    tags: [] as string[],
  });

  useEffect(() => {
    fetchCards();
    fetchStats();
  }, [activeTab]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const includeSuspended = activeTab === "suspended" ? "true" : "false";
      const response = await api.get(
        `/srs/cards/?include_suspended=${includeSuspended}`
      );
      const cardsData = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      setCards(cardsData);
    } catch (err) {
      console.error("Error fetching cards:", err);
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
      (card) => new Date(card.next_review) <= new Date() && !card.is_suspended
    );
    if (dueCards.length > 0) {
      setReviewQueue(dueCards);
      setCurrentReview({ card: dueCards[0], showAnswer: false });
      setReviewMode(true);
      setReviewStartTime(Date.now());
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

      const nextIndex =
        reviewQueue.findIndex((c) => c.id === currentReview.card.id) + 1;
      if (nextIndex < reviewQueue.length) {
        setCurrentReview({ card: reviewQueue[nextIndex], showAnswer: false });
        setReviewStartTime(Date.now());
      } else {
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

  const handleSuspendCard = async (cardId: number, suspend: boolean) => {
    try {
      await api.post(
        `/srs/cards/${cardId}/${suspend ? "suspend" : "unsuspend"}/`
      );
      fetchCards();
      fetchStats();
      addToast(suspend ? "Card suspended" : "Card unsuspended", "success");
    } catch (err) {
      console.error("Error suspending card:", err);
      addToast(
        suspend ? "Failed to suspend card" : "Failed to unsuspend card",
        "error"
      );
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    showConfirm(
      "Are you sure you want to delete this card? This action cannot be undone.",
      async () => {
        try {
          await api.delete(`/srs/cards/${cardId}/`);
          fetchCards();
          fetchStats();
          addToast("Card deleted successfully", "success");
        } catch (err) {
          console.error("Error deleting card:", err);
          addToast("Failed to delete card", "error");
        }
      },
      "Delete Card"
    );
  };

  const handleResetCard = async (cardId: number) => {
    showConfirm(
      "Reset this card's progress? The card will return to 'new' state.",
      async () => {
        try {
          await api.post(`/srs/cards/${cardId}/reset_progress/`);
          fetchCards();
          fetchStats();
          addToast("Card progress reset successfully", "success");
        } catch (err) {
          console.error("Error resetting card:", err);
          addToast("Failed to reset card", "error");
        }
      },
      "Reset Progress"
    );
  };

  const handleResetAllDueDates = async () => {
    showConfirm(
      "Reset ALL cards to be due now? This is useful for testing the review system.",
      async () => {
        try {
          await api.post("/srs/cards/reset_all_due_dates/");
          fetchCards();
          fetchStats();
          addToast("All cards are now due for review!", "success");
        } catch (err) {
          console.error("Error resetting due dates:", err);
          addToast("Failed to reset due dates", "error");
        }
      },
      "Reset All Due Dates"
    );
  };

  const handleCreateCustomCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/srs/cards/create_custom/", customCardForm);
      setShowCustomCardModal(false);
      setCustomCardForm({ front: "", back: "", hint: "", tags: [] });
      fetchCards();
      fetchStats();
      addToast("Custom card created successfully!", "success");
    } catch (err) {
      console.error("Error creating custom card:", err);
      addToast("Failed to create custom card", "error");
    }
  };

  const filteredCards = cards.filter((card) => {
    if (activeTab === "due") {
      return new Date(card.next_review) <= new Date() && !card.is_suspended;
    }
    if (activeTab === "suspended") {
      return card.is_suspended;
    }
    if (filterType) {
      return card.content_type === filterType;
    }
    return true;
  });

  const getCardDisplayFront = (card: Card) => {
    if (card.content_type === "kanji") return card.kanji?.character || "?";
    if (card.content_type === "vocabulary") {
      const word = card.vocabulary?.word || "?";
      const example = card.vocabulary?.example_sentences?.[0]?.japanese;
      // Always show word, and add example sentence on new line if available
      return example ? `${word}\n\n${example}` : word;
    }
    if (card.content_type === "grammar")
      return card.grammar?.grammar_pattern || "?";
    return card.front || "?";
  };

  const getCardDisplayBack = (card: Card) => {
    if (card.content_type === "kanji") return card.kanji?.meaning || "";
    if (card.content_type === "vocabulary") {
      const exampleEn = card.vocabulary?.example_sentences?.[0]?.english;
      return exampleEn || card.vocabulary?.meaning || "";
    }
    if (card.content_type === "grammar") return card.grammar?.meaning || "";
    return card.back || "";
  };

  const getCardDisplayReading = (card: Card) => {
    if (card.content_type === "kanji") {
      return `${card.kanji?.kun_reading || ""} • ${
        card.kanji?.on_reading || ""
      }`;
    }
    if (card.content_type === "vocabulary")
      return card.vocabulary?.reading || "";
    return "";
  };

  // Review Mode UI
  if (reviewMode && currentReview) {
    return (
      <div
        className={`min-h-screen ${
          isDark ? "bg-gray-900" : "bg-gray-50"
        } flex items-center justify-center p-8`}
      >
        <div className="max-w-4xl w-full">
          <div className="mb-6 text-center">
            <p
              className={`text-lg ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Card{" "}
              {reviewQueue.findIndex((c) => c.id === currentReview.card.id) + 1}{" "}
              of {reviewQueue.length}
            </p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm ${
                currentReview.card.content_type === "kanji"
                  ? "bg-blue-500/20 text-blue-500"
                  : currentReview.card.content_type === "vocabulary"
                  ? "bg-green-500/20 text-green-500"
                  : currentReview.card.content_type === "grammar"
                  ? "bg-purple-500/20 text-purple-500"
                  : "bg-orange-500/20 text-orange-500"
              }`}
            >
              {currentReview.card.content_type}
            </span>
          </div>

          <div
            className={`rounded-2xl shadow-2xl p-12 min-h-[400px] flex flex-col items-center justify-center ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            {!currentReview.showAnswer ? (
              <>
                <div
                  className={`text-8xl japanese-text mb-6 whitespace-pre-line text-center ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {getCardDisplayFront(currentReview.card)}
                </div>
                {currentReview.card.hint && (
                  <p
                    className={`text-sm mb-4 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Hint: {currentReview.card.hint}
                  </p>
                )}
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
                  {getCardDisplayFront(currentReview.card)}
                </div>
                <div
                  className={`text-2xl mb-4 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {getCardDisplayBack(currentReview.card)}
                </div>
                {getCardDisplayReading(currentReview.card) && (
                  <div
                    className={`text-lg mb-8 japanese-text ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {getCardDisplayReading(currentReview.card)}
                  </div>
                )}

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
      <div className="mb-8 flex items-center justify-between">
        <div>
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
        <div className="flex gap-2">
          <button
            onClick={() => setShowCustomCardModal(true)}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Custom Card
          </button>
          <button
            onClick={handleResetAllDueDates}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              isDark
                ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
            title="Reset all cards to be due now (for testing)"
          >
            <RefreshCw size={20} />
            Test Reviews
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <StatCard
            icon={<BookOpen size={20} />}
            label="Total"
            value={stats.total}
            color="blue"
            isDark={isDark}
          />
          <StatCard
            icon={<Clock size={20} />}
            label="Due"
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
            label="Review"
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
          <StatCard
            icon={<Pause size={20} />}
            label="Suspended"
            value={stats.suspended}
            color="gray"
            isDark={isDark}
          />
        </div>
      )}

      {/* Type Filter */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div
            className={`p-4 rounded-lg ${
              isDark ? "bg-gray-800" : "bg-white"
            } border ${isDark ? "border-gray-700" : "border-gray-200"}`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Kanji
              </span>
              <span
                className={`text-xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {stats.by_type.kanji}
              </span>
            </div>
          </div>
          <div
            className={`p-4 rounded-lg ${
              isDark ? "bg-gray-800" : "bg-white"
            } border ${isDark ? "border-gray-700" : "border-gray-200"}`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Vocabulary
              </span>
              <span
                className={`text-xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {stats.by_type.vocabulary}
              </span>
            </div>
          </div>
          <div
            className={`p-4 rounded-lg ${
              isDark ? "bg-gray-800" : "bg-white"
            } border ${isDark ? "border-gray-700" : "border-gray-200"}`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Grammar
              </span>
              <span
                className={`text-xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {stats.by_type.grammar}
              </span>
            </div>
          </div>
          <div
            className={`p-4 rounded-lg ${
              isDark ? "bg-gray-800" : "bg-white"
            } border ${isDark ? "border-gray-700" : "border-gray-200"}`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Custom
              </span>
              <span
                className={`text-xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {stats.by_type.custom}
              </span>
            </div>
          </div>
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
          All Cards
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
          Due Today
        </button>
        <button
          onClick={() => setActiveTab("suspended")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === "suspended"
              ? "bg-primary-500 text-white"
              : isDark
              ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          }`}
        >
          Suspended
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
              ? "No cards due for review! 🎉"
              : activeTab === "suspended"
              ? "No suspended cards"
              : "No flashcards yet. Create some custom cards or add from Kanji/Vocabulary pages!"}
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
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    card.content_type === "kanji"
                      ? "bg-blue-500/20 text-blue-500"
                      : card.content_type === "vocabulary"
                      ? "bg-green-500/20 text-green-500"
                      : card.content_type === "grammar"
                      ? "bg-purple-500/20 text-purple-500"
                      : "bg-orange-500/20 text-orange-500"
                  }`}
                >
                  {card.content_type}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleSuspendCard(card.id, !card.is_suspended)
                    }
                    className={`p-1 rounded ${
                      card.is_suspended
                        ? "text-green-500 hover:bg-green-500/10"
                        : "text-yellow-500 hover:bg-yellow-500/10"
                    }`}
                    title={card.is_suspended ? "Unsuspend" : "Suspend"}
                  >
                    {card.is_suspended ? (
                      <Play size={16} />
                    ) : (
                      <Pause size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => handleResetCard(card.id)}
                    className="p-1 rounded text-blue-500 hover:bg-blue-500/10"
                    title="Reset progress"
                  >
                    <RefreshCw size={16} />
                  </button>
                  {card.content_type === "custom" && (
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="p-1 rounded text-red-500 hover:bg-red-500/10"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div
                className={`text-5xl japanese-text text-center mb-4 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {getCardDisplayFront(card)}
              </div>
              <div
                className={`text-center mb-4 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {getCardDisplayBack(card)}
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
                  {new Date(card.next_review).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Card Modal */}
      {showCustomCardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            className={`max-w-lg w-full rounded-lg p-6 ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h2
              className={`text-2xl font-bold mb-4 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Create Custom Card
            </h2>
            <form onSubmit={handleCreateCustomCard}>
              <div className="mb-4">
                <label
                  className={`block mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Front (Question) *
                </label>
                <textarea
                  value={customCardForm.front}
                  onChange={(e) =>
                    setCustomCardForm({
                      ...customCardForm,
                      front: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                  rows={3}
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  className={`block mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Back (Answer) *
                </label>
                <textarea
                  value={customCardForm.back}
                  onChange={(e) =>
                    setCustomCardForm({
                      ...customCardForm,
                      back: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                  rows={3}
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  className={`block mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Hint (Optional)
                </label>
                <input
                  type="text"
                  value={customCardForm.hint}
                  onChange={(e) =>
                    setCustomCardForm({
                      ...customCardForm,
                      hint: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-all"
                >
                  Create Card
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomCardModal(false);
                    setCustomCardForm({
                      front: "",
                      back: "",
                      hint: "",
                      tags: [],
                    });
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    isDark
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
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
    gray: "bg-gray-500/10 text-gray-500",
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
