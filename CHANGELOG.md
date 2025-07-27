# Changelog - Bandcamp Player Enhancer

## Version 2.0 - Universal Manifest (2024)

### 🎯 Simplification Majeure
- **Manifest Universel** : Un seul `manifest.json` pour tous les navigateurs !
- **Fini les Duplicatas** : Plus besoin de `manifest-firefox.json`
- **Installation Simplifiée** : Un seul dossier, tous les navigateurs

### ✅ Nouvelles Fonctionnalités
- **Compatibilité Cross-Browser** : Chrome, Firefox, Edge, Opera, Brave
- **API Detection** : Détection automatique de l'API du navigateur
- **Fallback Storage** : localStorage si l'API extension n'est pas disponible
- **Build Universel** : Script de build simplifié

### 🔧 Améliorations Techniques
- **Manifest V3** : Support complet avec `host_permissions`
- **Firefox Compatibility** : `browser_specific_settings` pour Firefox 109+
- **Cross-Browser Storage** : `chrome.storage` avec fallback `localStorage`
- **Logs Améliorés** : Meilleure visibilité du debug

### 📁 Structure Simplifiée
```
bandcamp-player-enhancer/
├── manifest.json          # ✨ Manifest universel !
├── content.js            # Script principal cross-browser
├── styles.css            # Styles modernes
├── icons/                # Icônes SVG/PNG
├── build.ps1             # Build universel
├── README.md             # Documentation mise à jour
├── INSTALLATION.md       # Instructions simplifiées
└── CHANGELOG.md          # Ce fichier
```

### 🗑️ Fichiers Supprimés
- ~~`manifest-firefox.json`~~ - Fusionné dans le manifest universel
- ~~`INSTALLATION-MULTI-BROWSER.md`~~ - Intégré dans INSTALLATION.md
- ~~Build séparés~~ - Un seul build universel

---

## Version 1.0 - Version Initiale

### 🎵 Fonctionnalités Core
- **Volume Slider** : Contrôle précis du volume
- **Mémoire du Volume** : Sauvegarde entre les pages
- **Navigation ±10s** : Boutons reculer/avancer 10 secondes
- **Barre de Progression** : Affichage temps actuel/durée
- **Design Moderne** : Glassmorphism avec transparence

### 🎨 Interface
- **Layout Hiérarchique** :
  1. Barre de progression (haut)
  2. Contrôles de lecture (milieu)
  3. Volume (bas)
- **Responsive Design** : S'adapte aux différentes tailles
- **Masquage Player Original** : Player Bandcamp caché automatiquement

### 🔧 Technique
- **Content Script** : Injection sur `*.bandcamp.com`
- **Storage API** : Sauvegarde des préférences
- **CSS Custom** : Styles non intrusifs
- **Event Listeners** : Intégration avec l'audio HTML5

---

## Roadmap Futur

### 🎯 Fonctionnalités Prévues
- [ ] **Equalizer** : Contrôles de fréquences
- [ ] **Raccourcis Clavier** : Navigation au clavier
- [ ] **Thèmes** : Choix de couleurs/styles
- [ ] **Playlist Controls** : Gestion avancée des playlists
- [ ] **Lyrics Display** : Affichage des paroles si disponibles

### 🛠️ Améliorations Techniques
- [ ] **WebExtension Polyfill** : Compatibilité encore meilleure
- [ ] **TypeScript** : Conversion en TypeScript
- [ ] **Unit Tests** : Tests automatisés
- [ ] **CI/CD** : Déploiement automatique
- [ ] **Web Store** : Publication sur les stores officiels

---

*Dernière mise à jour : 2024 - Version 2.0 Universal*
