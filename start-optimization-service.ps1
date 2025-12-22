# Start the OR-Tools optimization service
Write-Host "🚀 Starting Optimization Service..." -ForegroundColor Cyan

Set-Location -Path "$PSScriptRoot\optimization-service"

# Check if Python is available
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python not found. Please install Python first." -ForegroundColor Red
    exit 1
}

# Check if requirements are installed (quick check for ortools)
try {
    python -c "import ortools" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "📦 Installing dependencies (first time only)..." -ForegroundColor Yellow
        pip install -r requirements.txt
    } else {
        Write-Host "✅ Dependencies already installed" -ForegroundColor Green
    }
} catch {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

Write-Host "🔧 Starting service on http://localhost:8000" -ForegroundColor Green
Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

python main.py
