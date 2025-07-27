# Bandcamp Player Enhancer

Une extension multi-navigateurs qui améliore l'expérience d'écoute sur Bandcamp avec un slider de volume et une barre de progression améliorée.

**Compatible avec Chrome, Firefox, Edge et autres navigateurs Chromium !**

## 🎵 Fonctionnalités

- **Player unifié** : Remplace complètement le player Bandcamp par une version améliorée
- **Contrôles de lecture personnalisés** : Boutons Play/Pause, Reculer/Avancer de 10 secondes avec design moderne
- **Slider de volume visible** : Contrôle précis du volume avec un slider élégant
- **Mémorisation du volume** : L'extension se souvient de votre niveau de volume préféré entre les pages
- **Barre de progression améliorée** : Barre plus épaisse, colorée et avec un curseur visible
- **Navigation temporelle** : Clic et glissement pour naviguer dans la piste
- **Affichage du temps** : Temps actuel et durée totale
- **Interface moderne** : Design avec effet de flou et transparence
- **Responsive** : S'adapte aux différentes tailles d'écran

## 🚀 Installation

### Installation Universelle (Un seul manifest !)

**L'extension fonctionne maintenant avec un seul manifest sur tous les navigateurs !**

#### Chrome/Edge/Opera :
1. Ouvrez `chrome://extensions/` (ou `edge://extensions/`)
2. Activez "Mode développeur"
3. "Charger l'extension non empaquetée" → Sélectionnez ce dossier

#### Firefox (109+) :
1. Ouvrez `about:debugging`
2. "Ce Firefox" 
3. "Charger un module temporaire" → Sélectionnez `manifest.json`

#### Build automatique (optionnel) :
```powershell
.\build.ps1  # Crée build/universal/ avec fichiers optimisés
```powershell
.\build.ps1  # Crée build/universal/ avec fichiers optimisés
```

### Méthode 2 : Conversion des icônes (optionnel)
Si vous voulez des icônes PNG au lieu des SVG :

1. Installez Python avec pip
2. Installez les dépendances :
   ```bash
   pip install Pillow cairosvg
   ```
3. Exécutez le script de conversion :
   ```bash
   python convert_icons.py
   ```
4. Modifiez le `manifest.json` pour utiliser les fichiers `.png` au lieu des `.svg`

Sinon, vous pouvez convertir manuellement les fichiers SVG en PNG (16x16, 48x48, 128x128) avec un outil en ligne.

## 📖 Utilisation

1. Rendez-vous sur n'importe quelle page Bandcamp avec un player audio
2. L'extension détecte automatiquement le player et le remplace par sa version améliorée
3. Interface organisée de haut en bas :
   - **Barre de progression** (en haut) : Cliquez pour naviguer dans la piste
   - **Contrôles de lecture** (au milieu) : Play/Pause, reculer/avancer de 10 secondes
   - **Slider de volume** (en bas) : Ajustez le son (mémorisé entre les pages)
4. Le player amélioré remplace complètement l'interface Bandcamp originale

## 🛠️ Fonctionnement technique

### Content Script
- Se charge sur tous les domaines `*.bandcamp.com`
- Détecte automatiquement les éléments `<audio>`
- Injecte les contrôles personnalisés
- Synchronise avec les événements audio natifs

### Styles CSS
- Interface moderne avec glassmorphism
- Variables CSS pour faciliter la personnalisation
- Responsive design
- Compatible avec les thèmes Bandcamp existants

### Compatibilité
- **Extension Universelle** : Un seul manifest pour tous !
- **Chrome** : Manifest V3 (version 88+)
- **Firefox** : Manifest V3 (version 109+)
- **Edge** : Manifest V3 (version 88+)
- **Opera** : Manifest V3 (version 74+)
- **Fallback** : localStorage pour Firefox < 109
- Fonctionne sur toutes les pages Bandcamp
- Support des navigations SPA
- Sauvegarde automatique des préférences

## 🎨 Personnalisation

Vous pouvez facilement modifier l'apparence en éditant le fichier `styles.css`. Les principales variables à modifier :

```css
/* Couleurs principales */
background: #1da0c3; /* Couleur principale */
background: rgba(0, 0, 0, 0.8); /* Arrière-plan des contrôles */

/* Tailles */
height: 8px; /* Hauteur des barres */
border-radius: 4px; /* Arrondi des éléments */
```

## 🔧 Structure des fichiers

```
bandcamp-player-enhancer/
├── manifest.json          # Configuration de l'extension
├── content.js             # Script principal
├── styles.css             # Styles de l'interface
├── convert_icons.py       # Script de conversion d'icônes
├── icons/
│   ├── icon16.svg         # Icône 16x16
│   ├── icon48.svg         # Icône 48x48
│   └── icon128.svg        # Icône 128x128
└── README.md              # Ce fichier
```

## 🐛 Résolution de problèmes

### L'extension ne se charge pas
- Vérifiez que le mode développeur est activé
- Rechargez l'extension depuis `chrome://extensions/`

### Les contrôles n'apparaissent pas
- Actualisez la page Bandcamp
- Vérifiez la console développeur (F12) pour les erreurs
- Assurez-vous qu'il y a bien un player audio sur la page

### Le volume ne fonctionne pas
- Certains sites peuvent bloquer la modification du volume
- Essayez de rafraîchir la page

## 📝 Notes de développement

Cette extension utilise :
- **Manifest V3** : Pour Chrome/Edge/Chromium
- **Manifest V2** : Pour Firefox (rétrocompatibilité)
- **API Cross-Browser** : Détection automatique Chrome/Firefox
- **Content Scripts** : Pour interagir avec les pages Bandcamp
- **Storage API + localStorage** : Sauvegarde des préférences avec fallback
- **Vanilla JavaScript** : Pas de dépendances externes
- **CSS moderne** : Flexbox, Grid, et effets visuels avancés

Le code est entièrement commenté et structuré pour faciliter les modifications et les contributions.

## 🔮 Améliorations futures possibles

- [ ] Support des raccourcis clavier
- [ ] Equalizer visuel
- [ ] Thèmes multiples
- [ ] Sauvegarde des préférences
- [ ] Intégration avec les playlists
- [ ] Mode picture-in-picture

---

**Développé avec ❤️ pour améliorer l'expérience Bandcamp**
