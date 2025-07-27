# Installation Universelle

Cette extension utilise maintenant un **manifest universel** compatible avec Chrome ET Firefox !
Plus besoin de versions séparées ! 🎉

## 🚀 Installation Unique

### Un seul manifest pour tous les navigateurs !

L'extension utilise Manifest V3 avec les bonnes configurations pour être compatible partout.

## 📦 Installation

### Chrome/Edge/Chromium :
1. Ouvrez `chrome://extensions/`
2. Activez "Mode développeur"
3. "Charger l'extension non empaquetée" → Sélectionnez le dossier

### Firefox (109+) :
1. Ouvrez `about:debugging`
2. "Ce Firefox"
3. "Charger un module temporaire" → Sélectionnez `manifest.json`

### Build automatique (optionnel) :
```powershell
.\build.ps1
```
Cela crée `build/universal/` avec tous les fichiers optimisés.

## � Compatibilité Technique

### Manifest V3 Universel :
- ✅ **Chrome** 88+ : Support natif
- ✅ **Firefox** 109+ : Support Manifest V3  
- ✅ **Edge** 88+ : Support natif
- ✅ **Opera** 74+ : Support natif

### API Cross-Browser :
```javascript
// Détection automatique dans le code
const browserAPI = chrome || browser;
```

### Permissions Modernes :
- `"permissions": ["storage"]` : Sauvegarde des préférences
- `"host_permissions"` : Accès aux pages Bandcamp (format V3)
- `"browser_specific_settings"` : Configuration Firefox

## ✨ Avantages

- 🎯 **Un seul fichier** : `manifest.json` pour tous
- 🔄 **Pas de renommage** : Fonctionne tel quel
- 🚀 **Installation simple** : Même processus partout
- 🛠️ **Maintenance facile** : Une seule version à maintenir

## 🐛 Fallback Firefox Ancien

Pour Firefox < 109 (versions très anciennes) :
- L'extension utilise automatiquement localStorage
- Toutes les fonctionnalités restent disponibles
- Logs en console pour diagnostic

## 🎵 Fonctionnalités Identiques

Sur tous les navigateurs :
- 🎵 Contrôles ±10 secondes
- 🔊 Volume mémorisé
- 📊 Barre de progression
- 🎨 Interface moderne

---

**Extension universelle = Installation simplifiée !** �
