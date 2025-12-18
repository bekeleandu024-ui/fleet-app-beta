Set-Location "$PSScriptRoot\optimization-service"
Write-Host "Installing dependencies..."
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error installing dependencies. Please ensure Python is installed and added to PATH." -ForegroundColor Red
    exit
}
Write-Host "Starting Optimization Service..."
python main.py