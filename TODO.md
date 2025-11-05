# TODO - Next Steps for HanaKotoba Development

## ✅ Completed

- [x] Project structure setup
- [x] Django backend with all models
- [x] React frontend with routing
- [x] User authentication (JWT)
- [x] Basic pages and components
- [x] API endpoints structure
- [x] Docker configuration
- [x] Documentation

## 🚀 Immediate Next Steps

### 1. Get Your API Key

- [ ] Sign up at https://platform.openai.com/
- [ ] Get your API key
- [ ] Add it to `backend/.env`:
  ```
  OPENAI_API_KEY=sk-your-key-here
  ```

### 2. Initial Setup

- [ ] Run setup script: `./setup.ps1`
- [ ] Create Django superuser
- [ ] Test backend: Visit http://localhost:8000/admin/
- [ ] Test frontend: Visit http://localhost:5173/

### 3. Add Initial Data

You need to populate your database with Japanese learning content:

**Kanji Data:**

- [ ] Download JLPT kanji lists
- [ ] Create management command to import kanji
- [ ] Add stroke order data

**Vocabulary Data:**

- [ ] Download JLPT vocabulary lists
- [ ] Create import script for vocabulary
- [ ] Add example sentences

**Grammar Data:**

- [ ] Collect grammar points by JLPT level
- [ ] Create import script
- [ ] Add usage examples

**Resources:**

- JLPT data: http://www.tanos.co.uk/jlpt/
- Kanji data: https://github.com/davidluzgouveia/kanji-data
- JMdict: https://www.edrdg.org/jmdict/j_jmdict.html

### 4. Implement Frontend Features

**High Priority:**

- [ ] Kanji drawing canvas component
  - Use HTML5 Canvas API
  - Capture mouse/touch events
  - Send drawing data to AI API
- [ ] Vocabulary list with filters
  - JLPT level filter
  - Search functionality
  - Pagination
- [ ] SRS Practice page
  - Show due cards
  - Review interface
  - Track answers (correct/incorrect)
- [ ] Dashboard with real stats
  - Charts (use Recharts)
  - Study streak display
  - Progress indicators

**Medium Priority:**

- [ ] Grammar lesson viewer
- [ ] Flashcard creation interface
- [ ] User settings page
- [ ] Progress tracking charts

**Low Priority:**

- [ ] Dark mode
- [ ] Mobile responsive improvements
- [ ] Keyboard shortcuts
- [ ] Sound effects

### 5. Enhance AI Features

**Kanji Recognition:**

- [ ] Research TensorFlow.js models for kanji
- [ ] Train or use pre-trained model
- [ ] Integrate with frontend canvas
- [ ] Test accuracy

**Alternatives to OpenAI:**

- [ ] Consider local LLMs (Ollama, LM Studio)
- [ ] Use free tier AI services
- [ ] Implement basic features without AI first

### 6. Testing & Refinement

- [ ] Test user registration/login flow
- [ ] Test SRS algorithm with real data
- [ ] Test AI features
- [ ] Get feedback from your teacher
- [ ] Fix bugs and improve UX

### 7. Deployment Preparation

**For Teacher Access:**

- [ ] Choose hosting platform (Railway, Render, DigitalOcean)
- [ ] Set up production database (PostgreSQL)
- [ ] Configure environment variables
- [ ] Set DEBUG=False in production
- [ ] Add proper ALLOWED_HOSTS
- [ ] Set up SSL certificate
- [ ] Test deployment

**Docker Deployment:**

- [ ] Build Docker images
- [ ] Test with docker-compose
- [ ] Deploy to server
- [ ] Configure domain (optional)

### 8. GitHub Setup

- [ ] Initialize git repository
- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Write good commit messages
- [ ] Add GitHub Actions (optional CI/CD)

```powershell
git init
git add .
git commit -m "Initial commit: HanaKotoba Japanese Learning Platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/hanakotoba.git
git push -u origin main
```

## 📚 Learning Resources

### Django & DRF

- Official Django Tutorial: https://docs.djangoproject.com/
- DRF Tutorial: https://www.django-rest-framework.org/tutorial/quickstart/

### React & TypeScript

- React Docs: https://react.dev/
- TypeScript Handbook: https://www.typescriptlang.org/docs/

### Japanese Data

- JMdict (词典): https://www.edrdg.org/jmdict/j_jmdict.html
- KANJIDIC2: https://www.edrdg.org/wiki/index.php/KANJIDIC_Project
- Tatoeba (example sentences): https://tatoeba.org/

### AI/ML

- TensorFlow.js: https://www.tensorflow.org/js
- OpenAI API: https://platform.openai.com/docs/

## 🐛 Common Issues & Solutions

**Backend Issues:**

```powershell
# Module not found errors
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt

# Database errors
python manage.py migrate --run-syncdb

# Permission errors
python manage.py createsuperuser
```

**Frontend Issues:**

```powershell
# Package errors
cd frontend
rm -rf node_modules package-lock.json
npm install

# Build errors
npm run build

# Lint errors
npm run lint -- --fix
```

**CORS Issues:**

- Check `CORS_ALLOWED_ORIGINS` in `backend/hanakotoba/settings.py`
- Ensure frontend URL is in the list

**API Connection Issues:**

- Check `VITE_API_URL` in `frontend/.env`
- Verify backend is running on correct port
- Check browser network tab for errors

## 💡 Tips for Success

1. **Start Small:** Implement one feature at a time
2. **Test Often:** Test each feature before moving to next
3. **Use Git:** Commit frequently with clear messages
4. **Read Docs:** When stuck, check official documentation
5. **Ask for Help:** Use Stack Overflow, Reddit, Discord
6. **Stay Organized:** Follow the project structure
7. **Have Fun:** This is a learning project!

## 🎯 Minimum Viable Product (MVP)

To show your teacher, focus on these core features:

1. ✅ User registration/login
2. 📝 Basic vocabulary browsing
3. 🎴 Simple flashcard review (SRS)
4. 📊 Basic progress tracking
5. 🎨 Kanji drawing (even basic recognition)
6. 🧠 One AI feature (like mnemonic generation)

Don't try to implement everything at once!

## 📅 Suggested Timeline

**Week 1:**

- Setup and initial data import
- Basic frontend improvements
- Test with dummy data

**Week 2:**

- Implement SRS review system
- Add vocabulary browsing
- Dashboard with stats

**Week 3:**

- Kanji drawing feature
- AI mnemonic generation
- Testing and bug fixes

**Week 4:**

- Deployment preparation
- Final testing
- Demo to teacher

Good luck with your project! 🌸
