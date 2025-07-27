# Script de build pour créer l'extension universelle
# Compatible Chrome ET Firefox avec un seul manifest !

Write-Host "=== Bandcamp Player Enhancer - Build Universel ===" -ForegroundColor Green

# Créer le dossier de build
New-Item -ItemType Directory -Force -Path "build/universal" | Out-Null
Write-Host "Dossier de build créé" -ForegroundColor Yellow

# Copier tous les fichiers nécessaires
Copy-Item "content.js" "build/universal/"
Copy-Item "styles.css" "build/universal/"
Copy-Item "manifest.json" "build/universal/"
Copy-Item -Recurse "icons" "build/universal/"
Copy-Item "README.md" "build/universal/"
Copy-Item "INSTALLATION-MULTI-BROWSER.md" "build/universal/"

Write-Host "Fichiers copiés dans build/universal/" -ForegroundColor Yellow

# Créer l'archive ZIP
if (Get-Command Compress-Archive -ErrorAction SilentlyContinue) {
    Compress-Archive -Path "build/universal/*" -DestinationPath "bandcamp-player-enhancer-universal.zip" -Force
    Write-Host "Archive ZIP créée: bandcamp-player-enhancer-universal.zip" -ForegroundColor Green
} else {
    Write-Host "Compress-Archive non disponible. Utilisez 7-Zip ou un autre outil." -ForegroundColor Red
}

Write-Host "`n=== Build terminé ===" -ForegroundColor Green
Write-Host "Extension universelle disponible dans:" -ForegroundColor Yellow
Write-Host "  - build/universal/ (compatible Chrome ET Firefox)" -ForegroundColor Cyan
Write-Host "`nInstallation:" -ForegroundColor Yellow
Write-Host "  - Chrome: chrome://extensions/ > Charger extension non empaquetée" -ForegroundColor Cyan
Write-Host "  - Firefox: about:debugging > Charger module temporaire" -ForegroundColor Cyan
