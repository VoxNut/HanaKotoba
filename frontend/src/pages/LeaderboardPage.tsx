import {
  Clock,
  Crown,
  Flame,
  Gamepad2,
  Home,
  Medal,
  RefreshCw,
  Target,
  Trophy,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getLeaderboard,
  getMyBestScores,
  LeaderboardScore,
} from "../services/leaderboardService";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import {
  getVariantKey,
  loadSettings,
  saveSettings,
  VariantSelection,
} from "../utils/gameUtils";

type KanaType = "hiragana" | "katakana" | "both";

export default function LeaderboardPage() {
  const isDark = useThemeStore((state) => state.isDark);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [scores, setScores] = useState<LeaderboardScore[]>([]);
  const [myBestScores, setMyBestScores] = useState<LeaderboardScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters (GoKana-style with multi-select variants)
  const [kanaType, setKanaType] = useState<KanaType>("hiragana");
  const [variants, setVariants] = useState<VariantSelection>({
    monographs: true,
    diacritics: false,
    digraphs: false,
  });

  // Toggle variant selection (at least one must be selected)
  const toggleVariant = (variant: "monographs" | "diacritics" | "digraphs") => {
    const newVariants = { ...variants };
    newVariants[variant] = !newVariants[variant];

    // Ensure at least one is selected
    if (
      !newVariants.monographs &&
      !newVariants.diacritics &&
      !newVariants.digraphs
    ) {
      return;
    }

    setVariants(newVariants);
  };

  // Fetch leaderboard
  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const variantKey = getVariantKey(variants);
      const params: { kana_type?: string; variant_key?: string } = {
        kana_type: kanaType,
        variant_key: variantKey,
      };

      const response = await getLeaderboard(params);
      setScores(response.scores);
    } catch {
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's best scores
  const fetchMyBest = async () => {
    if (!user) return;
    try {
      const best = await getMyBestScores();
      setMyBestScores(best);
    } catch {
      // Silent fail for best scores
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kanaType, variants]);

  useEffect(() => {
    fetchMyBest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle "Play this combination" button
  const handlePlayCombination = () => {
    const currentSettings = loadSettings();
    const newSettings = {
      ...currentSettings,
      mode: kanaType,
      variants: variants,
      sessionLength: 0, // All characters
    };
    saveSettings(newSettings as any);
    navigate("/kana-practice");
  };

  // Get rank icon
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return null;
  };

  // Get row styling based on rank
  const getRowStyle = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) {
      return isDark
        ? "bg-primary-900/30 border-l-4 border-primary-500"
        : "bg-primary-100 border-l-4 border-primary-500";
    }
    if (rank === 1) {
      return isDark
        ? "bg-yellow-900/20 border-l-4 border-yellow-400"
        : "bg-yellow-50 border-l-4 border-yellow-400";
    }
    if (rank === 2) {
      return isDark
        ? "bg-gray-700/30 border-l-4 border-gray-400"
        : "bg-gray-100 border-l-4 border-gray-400";
    }
    if (rank === 3) {
      return isDark
        ? "bg-amber-900/20 border-l-4 border-amber-600"
        : "bg-amber-50 border-l-4 border-amber-600";
    }
    return "";
  };

  // Get variant label for display
  const getVariantDisplay = () => {
    const variantKey = getVariantKey(variants);
    const parts = variantKey.split("+");
    if (parts.length === 1)
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    if (parts.length === 3) return "All variants";
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" + ");
  };

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? "bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-b from-pink-50 via-white to-gray-50"
      }`}
    >
      {/* Header */}
      <div
        className={`${
          isDark ? "bg-gray-800/50" : "bg-white/80"
        } backdrop-blur-sm border-b ${
          isDark ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1
              className={`text-2xl font-bold tracking-wider ${
                isDark ? "text-white" : "text-gray-900"
              }`}
              style={{ fontFamily: "monospace" }}
            >
              <span className="text-primary-500">LEADER</span>
              <span className="text-yellow-500">BOARD</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/kana-practice"
              className={`p-2 rounded-lg flex items-center gap-2 ${
                isDark
                  ? "hover:bg-gray-700 text-gray-400"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <Gamepad2 className="w-5 h-5" />
            </Link>
            <Link
              to="/"
              className={`p-2 rounded-lg ${
                isDark
                  ? "hover:bg-gray-700 text-gray-400"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <Home className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Description */}
        <div className="text-center mb-6">
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>
            Showing high scores for {kanaType} with{" "}
            {getVariantDisplay().toLowerCase()} only.
          </p>
          <p
            className={`text-sm mt-1 ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            Leaderboards are reset monthly.
          </p>
        </div>

        {/* Filters */}
        <div
          className={`rounded-2xl p-4 mb-6 ${
            isDark ? "bg-gray-800/50" : "bg-white shadow-lg"
          }`}
        >
          {/* Kana Type Tabs */}
          <div className="flex justify-center mb-4">
            <div
              className={`inline-flex rounded-xl p-1 ${
                isDark ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              {(["hiragana", "katakana", "both"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setKanaType(type)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                    kanaType === type
                      ? "bg-primary-500 text-white shadow-lg"
                      : isDark
                      ? "text-gray-400 hover:text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {type === "hiragana"
                    ? "Hiragana"
                    : type === "katakana"
                    ? "Katakana"
                    : "Both"}
                </button>
              ))}
            </div>
          </div>

          {/* Variant Tabs (GoKana-style - Multiple Selection) */}
          <div className="flex flex-col items-center gap-2">
            <p
              className={`text-xs ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Select one or more variants
            </p>
            <div
              className={`inline-flex rounded-xl p-1 gap-1 ${
                isDark ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              {(["monographs", "diacritics", "digraphs"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => toggleVariant(v)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                    variants[v]
                      ? "bg-primary-500 text-white shadow-lg"
                      : isDark
                      ? "text-gray-400 hover:text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {v === "monographs"
                    ? "Monographs"
                    : v === "diacritics"
                    ? "Diacritics"
                    : "Digraphs"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div
          className={`rounded-2xl overflow-hidden ${
            isDark ? "bg-gray-800/50" : "bg-white shadow-lg"
          }`}
        >
          {/* Table Header */}
          <div
            className={`grid grid-cols-12 gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wider ${
              isDark
                ? "bg-gray-700/50 text-gray-400"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <div className="col-span-2 text-center">Rank</div>
            <div className="col-span-4">Name</div>
            <div className="col-span-3 text-center flex items-center justify-center gap-1">
              <Clock className="w-4 h-4" />
              Time
            </div>
            <div className="col-span-3 text-center flex items-center justify-center gap-1">
              <Target className="w-4 h-4" />%
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="p-8 text-center">
              <RefreshCw
                className={`w-8 h-8 mx-auto animate-spin ${
                  isDark ? "text-gray-500" : "text-gray-400"
                }`}
              />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-8 text-center">
              <p className="text-red-500">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && scores.length === 0 && (
            <div className="p-8 text-center">
              <Trophy
                className={`w-16 h-16 mx-auto mb-4 ${
                  isDark ? "text-gray-600" : "text-gray-300"
                }`}
              />
              <p
                className={`text-lg ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                No scores yet!
              </p>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Be the first to set a high score.
              </p>
              <Link
                to="/kana-practice"
                className="mt-4 inline-block px-6 py-3 bg-primary-500 text-white rounded-xl font-medium"
              >
                Play Now
              </Link>
            </div>
          )}

          {/* Scores List */}
          {!loading && !error && scores.length > 0 && (
            <div className="divide-y divide-gray-700/30">
              {scores.map((score) => {
                const isCurrentUser = user?.username === score.username;
                return (
                  <div
                    key={score.id}
                    className={`grid grid-cols-12 gap-2 px-4 py-3 items-center transition-all ${getRowStyle(
                      score.rank,
                      isCurrentUser
                    )} ${isDark ? "hover:bg-gray-700/30" : "hover:bg-gray-50"}`}
                  >
                    {/* Rank */}
                    <div className="col-span-2 text-center flex items-center justify-center gap-2">
                      {getRankIcon(score.rank)}
                      <span
                        className={`font-bold ${
                          score.rank <= 3
                            ? score.rank === 1
                              ? "text-yellow-400"
                              : score.rank === 2
                              ? "text-gray-300"
                              : "text-amber-600"
                            : isDark
                            ? "text-gray-400"
                            : "text-gray-600"
                        }`}
                      >
                        {score.rank}.
                      </span>
                    </div>

                    {/* Name */}
                    <div className="col-span-4 flex items-center gap-2">
                      {isCurrentUser && (
                        <User className="w-4 h-4 text-primary-500" />
                      )}
                      <span
                        className={`font-mono font-bold tracking-wider ${
                          isCurrentUser
                            ? "text-primary-500"
                            : isDark
                            ? "text-white"
                            : "text-gray-900"
                        }`}
                      >
                        {score.display_name}
                      </span>
                    </div>

                    {/* Time */}
                    <div
                      className={`col-span-3 text-center font-mono ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {score.time_formatted}
                    </div>

                    {/* Accuracy */}
                    <div
                      className={`col-span-3 text-center font-bold ${
                        score.accuracy === 100
                          ? "text-green-500"
                          : score.accuracy >= 90
                          ? "text-blue-500"
                          : score.accuracy >= 80
                          ? "text-yellow-500"
                          : "text-orange-500"
                      }`}
                    >
                      {score.accuracy}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My Best Scores */}
        {user && myBestScores.length > 0 && (
          <div
            className={`mt-8 rounded-2xl p-6 ${
              isDark ? "bg-gray-800/50" : "bg-white shadow-lg"
            }`}
          >
            <h3
              className={`text-xl font-semibold mb-4 flex items-center gap-2 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              <Flame className="w-5 h-5 text-orange-500" />
              Your Best Scores
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {myBestScores.map((score) => (
                <div
                  key={score.id}
                  className={`p-4 rounded-xl ${
                    isDark ? "bg-gray-700/50" : "bg-gray-100"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        score.kana_type === "hiragana"
                          ? "bg-pink-500/20 text-pink-500"
                          : score.kana_type === "katakana"
                          ? "bg-blue-500/20 text-blue-500"
                          : "bg-purple-500/20 text-purple-500"
                      }`}
                    >
                      {score.kana_type} / {score.variant_key}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div
                        className={`text-2xl font-bold font-mono ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {score.time_formatted}
                      </div>
                      <div
                        className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {score.accuracy}% accuracy
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-primary-500 font-bold">
                        {score.score} pts
                      </div>
                      <div
                        className={`text-xs ${
                          isDark ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        {score.best_streak} streak
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Play Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handlePlayCombination}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:scale-105"
          >
            <Gamepad2 className="w-5 h-5" />
            Play this combination →
          </button>
        </div>
      </div>
    </div>
  );
}
