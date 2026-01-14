import api from "./api";

export interface LeaderboardScore {
  id: number;
  rank: number;
  display_name: string;
  username: string;
  kana_type: "hiragana" | "katakana" | "both";
  variant_key: string; // e.g., "monographs", "monographs+diacritics", etc.
  time_seconds: number;
  time_formatted: string;
  accuracy: number;
  score: number;
  correct_answers: number;
  wrong_answers: number;
  best_streak: number;
  session_length: number;
  created_at: string;
}

export interface LeaderboardResponse {
  scores: LeaderboardScore[];
  filters: {
    kana_type: string;
    variant_key: string;
    month: string;
  };
}

export interface ScoreSubmission {
  display_name: string;
  kana_type: "hiragana" | "katakana" | "both";
  variant_key: string; // e.g., "monographs", "monographs+diacritics", etc.
  time_seconds: number;
  accuracy: number;
  correct_answers: number;
  wrong_answers: number;
  best_streak: number;
  session_length: number;
}

// Get leaderboard scores
export async function getLeaderboard(params: {
  kana_type?: string;
  variant_key?: string;
  month?: string;
}): Promise<LeaderboardResponse> {
  const queryParams = new URLSearchParams();
  if (params.kana_type) queryParams.append("kana_type", params.kana_type);
  if (params.variant_key) queryParams.append("variant_key", params.variant_key);
  if (params.month) queryParams.append("month", params.month);

  const response = await api.get<LeaderboardResponse>(
    `/ai/leaderboard/?${queryParams.toString()}`
  );
  return response.data;
}

// Submit a new score
export async function submitScore(
  data: ScoreSubmission
): Promise<LeaderboardScore> {
  const response = await api.post<LeaderboardScore>(
    "/ai/leaderboard/submit/",
    data
  );
  return response.data;
}

// Get user's own scores
export async function getMyScores(): Promise<LeaderboardScore[]> {
  const response = await api.get<LeaderboardScore[]>(
    "/ai/leaderboard/my_scores/"
  );
  return response.data;
}

// Get user's best scores per category
export async function getMyBestScores(): Promise<LeaderboardScore[]> {
  const response = await api.get<LeaderboardScore[]>(
    "/ai/leaderboard/my_best/"
  );
  return response.data;
}
