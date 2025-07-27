# Installation de l'Extension Bandcamp Player Enhancer

## 🎯 Installation Universelle (Recommandée)

Cette extension utilise maintenant un **manifest universel** compatible avec tous les navigateurs modernes !

### ✅ Prérequis
- **Chrome/Edge/Opera** : Version 88+ (Manifest V3)
- **Firefox** : Version 109+ (Manifest V3)
- **Brave/Vivaldi** : Dernières versions

### 📥 Installation Rapide

#### 1️⃣ Télécharger
```bash
git clone https://github.com/votre-username/bandcamp-player-enhancer.git
cd bandcamp-player-enhancer
```

#### 2️⃣ Installation par Navigateur

##### Chrome/Edge/Opera/Brave :
1. Ouvrez `chrome://extensions/` (ou équivalent)
2. Activez **"Mode développeur"** (coin supérieur droit)
3. Cliquez **"Charger l'extension non empaquetée"**
4. Sélectionnez le dossier du projet
5. ✅ L'extension est installée !

##### Firefox :
1. Ouvrez `about:debugging`
2. Cliquez **"Ce Firefox"**
3. Cliquez **"Charger un module temporaire"**
4. Sélectionnez le fichier `manifest.json`
5. ✅ L'extension est installée !

#### 3️⃣ Vérification
- Rendez-vous sur n'importe quelle page Bandcamp
- L'interface améliorée apparaît automatiquement
- Le volume est sauvegardé entre les pages

## 🛠️ Build Avancé (Optionnel)

### Création d'un Package
```powershell
# Build automatique
.\build.ps1

# Résultat : build/universal/bandcamp-player-enhancer.zip
```

### Structure du Build
```
build/universal/
├── manifest.json           # Manifest universel
├── content.js             # Script principal
├── styles.css             # Styles CSS
├── icons/                 # Icônes de l'extension
└── README.md             # Documentation
```

## 🔧 Conversion des Icônes (Optionnel)

Si vous voulez convertir les SVG en PNG pour certains navigateurs :

### Option A : Outil en ligne (recommandé)
- Allez sur https://convertio.co/svg-png/ ou https://svgtopng.com/
- Convertissez chaque fichier SVG du dossier `icons/` :
  - icon16.svg → icon16.png (16x16 pixels)
  - icon48.svg → icon48.png (48x48 pixels)  
  - icon128.svg → icon128.png (128x128 pixels)

### Option B : Avec Python (si disponible)
```bash
pip install Pillow cairosvg
python convert_icons.py
```

## 🔧 Dépannage

### Problèmes Courants

#### Firefox : "Extension non compatible"
- **Solution** : Vérifiez que vous avez Firefox 109+
- **Alternative** : L'extension utilisera localStorage en fallback

#### Chrome : "Manifest non valide"
- **Solution** : Vérifiez que `manifest.json` n'est pas corrompu
- **Debug** : Consultez la console des extensions

#### Pas d'interface visible
- **Solution** : Rechargez la page Bandcamp
- **Debug** : Ouvrez F12 → Console pour voir les logs

### Logs de Debug
Ouvrez la console (F12) sur Bandcamp pour voir :
```
[BPE] Extension loaded successfully
[BPE] Audio element found: <audio>
[BPE] Volume loaded: 0.75
[BPE] UI created successfully
```

## 🔄 Mise à Jour

### Mise à jour Manuelle
1. Télécharger la nouvelle version
2. Remplacer les fichiers existants
3. Recharger l'extension dans le navigateur

### Mise à jour via Git
```bash
cd bandcamp-player-enhancer
git pull origin main
# Recharger l'extension dans le navigateur
```

## 🗑️ Désinstallation

### Chrome/Edge/Opera :
1. `chrome://extensions/`
2. Cliquer sur "Supprimer" sur l'extension

### Firefox :
1. `about:addons`
2. Extensions → Supprimer

Les préférences sauvegardées sont automatiquement supprimées.

---

## 📞 Support

**Problème ?** Ouvrez une issue sur GitHub avec :
- Version du navigateur
- Version de l'extension
- Description du problème
- Logs de la console (F12)
