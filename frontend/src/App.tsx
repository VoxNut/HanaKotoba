import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import VocabularyPage from "./pages/VocabularyPage";
import KanjiPage from "./pages/KanjiPage";
import GrammarPage from "./pages/GrammarPage";
import PracticePage from "./pages/PracticePage";
import FlashcardsPage from "./pages/FlashcardsPage";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<PrivateRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="vocabulary" element={<VocabularyPage />} />
          <Route path="kanji" element={<KanjiPage />} />
          <Route path="grammar" element={<GrammarPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="flashcards" element={<FlashcardsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
