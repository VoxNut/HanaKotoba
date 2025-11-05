# HanaKotoba (花言葉) - Japanese Language Learning Platform

A comprehensive web-based Japanese language learning platform with AI-powered features for effective studying.

## 🌸 Features

- **Hiragana & Katakana Learning**: Interactive lessons and practice
- **Vocabulary Learning**: Build your word bank with contextual examples
- **Grammar Lessons**: Structured grammar learning from N5 to N1
- **Kanji Handwriting Recognition**: Draw kanji with your mouse for recognition
- **AI-Powered Mnemonics**: Generate memorable stories to remember kanji
- **Spaced Repetition System**: Anki-like algorithm for optimal learning
- **Daily Recommendations**: Personalized kanji and vocabulary suggestions
- **Pitch Accent Generator**: Learn proper pronunciation with AI-generated pitch patterns
- **Smart Flashcard Generator**: Auto-generate flashcards from any text input
- **Progress Tracking**: Monitor your learning journey

## 🛠️ Technology Stack

### Frontend

- React 18 with TypeScript
- Vite for fast development
- TailwindCSS for styling
- Canvas API for handwriting input
- Axios for API requests
- React Router for navigation

### Backend

- Django 4.2
- Django REST Framework
- PostgreSQL database
- OpenAI API for AI features
- TensorFlow for kanji recognition
- Celery for background tasks

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.11+
- PostgreSQL 14+
- Docker & Docker Compose (for deployment)
- OpenAI API Key (for AI features)

## 🚀 Quick Start

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a virtual environment:

```bash
python -m venv venv
```

3. Activate the virtual environment:

```bash
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

4. Install dependencies:

```bash
pip install -r requirements.txt
```

5. Create a `.env` file in the backend directory:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=postgresql://postgres:password@localhost:5432/hanakotoba
OPENAI_API_KEY=your-openai-api-key
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

6. Run migrations:

```bash
python manage.py migrate
```

7. Create a superuser:

```bash
python manage.py createsuperuser
```

8. Load initial data (optional):

```bash
python manage.py loaddata initial_data
```

9. Run the development server:

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:8000/api
```

4. Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🐳 Docker Deployment

For easy deployment that your teacher can access:

1. Make sure Docker and Docker Compose are installed

2. Create a `.env` file in the project root:

```env
SECRET_KEY=your-production-secret-key
DEBUG=False
DATABASE_URL=postgresql://postgres:password@db:5432/hanakotoba
OPENAI_API_KEY=your-openai-api-key
POSTGRES_DB=hanakotoba
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
ALLOWED_HOSTS=your-domain.com,your-ip-address
CORS_ALLOWED_ORIGINS=http://your-domain.com,http://your-ip-address
```

3. Build and run with Docker Compose:

```bash
docker-compose up -d --build
```

4. Run migrations in the container:

```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

The application will be available at `http://your-server-ip:80`

## 📚 Project Structure

```
HanaKotoba/
├── backend/                 # Django backend
│   ├── hanakotoba/         # Main project settings
│   ├── accounts/           # User authentication
│   ├── vocabulary/         # Words and kanji management
│   ├── grammar/            # Grammar lessons
│   ├── srs/                # Spaced repetition system
│   ├── ai_features/        # AI integrations
│   └── manage.py
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utility functions
│   │   └── App.tsx
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🔑 API Documentation

Once the backend is running, visit:

- API Documentation: `http://localhost:8000/api/docs/`
- Admin Panel: `http://localhost:8000/admin/`

## 🧪 Testing

### Backend Tests

```bash
cd backend
python manage.py test
```

### Frontend Tests

```bash
cd frontend
npm run test
```

## 📱 Deployment Options

### Option 1: Cloud Platforms

- **Heroku**: Easy deployment with PostgreSQL addon
- **Railway**: Modern platform with simple setup
- **DigitalOcean**: App Platform or Droplet
- **AWS**: EC2 or Elastic Beanstalk

### Option 2: VPS Deployment

- Use Docker Compose on any VPS (DigitalOcean, Linode, etc.)
- Configure nginx as reverse proxy
- Set up SSL with Let's Encrypt

### Option 3: Free Tier Options

- **Backend**: Railway, Render, or PythonAnywhere
- **Frontend**: Vercel, Netlify, or Cloudflare Pages
- **Database**: Supabase or ElephantSQL (PostgreSQL)

## 🤝 Contributing

This is a student project. Feedback and suggestions are welcome!

## 📄 License

MIT License - feel free to use this for learning purposes.

## 🙏 Acknowledgments

- Japanese language data from JMdict and KANJIDIC
- OpenAI for AI capabilities
- Anki for inspiration on spaced repetition

## 📧 Contact

For questions or feedback, please open an issue on GitHub.
