<script setup>
/**
 * App.vue - Composant racine de l'application Spider Solitaire
 *
 * Rôles :
 * - Initialiser le jeu (composable useGame)
 * - Afficher l'en-tête avec titre, score, timer, progression
 * - Afficher les contrôles : Nouvelle partie, Annuler, Mode sombre
 * - Afficher le plateau de jeu (GameBoard)
 * - Afficher l'écran de victoire
 * - Gérer le thème clair / sombre
 * - Raccourcis clavier
 * - Statistiques
 */
import { ref, onMounted, onUnmounted, watch } from 'vue'
import GameBoard from './components/GameBoard.vue'
import ToastContainer from './components/ToastContainer.vue'
import { useGame } from './composables/useGame'
import { useToast } from './composables/useToast'
import { useStats } from './composables/useStats'

// Initialisation du jeu
const game = useGame()
const { info, warning } = useToast()
const statsManager = useStats()

// État local du thème
const isDarkTheme = ref(true) // Thème sombre par défaut (plus adapté à un jeu de cartes)

// Afficher les stats
const showStats = ref(false)

// Support PWA Installation
const deferredPrompt = ref(null)

function onBeforeInstallPrompt(e) {
  e.preventDefault()
  deferredPrompt.value = e
}

async function installPWA() {
  if (!deferredPrompt.value) return
  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  if (outcome === 'accepted') {
    info('📲 Application installée avec succès !')
  }
  deferredPrompt.value = null
}

// Initialiser une nouvelle partie au montage
onMounted(() => {
  game.newGame()
  applyTheme()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)

  // Verrouillage en mode paysage si supporté par l'appareil/navigateur
  if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
    window.screen.orientation.lock('landscape').catch(() => {
      // Ignoré si le navigateur nécessite le plein écran ou une interaction
    })
  }
})

onUnmounted(() => {
  game.stopTimer()
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  if (hintTimeout) clearTimeout(hintTimeout)
})

// Raccourcis clavier
function onKeyDown(event) {
  // Ctrl+Z ou Ctrl+z : Annuler
  if ((event.ctrlKey || event.metaKey) && (event.key === 'z' || event.key === 'Z')) {
    event.preventDefault()
    if (game.history.value.length > 0) {
      game.undo()
      info('↶ Coup annulé')
    }
    return
  }

  // Ctrl+N ou Ctrl+n : Nouvelle partie
  if ((event.ctrlKey || event.metaKey) && (event.key === 'n' || event.key === 'N')) {
    event.preventDefault()
    game.newGame()
    return
  }

  // Espace : Distribuer
  if (event.key === ' ' || event.key === 'Spacebar') {
    event.preventDefault()
    const success = game.dealFromStock()
    if (success) {
      info('🃏 10 cartes distribuées')
    } else {
      warning('⚠️ Distribution impossible')
    }
    return
  }

  // H ou h : Indice
  if (event.key === 'h' || event.key === 'H') {
    event.preventDefault()
    showHint()
    return
  }

  // D ou d : Mode sombre/clair
  if (event.key === 'd' || event.key === 'D') {
    if (!event.ctrlKey && !event.metaKey) {
      event.preventDefault()
      toggleTheme()
    }
    return
  }
}

// État de l'indice visuel (transmis à GameBoard → Column → Card)
const highlightHint = ref(null)
let hintTimeout = null

function showHint() {
  const hint = game.getHint()
  if (hint) {
    // Efface l'indice visuel précédent
    if (hintTimeout) clearTimeout(hintTimeout)
    // Définit l'indice visuel
    highlightHint.value = { col: hint.col, index: hint.index, targetCol: hint.targetCol }
    // Efface l'indice visuel après 3 secondes
    hintTimeout = setTimeout(() => {
      highlightHint.value = null
    }, 3000)

    // Message textuel précis
    const sequenceText = hint.sequenceLength > 1
      ? `la séquence ${hint.cardLabel}… (${hint.sequenceLength} cartes)`
      : `le ${hint.cardLabel}`

    info(`💡 Déplacez ${sequenceText} (colonne ${hint.col + 1}) sur ${hint.targetLabel} (colonne ${hint.targetCol + 1})`)
  } else {
    warning('💡 Aucun déplacement possible. Essayez de distribuer !')
  }
}

