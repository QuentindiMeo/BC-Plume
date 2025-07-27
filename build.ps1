# TypeScript Build Script for MBAPPE Extension
# Compiles TypeScript and creates cross-browser packages

Write-Host "=== MBAPPE - TypeScript Build ===" -ForegroundColor Green

# Check if Node.js and npm are installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm not found. Please install npm first." -ForegroundColor Red
    exit 1
}

# Install dependencies if needed
if ((Test-Path "package.json") -and (-not (Test-Path "node_modules"))) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "build") { Remove-Item -Recurse -Force "build" }

# Compile TypeScript
Write-Host "🔨 Compiling TypeScript..." -ForegroundColor Yellow
npm run build:prod
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript compilation failed" -ForegroundColor Red
    exit 1
}

# Create browser-specific packages
Write-Host "📦 Creating browser packages..." -ForegroundColor Yellow
npm run package
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Package creation failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Build complete ===" -ForegroundColor Green
Write-Host "Universal extension available in:" -ForegroundColor Yellow
Write-Host "  - build/universal/ (compatible with Chrome AND Firefox)" -ForegroundColor Cyan
Write-Host "`nInstallation:" -ForegroundColor Yellow
Write-Host "  - Chrome: chrome://extensions/ > Load unpacked extension" -ForegroundColor Cyan
Write-Host "  - Firefox: about:debugging > Load Temporary Add-on" -ForegroundColor Cyan