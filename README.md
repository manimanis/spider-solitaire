# Spider Solitaire ♠ (1 Couleur)

Une application web moderne, réactive et fluide de **Spider Solitaire** (version 1 couleur), construite avec **Vue 3**, **Vite** et **Progressive Web App (PWA)**.

![Spider Solitaire Banner](https://img.shields.io/badge/Vue.js-3.5-4fc08d?style=for-the-badge&logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.0-646cff?style=for-the-badge&logo=vite&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Supporté-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![Responsive](https://img.shields.io/badge/Responsive-Mobile_%26_Desktop-ff69b4?style=for-the-badge)

---

## 🌟 Fonctionnalités Principales

### 🃏 Règles & Gameplay
- **1 Couleur (♠ Pique)** : 104 cartes réparties en 8 jeux complets de 13 cartes (As à Roi).
- **10 Colonnes de jeu** : 4 colonnes de 6 cartes et 6 colonnes de 5 cartes distribuées initialement.
- **Stock (Paquet)** : 50 cartes restantes en réserve distribuables 10 par 10 (5 distributions).
- **Complétion automatique** : Retrait automatique des séquences complètes du Roi (K) à l'As (A).
- **Victoire** : Atteignez 8 suites complétées pour remporter la partie !

### 📱 Optimisations Smartphone & Tactile
- **Mode Paysage Natif (`landscape`)** : L'application s'ouvre automatiquement à l'horizontale en PWA et inclut une invitation visuelle à tourner le téléphone si l'écran est en mode portrait.
- **Système Tap-to-Select & Move** :
  - **1er tap** : Sélectionne la carte et toute la séquence avec une mise en valeur dorée brillante (`.card--selected`).
  - **2ème tap** : Déplace la séquence sélectionnée vers la colonne ou la carte cible.
  - **Double tap / Re-tap** : Déplacement automatique vers la meilleure destination disponible.
- **Drag & Drop HTML5** : Fonctionne parfaitement au glisser-déposer sur PC / Desktop.
- **Composants Ultra-Compacts** : Adaptation dynamique de la taille des cartes, des symboles (`.card__pip`), de l'espacement (`--card-overlap`), de l'en-tête et de la modale de victoire sur les écrans à faible hauteur.

### 🎨 Design & Ergonomie
- **Esthétique Moderne** : Thème sombre par défaut (vert tapis de jeu + accents dorés), glassmorphisme et ombres 3D.
- **Thème Clair / Sombre** : Bascule facile avec raccourci clavier (`D`) ou bouton dédié (`☀ / ☾`).
- **Indices Visuels (`H`)** : Détection et mise en surbrillance automatique du meilleur coup jouable.
- **Annulation (`Ctrl+Z`)** : Historique des coups pour revenir en arrière.
- **Panneau de Statistiques (`📊`)** : Suivi des parties jouées, gagnées, taux de victoire, meilleur score, meilleur temps et séries.

---

## 🛠️ Technologies Utilisées

- **Framework** : [Vue 3](https://vuejs.org/) (Composition API / `<script setup>`)
- **Tooling / Bundler** : [Vite 6](https://vitejs.dev/)
- **PWA Plugin** : `vite-plugin-pwa` (support hors-ligne, manifeste PWA, installation sur écran d'accueil)
- **Styling** : Vanilla CSS 3 (Variables CSS `:root`, `@media` queries pour largeur et hauteur `max-height`)

---

## 🚀 Installation et Lancement

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée)
- `npm`

### 1. Cloner le projet & installer les dépendances
```bash
npm install
```

### 2. Lancer le serveur de développement local
```bash
npm run dev
```
Ouvrez votre navigateur à l'adresse [http://localhost:3000](http://localhost:3000).

### 3. Compiler pour la production
```bash
npm run build
```

### 4. Tester la version de production localement
```bash
npm run preview
```

---

## ⌨️ Raccourcis Clavier

| Touche | Action |
| :--- | :--- |
| **`Ctrl` + `Z`** | Annuler le dernier coup |
| **`Ctrl` + `N`** | Nouvelle partie |
| **`Espace`** | Distribuer 10 cartes depuis le stock |
| **`H`** | Afficher un indice |
| **`D`** | Basculer le thème (Sombre / Clair) |

---

## 📂 Structure du Projet

```
spider-solitaire/
├── index.html                  # Point d'entrée HTML (meta viewport-fit=cover)
├── package.json                # Dépendances et scripts
├── vite.config.js              # Configuration Vite & PWA (orientation landscape)
├── public/                     # Icônes PWA, SVG & Manifest
└── src/
    ├── main.js                 # Initialisation de l'application Vue
    ├── App.vue                 # Composant racine, en-tête, thèmes et overlays
    ├── assets/
    │   └── styles.css          # Styles globaux & variables CSS responsive
    ├── components/
    │   ├── Card.vue            # Composant Carte (pips, figures, drag, sélection)
    │   ├── Column.vue          # Composant Colonne (empilement vertical dynamique)
    │   ├── GameBoard.vue       # Plateau principal (zone de jeu, top bar, drag/click)
    │   ├── Deck.vue            # Paquet de réserve / Stock (animations 3D)
    │   └── ToastContainer.vue  # Notifications toast (succès, avertissements)
    └── composables/
        ├── useGame.js          # Logique métier du Spider Solitaire
        ├── useStats.js         # Gestionnaire de statistiques
        └── useToast.js         # Gestionnaire de notifications
```

---

## 📄 Licence

Ce projet est sous licence MIT.
