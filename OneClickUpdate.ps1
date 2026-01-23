# OneClickUpdate.ps1
# This script performs all necessary actions to update the Deepwater Daily website:
# 1. Runs the news collector to gather fresh news
# 2. Optionally commits and pushes changes to GitHub

param(
    [switch]$PushToGitHub = $false,
    [string]$CommitMessage = "Update Deepwater Daily with fresh content"
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  DEEPWATER DAILY - ONE CLICK UPDATE" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command was successful
function Check-LastExitCode {
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Last command failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

# Step 1: Run the news collector
Write-Host "Step 1: Collecting fresh oil & gas news..." -ForegroundColor Green
python deepwater_news_collector.py
Check-LastExitCode
Write-Host "News collection completed successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Verify CSV file exists
Write-Host "Step 2: Verifying CSV file..." -ForegroundColor Green
$baseDir = Get-Location
$primaryCsv = "$baseDir\docs\data\deepwater_news.csv"

if (Test-Path $primaryCsv) {
    $articleCount = (Get-Content $primaryCsv | Measure-Object -Line).Lines - 1
    Write-Host "Primary CSV file exists with $articleCount articles" -ForegroundColor Green
} else {
    Write-Host "WARNING: Primary CSV file not found at $primaryCsv" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Push to GitHub (if requested)
if ($PushToGitHub) {
    Write-Host "Step 3: Pushing to GitHub..." -ForegroundColor Green
    
    # Check if we're in a git repository
    if (Test-Path ".git") {
        # Add all changes
        git add .
        Check-LastExitCode
        
        # Commit changes
        git commit -m $CommitMessage
        # Note: This may fail if there are no changes, which is OK
        
        # Push to remote
        git push
        Check-LastExitCode
        
        Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Not a git repository. Skipping push." -ForegroundColor Yellow
    }
} else {
    Write-Host "Step 3: Skipping GitHub push (use -PushToGitHub to enable)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  UPDATE COMPLETE!" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review the changes in docs/data/deepwater_news.csv" -ForegroundColor White
Write-Host "  2. Test locally by opening docs/index.html in a browser" -ForegroundColor White
if (-not $PushToGitHub) {
    Write-Host "  3. Run with -PushToGitHub to deploy: .\OneClickUpdate.ps1 -PushToGitHub" -ForegroundColor White
}
Write-Host ""
