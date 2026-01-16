import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";
import DashboardPage from "./pages/DashboardPage";
import FlashcardsPage from "./pages/FlashcardsPage";
import GrammarDetailPage from "./pages/GrammarDetailPage";
import GrammarPage from "./pages/GrammarPage";
import HiraganaKatakanaPage from "./pages/HiraganaKatakanaPage";
import HomePage from "./pages/HomePage";
import KanaPracticePage from "./pages/KanaPracticePage";
import KanjiGraphPage from "./pages/KanjiGraphPage";
import KanjiPage from "./pages/KanjiPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import LoginPage from "./pages/LoginPage";
import MangaReaderPage from "./pages/MangaReaderPage";
import PracticePage from "./pages/PracticePage";
import RegisterPage from "./pages/RegisterPage";
import TextToSpeechPage from "./pages/TextToSpeechPage";
import TranslationPage from "./pages/TranslationPage";
import VocabularyPage from "./pages/VocabularyPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />

        {/* Protected routes */}
        <Route element={<PrivateRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="vocabulary" element={<VocabularyPage />} />
          <Route path="grammar" element={<GrammarPage />} />
          <Route path="grammar/:slug" element={<GrammarDetailPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="flashcards" element={<FlashcardsPage />} />
          <Route path="kanji-graph/:kanji?" element={<KanjiGraphPage />} />
          <Route path="hiragana-katakana" element={<HiraganaKatakanaPage />} />
          <Route path="kana-practice" element={<KanaPracticePage />} />
          <Route path="kanji" element={<KanjiPage />} />
          <Route path="text-to-speech" element={<TextToSpeechPage />} />
          <Route path="translation" element={<TranslationPage />} />
          <Route path="manga-reader" element={<MangaReaderPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
