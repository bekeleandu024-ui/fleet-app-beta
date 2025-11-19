# Distance Calculation System - Setup Script
# Run this script to set up the distance calculation system

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Distance Calculation System Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check dependencies
Write-Host "Step 1: Checking dependencies..." -ForegroundColor Yellow
Write-Host ""

$hasNode = Get-Command node -ErrorAction SilentlyContinue
if (-not $hasNode) {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js found: $(node --version)" -ForegroundColor Green

$hasPsql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $hasPsql) {
    Write-Host "⚠️  PostgreSQL client (psql) not found. You'll need to run the migration manually." -ForegroundColor Yellow
} else {
    Write-Host "✅ PostgreSQL client found" -ForegroundColor Green
}

# Step 2: Install npm packages
Write-Host ""
Write-Host "Step 2: Installing required npm packages..." -ForegroundColor Yellow
Write-Host ""

$packages = @("axios", "pg")
$needsInstall = $false

foreach ($package in $packages) {
    $installed = npm list $package 2>&1 | Select-String $package
    if (-not $installed) {
        $needsInstall = $true
        Write-Host "  - $package needs to be installed" -ForegroundColor Yellow
    } else {
        Write-Host "  ✅ $package already installed" -ForegroundColor Green
    }
}

if ($needsInstall) {
    Write-Host ""
    $install = Read-Host "Install missing packages? (Y/n)"
    if ($install -ne "n") {
        npm install axios pg
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Packages installed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to install packages" -ForegroundColor Red
            exit 1
        }
    }
}

# Step 3: Database migration
Write-Host ""
Write-Host "Step 3: Database Migration" -ForegroundColor Yellow
Write-Host ""

if ($hasPsql) {
    Write-Host "Database connection details needed:" -ForegroundColor Cyan
    $dbHost = Read-Host "Database host (default: localhost)"
    if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "localhost" }
    
    $dbName = Read-Host "Database name (default: fleet_management)"
    if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "fleet_management" }
    
    $dbUser = Read-Host "Database user (default: postgres)"
    if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "postgres" }
    
    Write-Host ""
    $runMigration = Read-Host "Run database migration now? (Y/n)"
    
    if ($runMigration -ne "n") {
        Write-Host "Running migration..." -ForegroundColor Yellow
        $migrationFile = "services\tracking\src\db\migrations\002_add_distance_fields.sql"
        
        if (Test-Path $migrationFile) {
            $env:PGPASSWORD = Read-Host "Database password" -AsSecureString | ConvertFrom-SecureString -AsPlainText
            psql -h $dbHost -U $dbUser -d $dbName -f $migrationFile
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Migration completed successfully" -ForegroundColor Green
            } else {
                Write-Host "❌ Migration failed" -ForegroundColor Red
                Write-Host "You can run it manually later with:" -ForegroundColor Yellow
                Write-Host "  psql -h $dbHost -U $dbUser -d $dbName -f $migrationFile" -ForegroundColor White
            }
        } else {
            Write-Host "❌ Migration file not found: $migrationFile" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  Skipped migration. Run manually with:" -ForegroundColor Yellow
        Write-Host "  psql -h $dbHost -U $dbUser -d $dbName -f services\tracking\src\db\migrations\002_add_distance_fields.sql" -ForegroundColor White
    }
} else {
    Write-Host "⚠️  PostgreSQL client not found. Run migration manually:" -ForegroundColor Yellow
    Write-Host "  psql -U postgres -d fleet_management -f services\tracking\src\db\migrations\002_add_distance_fields.sql" -ForegroundColor White
}

# Step 4: Environment variables
Write-Host ""
Write-Host "Step 4: Environment Configuration" -ForegroundColor Yellow
Write-Host ""

$envFile = ".env"
$envExists = Test-Path $envFile

