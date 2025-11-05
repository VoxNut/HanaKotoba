# Quick Start Script for HanaKotoba
# Run this in PowerShell

Write-Host "🌸 HanaKotoba - Japanese Learning Platform Setup 🌸" -ForegroundColor Magenta
Write-Host ""

# Check Python
Write-Host "Checking Python..." -ForegroundColor Yellow
python --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python not found! Please install Python 3.11+" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Python found" -ForegroundColor Green
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js not found! Please install Node.js 18+" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js found" -ForegroundColor Green
Write-Host ""

# Setup Backend
Write-Host "Setting up Django backend..." -ForegroundColor Cyan
Set-Location backend

if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

Write-Host "Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host "Running database migrations..." -ForegroundColor Yellow
python manage.py migrate

Write-Host ""
Write-Host "✅ Backend setup complete!" -ForegroundColor Green
Set-Location ..

# Setup Frontend
Write-Host ""
Write-Host "Setting up React frontend..." -ForegroundColor Cyan
Set-Location frontend

Write-Host "Installing Node dependencies..." -ForegroundColor Yellow
npm install

Write-Host "✅ Frontend setup complete!" -ForegroundColor Green
Set-Location ..

# Create environment files if they don't exist
Write-Host ""
Write-Host "Checking environment files..." -ForegroundColor Cyan

if (-not (Test-Path "backend\.env")) {
    Write-Host "Creating backend/.env from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" "backend\.env"
    Write-Host "⚠️  Please edit backend/.env and add your OPENAI_API_KEY" -ForegroundColor Yellow
}

if (-not (Test-Path "frontend\.env")) {
    Write-Host "Creating frontend/.env from template..." -ForegroundColor Yellow
    Copy-Item "frontend\.env.example" "frontend\.env"
}

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit backend/.env and add your OPENAI_API_KEY" -ForegroundColor White
Write-Host "2. Create a superuser: cd backend; python manage.py createsuperuser" -ForegroundColor White
Write-Host "3. Start backend: cd backend; python manage.py runserver" -ForegroundColor White
Write-Host "4. Start frontend (in new terminal): cd frontend; npm run dev" -ForegroundColor White
Write-Host "5. Visit http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "For detailed setup instructions, see SETUP.md" -ForegroundColor Gray
