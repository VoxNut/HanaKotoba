# HanaKotoba Setup Guide

## Initial Setup Steps

### 1. Install Dependencies

**Backend:**

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend:**

```powershell
cd frontend
npm install
```

### 2. Configure Environment Variables

**Backend** - Copy and edit `.env.example`:

```powershell
cd backend
copy ..\.env.example .env
```

Edit `backend/.env` with your settings:

- Set `SECRET_KEY` to a secure random string
- Add your `OPENAI_API_KEY` from https://platform.openai.com/
- Configure `DATABASE_URL` if using PostgreSQL

**Frontend** - Create `.env`:

```powershell
cd frontend
copy .env.example .env
```

### 3. Setup Database

**SQLite (Development):**

```powershell
cd backend
python manage.py migrate
python manage.py createsuperuser
```

**PostgreSQL (Production):**

1. Install PostgreSQL
2. Create database:

```sql
CREATE DATABASE hanakotoba;
CREATE USER hanakotoba_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE hanakotoba TO hanakotoba_user;
```

3. Update `DATABASE_URL` in `.env`
4. Run migrations

### 4. Run Development Servers

**Backend (Terminal 1):**

```powershell
cd backend
.\venv\Scripts\activate
python manage.py runserver
```

**Frontend (Terminal 2):**

```powershell
cd frontend
npm run dev
```

Visit: http://localhost:5173

## Features Implementation Status

✅ **Completed:**

- User authentication and registration
- Django REST API with all models
- React frontend with routing
- AI integration endpoints (OpenAI)
- Spaced Repetition System (SRS) algorithm
- Dashboard and basic pages

🚧 **To Implement:**

- Kanji handwriting recognition (TensorFlow.js model needed)
- Actual AI feature implementations (currently use OpenAI API)
- Additional frontend components for kanji drawing
- Data loading scripts for JLPT vocabulary/kanji
- Advanced SRS statistics and charts

## Getting OpenAI API Key

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste into `backend/.env`

**Note:** OpenAI API is paid. Free tier has limited credits. Consider alternatives:

- Use local LLMs (Ollama, LM Studio)
- Use other AI services (Claude, Gemini)
- Implement without AI first, add later

## Deployment Options

### Option 1: Docker (Recommended for Teachers)

```powershell
# Build and run
docker-compose up -d --build

# Access at http://your-server-ip
```

### Option 2: Free Hosting

**Backend Options:**

- Railway.app (PostgreSQL included)
- Render.com
- PythonAnywhere

**Frontend Options:**

- Vercel
- Netlify
- GitHub Pages (with API proxy)

### Option 3: VPS (DigitalOcean, Linode, etc.)

Use Docker Compose method above on your VPS.

## Next Steps

1. **Get OpenAI API Key** (or decide on AI approach)
2. **Add Japanese Data:**

   - Download JLPT vocabulary lists
   - Import kanji data
   - Add grammar points

3. **Enhance Frontend:**

   - Implement kanji drawing canvas
   - Add vocabulary lists with pagination
   - Create study statistics charts

4. **Testing:**
   - Test all features
   - Get feedback from your teacher
   - Iterate and improve

## Troubleshooting

**Import errors in Django:**

```powershell
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend build errors:**

```powershell
cd frontend
rm -rf node_modules
npm install
```

**Database errors:**

```powershell
cd backend
python manage.py migrate
```

## Resources

- Django REST Framework: https://www.django-rest-framework.org/
- React Router: https://reactrouter.com/
- TailwindCSS: https://tailwindcss.com/
- OpenAI API: https://platform.openai.com/docs/

## GitHub Repository Setup

```powershell
git init
git add .
git commit -m "Initial commit: HanaKotoba Japanese Learning Platform"
git branch -M main
git remote add origin https://github.com/yourusername/hanakotoba.git
git push -u origin main
```

Don't forget to create `.gitignore` (already included) to avoid committing:

- `venv/`
- `node_modules/`
- `.env` files
- `db.sqlite3`