if ($envExists) {
    Write-Host "✅ .env file exists" -ForegroundColor Green
    $showEnv = Read-Host "View required environment variables? (Y/n)"
    if ($showEnv -ne "n") {
        Write-Host ""
        Write-Host "Required environment variables:" -ForegroundColor Cyan
        Write-Host "  DB_HOST=localhost" -ForegroundColor White
        Write-Host "  DB_PORT=5432" -ForegroundColor White
        Write-Host "  DB_NAME=fleet_management" -ForegroundColor White
        Write-Host "  DB_USER=postgres" -ForegroundColor White
        Write-Host "  DB_PASSWORD=your_password" -ForegroundColor White
        Write-Host ""
        Write-Host "Optional (for paid APIs):" -ForegroundColor Cyan
        Write-Host "  GOOGLE_MAPS_API_KEY=your_key" -ForegroundColor White
        Write-Host "  MAPBOX_API_KEY=your_key" -ForegroundColor White
        Write-Host "  TOMTOM_API_KEY=your_key" -ForegroundColor White
    }
} else {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
    $createEnv = Read-Host "Create .env file with database settings? (Y/n)"
    
    if ($createEnv -ne "n") {
        Write-Host ""
        $dbHost = Read-Host "DB_HOST (default: localhost)"
        if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "localhost" }
        
        $dbPort = Read-Host "DB_PORT (default: 5432)"
        if ([string]::IsNullOrWhiteSpace($dbPort)) { $dbPort = "5432" }
        
        $dbName = Read-Host "DB_NAME (default: fleet_management)"
        if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "fleet_management" }
        
        $dbUser = Read-Host "DB_USER (default: postgres)"
        if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "postgres" }
        
        $dbPassword = Read-Host "DB_PASSWORD"
        
        $envContent = @"
# Database Configuration
DB_HOST=$dbHost
DB_PORT=$dbPort
DB_NAME=$dbName
DB_USER=$dbUser
DB_PASSWORD=$dbPassword

# Optional - API Keys (not required - OSRM works FREE without any keys!)
# GOOGLE_MAPS_API_KEY=your_google_key_here
# MAPBOX_API_KEY=your_mapbox_key_here
# TOMTOM_API_KEY=your_tomtom_key_here

# Optional - Custom OSRM endpoint
# OSRM_ENDPOINT=https://your-osrm-server.com
"@
        
        $envContent | Out-File -FilePath $envFile -Encoding utf8
        Write-Host "✅ .env file created" -ForegroundColor Green
    }
}

# Step 5: Run tests
Write-Host ""
Write-Host "Step 5: Testing" -ForegroundColor Yellow
Write-Host ""

$runTests = Read-Host "Run test suite to verify installation? (Y/n)"
if ($runTests -ne "n") {
    Write-Host ""
    Write-Host "Running distance service tests..." -ForegroundColor Yellow
    Write-Host ""
    
    node services\distance-service.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Basic test passed" -ForegroundColor Green
        Write-Host ""
        
        $runFull = Read-Host "Run comprehensive test suite? (Y/n)"
        if ($runFull -ne "n") {
            node services\tests\distance-service.test.js
        }
    } else {
        Write-Host "⚠️  Test failed. Check error messages above." -ForegroundColor Yellow
    }
}

# Summary
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Calculate missing distances for existing trips:" -ForegroundColor White
Write-Host "   curl -X POST http://localhost:3000/api/distance/missing/calculate" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Test with your Guelph → Buffalo example:" -ForegroundColor White
Write-Host "   curl 'http://localhost:3000/api/distance/calculate?origin=Guelph,ON,Canada&destination=Buffalo,NY,USA'" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. View cache statistics:" -ForegroundColor White
Write-Host "   curl http://localhost:3000/api/distance/cache" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Read the documentation:" -ForegroundColor White
Write-Host "   - DISTANCE_SYSTEM_README.md (start here)" -ForegroundColor Cyan
Write-Host "   - DISTANCE_QUICK_REFERENCE.md (commands)" -ForegroundColor Cyan
Write-Host "   - DISTANCE_CALCULATION_GUIDE.md (full guide)" -ForegroundColor Cyan
Write-Host ""

Write-Host "Need help? Check DISTANCE_SYSTEM_README.md or run:" -ForegroundColor Yellow
Write-Host "  node services\examples\usage-examples.js" -ForegroundColor Cyan
Write-Host ""
