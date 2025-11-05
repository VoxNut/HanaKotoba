# HanaKotoba - Project Structure

## Overview

```
HanaKotoba/
├── backend/              # Django REST API
│   ├── hanakotoba/      # Project settings
│   ├── accounts/        # User authentication & profiles
│   ├── vocabulary/      # Vocabulary & Kanji management
│   ├── grammar/         # Grammar points
│   ├── srs/             # Spaced Repetition System
│   ├── ai_features/     # AI integrations
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/            # React TypeScript app
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Route pages
│   │   ├── services/    # API calls
│   │   ├── store/       # State management (Zustand)
│   │   ├── hooks/       # Custom React hooks
│   │   ├── utils/       # Helper functions
│   │   └── types/       # TypeScript definitions
│   ├── package.json
│   └── Dockerfile
│
├── .github/
│   └── copilot-instructions.md
├── docker-compose.yml
├── README.md
├── SETUP.md
└── .gitignore
```

## Backend Architecture

### Django Apps

**accounts/** - User Management

- Custom User model with Japanese level tracking
- User profiles with learning preferences
- JWT authentication
- Study streak tracking

**vocabulary/** - Word & Kanji Database

- Kanji model (character, readings, meaning, JLPT level)
- Vocabulary model (word, reading, meaning, examples)
- UserKanji & UserVocabulary for progress tracking
- Mnemonic storage (user & AI generated)

**grammar/** - Grammar Points

- Grammar patterns by JLPT level
- Examples and usage notes
- User progress tracking

**srs/** - Spaced Repetition System

- Card model with SM-2 algorithm
- Review sessions tracking
- Daily recommendations
- Due cards calculation

**ai_features/** - AI Integration

- Kanji recognition from drawings
- Mnemonic generation (OpenAI)
- Pitch accent generation
- Flashcard auto-generation
- Recognition history tracking

### API Endpoints

```
/api/auth/
  - POST /login/
  - POST /register/
  - POST /refresh/
  - GET  /users/me/

/api/vocabulary/
  - GET/POST  /kanji/
  - GET/POST  /words/
  - GET/POST  /mnemonics/
  - GET/POST  /my-vocabulary/
  - GET/POST  /my-kanji/

/api/grammar/
  - GET/POST  /points/
  - GET/POST  /my-grammar/

/api/srs/
  - GET/POST  /cards/
  - GET       /cards/due_today/
  - POST      /cards/{id}/review/
  - GET/POST  /sessions/
  - GET       /recommendations/today/

/api/ai/
  - POST /features/recognize_kanji/
  - POST /features/generate_mnemonic/
  - POST /features/generate_pitch_accent/
  - POST /features/generate_flashcards/
  - GET/POST /flashcard-sets/
```

## Frontend Architecture

### React Components

**Layout Components:**

- `Layout.tsx` - Main layout with navbar
- `PrivateRoute.tsx` - Protected route wrapper

**Pages:**

- `HomePage.tsx` - Landing page
- `LoginPage.tsx` - Login form
- `RegisterPage.tsx` - Registration form
- `DashboardPage.tsx` - User dashboard with stats
- `VocabularyPage.tsx` - Browse vocabulary
- `KanjiPage.tsx` - Kanji learning & drawing
- `GrammarPage.tsx` - Grammar lessons
- `PracticePage.tsx` - SRS review
- `FlashcardsPage.tsx` - Flashcard management

### State Management

**Zustand Stores:**

- `authStore` - User authentication state
- Future: `srsStore`, `vocabularyStore`, etc.

### Services

- `api.ts` - Axios instance with auth interceptors
- `auth.ts` - Authentication API calls
- Future: `vocabulary.ts`, `srs.ts`, `ai.ts`

## Database Models

### Key Relationships

```
User (1) ─── (*) UserVocabulary ─── (1) Vocabulary
User (1) ─── (*) UserKanji ─── (1) Kanji
User (1) ─── (*) UserGrammar ─── (1) GrammarPoint
User (1) ─── (*) Card (SRS)
User (1) ─── (*) ReviewSession
User (1) ─── (*) KanjiMnemonic ─── (1) Kanji
User (1) ─── (*) FlashcardSet
```

## Technology Stack Details

**Backend:**

- Django 4.2
- Django REST Framework
- PostgreSQL (production) / SQLite (dev)
- OpenAI API
- JWT Authentication
- Celery (for background tasks)

**Frontend:**

- React 18
- TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- React Router (routing)
- Zustand (state)
- Axios (HTTP client)
- TanStack Query (server state)

**Deployment:**

- Docker & Docker Compose
- Nginx (reverse proxy)
- Gunicorn (WSGI server)

## Development Workflow

1. **Backend Development:**

   ```powershell
   cd backend
   .\venv\Scripts\activate
   python manage.py runserver
   ```

2. **Frontend Development:**

   ```powershell
   cd frontend
   npm run dev
   ```

3. **Database Migrations:**

   ```powershell
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **Creating Superuser:**

   ```powershell
   python manage.py createsuperuser
   ```

5. **Admin Panel:**
   http://localhost:8000/admin/

6. **API Documentation:**
   http://localhost:8000/api/docs/

## Future Enhancements

- [ ] Real kanji recognition with TensorFlow.js
- [ ] Audio pronunciation for words
- [ ] Gamification (badges, levels, leaderboards)
- [ ] Social features (share mnemonics, compete)
- [ ] Mobile app (React Native)
- [ ] Offline mode (PWA)
- [ ] Advanced analytics dashboard
- [ ] Custom study plans
- [ ] Import/export Anki decks