// Applique la classe de thème au body
function applyTheme() {
  if (isDarkTheme.value) {
    document.body.classList.add('dark-theme')
  } else {
    document.body.classList.remove('dark-theme')
  }
}

watch(isDarkTheme, () => {
  applyTheme()
})

function toggleTheme() {
  isDarkTheme.value = !isDarkTheme.value
}

// Stats
function getBestTimeFormatted() {
  return statsManager.formatTime(statsManager.stats.value.bestTime)
}

// Enregistre les stats en cas de victoire
watch(() => game.isWon.value, (won) => {
  if (won) {
    statsManager.recordGame(true, game.score.value, game.elapsedSeconds.value, 0)
  }
})

// Sauvegarde l'ancien newGame pour ajouter l'enregistrement des stats
const originalNewGame = game.newGame
game.newGame = function() {
  // Si la partie en cours n'est pas gagnée, compter comme défaite
  if (game.isWon.value === false && game.elapsedSeconds.value > 0) {
    statsManager.recordGame(false, game.score.value, game.elapsedSeconds.value, 0)
  }
  originalNewGame()
}
</script>

<template>
  <div class="app" :class="{ 'app--light': !isDarkTheme }">
    <!-- En-tête -->
    <header class="app__header">
      <div class="app__title-group">
        <h1 class="app__title">
          <span class="app__title-icon">♠</span>
          Spider Solitaire
        </h1>
        <span class="app__subtitle">Une seule couleur · 104 cartes</span>
      </div>

      <!-- Statistiques : score, temps, suites -->
      <div class="app__stats">
        <div class="stat">
          <div class="stat__label">Score</div>
          <div class="stat__value">{{ game.score.value }}</div>
        </div>
        <div class="stat">
          <div class="stat__label">Temps</div>
          <div class="stat__value">{{ game.formattedTime.value }}</div>
        </div>
        <div class="stat">
          <div class="stat__label">Suites</div>
          <div class="stat__value">{{ game.completedSequences.value }} / 8</div>
        </div>
        <div class="stat">
          <div class="stat__label">Cartes</div>
          <div class="stat__value">{{ game.cardsInPlay.value }}</div>
        </div>
      </div>

      <!-- Boutons de contrôle -->
      <div class="app__controls">
        <button class="btn btn--primary" @click="game.newGame()" title="Ctrl+N">
          <span class="btn__icon">↻</span>
          Nouvelle partie
        </button>
        <button
          class="btn"
          :disabled="game.history.value.length === 0"
          @click="game.undo()"
          title="Ctrl+Z"
        >
          <span class="btn__icon">↶</span>
          Annuler
        </button>
        <button
          class="btn"
          @click="showHint()"
          title="H"
        >
          <span class="btn__icon">💡</span>
          Indice
        </button>
        <button
          v-if="deferredPrompt"
          class="btn btn--accent"
          @click="installPWA"
          title="Installer l'application sur cet appareil"
        >
          <span class="btn__icon">📲</span>
          Installer
        </button>
        <button class="btn btn--icon-only" @click="toggleTheme" :title="isDarkTheme ? 'Mode clair (D)' : 'Mode sombre (D)'">
          <span>{{ isDarkTheme ? '☀' : '☾' }}</span>
        </button>
        <button class="btn btn--icon-only" @click="showStats = !showStats" title="Statistiques">
          <span>📊</span>
        </button>
      </div>
    </header>

    <!-- Barre de progression -->
    <div class="progress-bar">
      <div class="progress-bar__fill" :style="{ width: game.progress.value + '%' }"></div>
    </div>

    <!-- Plateau de jeu -->
    <main class="app__main">
      <GameBoard :game="game" :highlight-hint="highlightHint" />
    </main>

    <!-- Écran de victoire -->
    <div v-if="game.isWon.value" class="victory-overlay">
      <div class="victory-modal">
        <div class="victory-modal__icon">🎉</div>
        <h2 class="victory-modal__title">Victoire !</h2>
        <p class="victory-modal__text">Vous avez complété les 8 suites !</p>
        <div class="victory-modal__stats">
          <div><strong>Score :</strong> {{ game.score.value }}</div>
          <div><strong>Temps :</strong> {{ game.formattedTime.value }}</div>
        </div>
        <button class="btn btn--primary btn--large" @click="game.newGame()">
          Rejouer
        </button>
      </div>
    </div>
    <!-- Panneau de statistiques -->
    <div v-if="showStats" class="stats-panel" @click.self="showStats = false">
      <div class="stats-panel__modal">
        <h3 class="stats-panel__title">📊 Statistiques</h3>
        <div class="stats-panel__row">
          <span>Parties jouées</span>
          <strong>{{ statsManager.stats.value.gamesPlayed }}</strong>
        </div>
        <div class="stats-panel__row">
          <span>Parties gagnées</span>
          <strong>{{ statsManager.stats.value.gamesWon }}</strong>
        </div>
        <div class="stats-panel__row">
          <span>Taux de victoire</span>
          <strong>{{ statsManager.getWinRate() }}%</strong>
        </div>
        <div class="stats-panel__row">
          <span>Meilleur score</span>
          <strong>{{ statsManager.stats.value.bestScore }}</strong>
        </div>
        <div class="stats-panel__row">
          <span>Meilleur temps</span>
          <strong>{{ getBestTimeFormatted() }}</strong>
        </div>
        <div class="stats-panel__row">
          <span>Meilleure série</span>
          <strong>{{ statsManager.stats.value.bestStreak }} victoire{{ statsManager.stats.value.bestStreak > 1 ? 's' : '' }}</strong>
        </div>
        <button class="btn btn--small" @click="showStats = false">Fermer</button>
      </div>
    </div>

    <!-- Notifications Toast -->
    <ToastContainer />

    <!-- Raccourcis clavier (info flottante) -->
    <div class="keyboard-hint">
      <span>Ctrl+Z: Annuler</span>
      <span>Espace: Distribuer</span>
      <span>H: Indice</span>
    </div>

    <!-- Invitation à tourner l'appareil en mode paysage sur smartphone -->
    <div class="portrait-warning-overlay">
      <div class="portrait-warning">
        <div class="portrait-warning__icon">🔄</div>
        <div class="portrait-warning__title">Mode Paysage Recommandé</div>
        <div class="portrait-warning__text">
          Tournez votre smartphone à l'horizontale pour profiter de la meilleure expérience de jeu.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background:
    radial-gradient(circle at 20% 20%, #1a3a2a 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, #2a1a3a 0%, transparent 50%),
    linear-gradient(135deg, #0d1f17 0%, #1a1a2e 50%, #0d1f17 100%);
  color: #f0f0f5;
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Thème clair */
.app--light {
  background:
    radial-gradient(circle at 20% 20%, #d4e8d4 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, #d4d4e8 0%, transparent 50%),
    linear-gradient(135deg, #e8efe8 0%, #e0e0e8 50%, #e8efe8 100%);
  color: #1a1a1a;
}

/* En-tête */
.app__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-wrap: wrap;
  gap: 16px;
}
.app--light .app__header {
  background: rgba(255, 255, 255, 0.6);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.app__title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.app__title {
  font-size: 24px;
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: -0.5px;
}
.app__title-icon {
  font-size: 28px;
  color: #ffd700;
  text-shadow: 0 0 12px rgba(255, 215, 0, 0.5);
}
.app__subtitle {
  font-size: 11px;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Statistiques */
.app__stats {
  display: flex;
  gap: 20px;
}
.stat {
  text-align: center;
  min-width: 60px;
}
.stat__label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.6;
}
.stat__value {
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* Contrôles */
.app__controls {
  display: flex;
  gap: 8px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}
.btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}
.btn:active:not(:disabled) {
  transform: translateY(0);
}
.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn--primary {
  background: linear-gradient(135deg, #4a8a5a 0%, #2a6a3a 100%);
  border-color: #5a9a6a;
  color: #ffffff;
}
.btn--primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a9a6a 0%, #3a7a4a 100%);
  box-shadow: 0 4px 12px rgba(74, 138, 90, 0.4);
}
.btn--icon-only {
  padding: 8px 12px;
}
.btn__icon {
  font-size: 16px;
  line-height: 1;
}
.btn--large {
  padding: 12px 28px;
  font-size: 16px;
}
.btn--small {
  padding: 6px 14px;
  font-size: 12px;
  margin-top: 8px;
}

.app--light .btn {
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.15);
}
.app--light .btn:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.1);
}
.app--light .btn--primary {
  background: linear-gradient(135deg, #4a8a5a 0%, #2a6a3a 100%);
  color: #ffffff;
}

/* Barre de progression */
.progress-bar {
  height: 4px;
  background: rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}
.progress-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, #4a8a5a 0%, #ffd700 50%, #ff6a3a 100%);
  transition: width 0.5s ease;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
}

/* Zone principale */
.app__main {
  flex: 1;
  overflow-x: auto;
}

/* Écran de victoire */
.victory-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.4s ease;
  padding: 16px;
  box-sizing: border-box;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.victory-modal {
  background: linear-gradient(145deg, #1a3a2a 0%, #2a1a3a 100%);
  border: 2px solid #ffd700;
  border-radius: 16px;
  padding: 40px 48px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 80px rgba(255, 215, 0, 0.3);
  animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  max-height: 90vh;
  max-width: 90vw;
  overflow-y: auto;
  box-sizing: border-box;
}
@keyframes popIn {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.victory-modal__icon {
  font-size: 64px;
  margin-bottom: 12px;
}
.victory-modal__title {
  font-size: 36px;
  margin: 0 0 8px;
  color: #ffd700;
  font-weight: 800;
}
.victory-modal__text {
  font-size: 16px;
  opacity: 0.8;
  margin: 0 0 20px;
}
.victory-modal__stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 24px;
  font-size: 18px;
}
.victory-modal__stats strong {
  color: #ffd700;
}

/* Panneau de statistiques */
.stats-panel {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}
.stats-panel__modal {
  background: linear-gradient(145deg, #1a2a22 0%, #1a1a2e 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 28px 32px;
  min-width: 300px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  text-align: center;
}
.stats-panel__title {
  font-size: 20px;
  margin: 0 0 16px;
  color: #ffd700;
}
.stats-panel__row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 14px;
}
.stats-panel__row:last-of-type {
  border-bottom: none;
}
.stats-panel__row strong {
  color: #ffd700;
}
.app--light .stats-panel__modal {
  background: linear-gradient(145deg, #e8efe8 0%, #e0e0e8 100%);
  border-color: rgba(0, 0, 0, 0.12);
  color: #1a1a1a;
}

/* Indicateur de raccourcis clavier */
.keyboard-hint {
  position: fixed;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  z-index: 100;
  pointer-events: none;
}
.app--light .keyboard-hint {
  background: rgba(255, 255, 255, 0.5);
  color: rgba(0, 0, 0, 0.4);
}

/* Responsive */
@media (max-width: 900px) {
  .app__header {
    padding: 12px 16px;
  }
  .app__title {
    font-size: 20px;
  }
  .app__stats {
    gap: 12px;
  }
  .stat__value {
    font-size: 16px;
  }
  .btn {
    padding: 6px 10px;
    font-size: 12px;
  }
}

/* Réduction maximale de l'en-tête lorsque la hauteur de l'écran est faible */
@media (max-height: 700px) {
  .app__header {
    padding: 8px 16px;
    gap: 8px 12px;
  }
  .app__title {
    font-size: 16px;
    gap: 6px;
  }
  .app__title-icon {
    font-size: 18px;
  }
  .app__subtitle {
    display: none; /* Masque le sous-titre pour libérer de la hauteur */
  }
  .app__stats {
    gap: 12px;
  }
  .stat {
    min-width: auto;
  }
  .stat__label {
    font-size: 9px;
  }
  .stat__value {
    font-size: 14px;
  }
  .btn {
    padding: 5px 10px;
    font-size: 12px;
    gap: 4px;
  }
  .btn__icon {
    font-size: 13px;
  }

  /* Modale de victoire responsive */
  .victory-modal {
    padding: 20px 28px;
    border-radius: 12px;
  }
  .victory-modal__icon {
    font-size: 40px;
    margin-bottom: 6px;
  }
  .victory-modal__title {
    font-size: 24px;
    margin-bottom: 4px;
  }
  .victory-modal__text {
    font-size: 14px;
    margin-bottom: 12px;
  }
  .victory-modal__stats {
    font-size: 14px;
    margin-bottom: 14px;
    gap: 4px;
  }
}

@media (max-height: 550px) {
  .app__header {
    padding: 4px 12px;
    gap: 4px 10px;
  }
  .app__title {
    font-size: 14px;
    gap: 4px;
  }
  .app__title-icon {
    font-size: 16px;
  }
  .app__stats {
    gap: 8px;
  }
  .stat {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .stat__label {
    font-size: 9px;
  }
  .stat__label::after {
    content: ':';
  }
  .stat__value {
    font-size: 12px;
  }
  .btn {
    padding: 3px 8px;
    font-size: 11px;
    border-radius: 6px;
  }
  .btn__icon {
    font-size: 12px;
  }
  .progress-bar {
    height: 2px;
  }
  .keyboard-hint {
    display: none; /* Masque le bandeau de raccourcis bas pour préserver l'espace de jeu */
  }

  /* Modale de victoire ultra-compacte */
  .victory-modal {
    padding: 12px 20px;
    border-radius: 10px;
  }
  .victory-modal__icon {
    font-size: 28px;
    margin-bottom: 2px;
  }
  .victory-modal__title {
    font-size: 20px;
    margin-bottom: 2px;
  }
  .victory-modal__text {
    font-size: 12px;
    margin-bottom: 8px;
  }
  .victory-modal__stats {
    flex-direction: row;
    justify-content: center;
    gap: 16px;
    font-size: 13px;
    margin-bottom: 10px;
  }
}

/* Avertissement mode portrait sur smartphone */
.portrait-warning-overlay {
  display: none;
}

@media screen and (orientation: portrait) and (max-width: 768px) {
  .portrait-warning-overlay {
    display: flex;
    position: fixed;
    inset: 0;
    background: rgba(13, 31, 23, 0.96);
    backdrop-filter: blur(12px);
    z-index: 9999;
    align-items: center;
    justify-content: center;
    padding: 24px;
    text-align: center;
  }

  .portrait-warning {
    background: linear-gradient(145deg, #1a3a2a 0%, #1a1a2e 100%);
    border: 1px solid rgba(255, 215, 0, 0.4);
    border-radius: 16px;
    padding: 28px 24px;
    max-width: 320px;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
  }

  .portrait-warning__icon {
    font-size: 48px;
    margin-bottom: 12px;
    animation: rotateHint 2.5s infinite ease-in-out;
  }

  .portrait-warning__title {
    font-size: 18px;
    font-weight: 700;
    color: #ffd700;
    margin-bottom: 8px;
  }

  .portrait-warning__text {
    font-size: 13px;
    opacity: 0.85;
    line-height: 1.4;
  }

  @keyframes rotateHint {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(90deg); }
  }
}
</style>
