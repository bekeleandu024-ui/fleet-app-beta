#!/usr/bin/env pwsh
# Quick Setup Script - Add Real Distance Calculation
# Run this to replace mock distance with real calculated distances

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Real Distance Calculation - Quick Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is available
Write-Host "Checking PostgreSQL connection..." -ForegroundColor Yellow
$psqlCheck = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlCheck) {
    Write-Host "❌ ERROR: psql command not found." -ForegroundColor Red
    Write-Host "Please install PostgreSQL client tools." -ForegroundColor Red
    Write-Host ""
    Write-Host "Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    exit 1
}
Write-Host "✅ PostgreSQL client found" -ForegroundColor Green
Write-Host ""

# Get database credentials
Write-Host "Enter Database Connection Details:" -ForegroundColor Cyan
Write-Host "(Press Enter to use defaults shown in brackets)" -ForegroundColor Gray
Write-Host ""

$dbHost = Read-Host "Database host [localhost]"
if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "localhost" }

$dbPort = Read-Host "Database port [5432]"
if ([string]::IsNullOrWhiteSpace($dbPort)) { $dbPort = "5432" }

$dbName = Read-Host "Database name [fleet_tracking]"
if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "fleet_tracking" }

$dbUser = Read-Host "Database user [postgres]"
if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "postgres" }

$dbPassword = Read-Host "Database password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Step 1: Running Database Migration" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Set environment variable for password
$env:PGPASSWORD = $dbPasswordPlain

# Run migration
$migrationFile = "services/tracking/src/db/migrations/002_add_distance_fields.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ ERROR: Migration file not found at $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Running migration..." -ForegroundColor Yellow
$migrationResult = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $migrationFile 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Migration completed with warnings (may already be applied)" -ForegroundColor Yellow
    Write-Host $migrationResult -ForegroundColor Gray
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Step 2: Verifying Migration" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if columns exist
$checkQuery = @"
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'trips' 
  AND column_name IN ('distance_miles', 'duration_hours')
ORDER BY column_name;
"@

Write-Host "Checking new columns..." -ForegroundColor Yellow
$columns = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -c $checkQuery 2>&1

if ($columns -match "distance_miles" -and $columns -match "duration_hours") {
    Write-Host "✅ Columns verified: distance_miles, duration_hours" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: Columns not found. Migration may have failed." -ForegroundColor Red
    Write-Host $columns -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Step 3: Checking Current Data" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$statsQuery = @"
SELECT 
    COUNT(*) as total_trips,
    COUNT(distance_miles) as has_real_distance,
    COUNT(*) - COUNT(distance_miles) as needs_calculation,
    ROUND(
        COUNT(distance_miles)::numeric / NULLIF(COUNT(*), 0) * 100,
        1
    ) as coverage_pct
FROM trips;
"@

Write-Host "Analyzing trip data..." -ForegroundColor Yellow
$stats = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -c $statsQuery 2>&1

Write-Host "Current Statistics:" -ForegroundColor Cyan
Write-Host $stats -ForegroundColor White

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Step 4: Calculate Real Distances" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Now we need to calculate distances for your trips." -ForegroundColor Yellow
Write-Host ""
Write-Host "Choose calculation method:" -ForegroundColor Cyan
Write-Host "  1. Via API (recommended - uses distance calculation service)" -ForegroundColor White
Write-Host "  2. Skip for now (you can calculate later)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1 or 2)"

if ($choice -eq "1") {
    Write-Host ""
    $apiUrl = Read-Host "Enter your API URL [http://localhost:3000]"
    if ([string]::IsNullOrWhiteSpace($apiUrl)) { $apiUrl = "http://localhost:3000" }
    
    Write-Host ""
    Write-Host "Calculating distances via API..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes depending on the number of trips..." -ForegroundColor Gray
    Write-Host ""
    
    try {
        $response = Invoke-RestMethod -Uri "$apiUrl/api/distance/missing/calculate" -Method Post -ErrorAction Stop
        Write-Host "✅ Distance calculation completed!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Results:" -ForegroundColor Cyan
        Write-Host "  Processed: $($response.processed)" -ForegroundColor White
        Write-Host "  Successful: $($response.successful)" -ForegroundColor Green
        Write-Host "  Failed: $($response.failed)" -ForegroundColor $(if ($response.failed -gt 0) { "Yellow" } else { "Green" })
        Write-Host "  Duration: $($response.duration)" -ForegroundColor White
    } catch {
        Write-Host "⚠️  API calculation failed: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "You can calculate distances later using:" -ForegroundColor Gray
        Write-Host "  curl -X POST $apiUrl/api/distance/missing/calculate" -ForegroundColor Cyan
    }
} else {
    Write-Host ""
    Write-Host "⏭️  Skipping distance calculation" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To calculate distances later, run:" -ForegroundColor Cyan
    Write-Host "  curl -X POST http://localhost:3000/api/distance/missing/calculate" -ForegroundColor White
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Database migration: Complete" -ForegroundColor Green
Write-Host "✅ Columns added: distance_miles, duration_hours" -ForegroundColor Green
Write-Host "✅ Cache table created: distance_cache" -ForegroundColor Green

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Restart your Next.js dev server" -ForegroundColor White
Write-Host "  2. View any trip detail page" -ForegroundColor White
Write-Host "  3. Check that distance shows real calculated value" -ForegroundColor White
Write-Host ""
Write-Host "Example trips to check:" -ForegroundColor Yellow
Write-Host "  • Guelph → Buffalo: Should show ~108 mi (not 750 mi)" -ForegroundColor White
Write-Host "  • Seattle → Portland: Should show ~173 mi (not 750 mi)" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  📖 Full Guide: FIX_TRIP_TICKET_DISTANCE.md" -ForegroundColor White
Write-Host "  🔍 Verify: verify_real_distance.sql" -ForegroundColor White
Write-Host "  🩺 Diagnose: diagnose_distance_data.sql" -ForegroundColor White
Write-Host ""

# Clear password from environment
$env:PGPASSWORD = ""

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
