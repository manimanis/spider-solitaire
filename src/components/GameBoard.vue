<script setup>
/**
 * GameBoard.vue - Composant principal du plateau de jeu
 *
 * Rôles :
 * - Afficher les 10 colonnes de cartes
 * - Afficher le paquet (Deck) et les suites complétées
 * - Coordonner le drag & drop entre colonnes
 * - Gérer l'état du drag en cours (draggingFrom)
 * - Afficher les notifications toast
 *
 * Props : le composable useGame entier (état + actions)
 */
import Column from './Column.vue'
import Deck from './Deck.vue'
import { ref, computed } from 'vue'
import { useToast } from '../composables/useToast'

const props = defineProps({
  game: { type: Object, required: true },
  highlightHint: { type: Object, default: null }
})

const { success, error, info, warning } = useToast()

// État de la carte sélectionnée au clic (tap-to-select) : { col, index } ou null
const selectedCard = ref(null)

// État du drag en cours : { col, index } ou null
const draggingFrom = ref(null)

// Compteur de déplacements pour les stats
const moveCount = ref(0)

// Animation shake sur le plateau
const isShaking = ref(false)
let shakeTimeout = null

function triggerShake() {
  isShaking.value = true
  if (shakeTimeout) clearTimeout(shakeTimeout)
  shakeTimeout = setTimeout(() => {
    isShaking.value = false
  }, 500)
}

// Indique si on peut distribuer (pas de colonne vide)
const canDeal = computed(() => {
  return !props.game.columns.value.some(col => col.length === 0) && props.game.stock.value.length > 0
})

/**
 * Vérifie si une carte est déplaçable (face visible et séquence décroissante valide)
 */
function isCardDraggable(colIndex, cardIndex) {
  const col = props.game.columns.value[colIndex]
  if (!col || cardIndex < 0 || cardIndex >= col.length) return false
  const card = col[cardIndex]
  if (!card || !card.faceUp) return false
  for (let i = cardIndex; i < col.length - 1; i++) {
    if (col[i].rank !== col[i + 1].rank + 1) return false
    if (!col[i + 1].faceUp) return false
  }
  return true
}

// Gestionnaires d'événements de drag & drop
function onCardDragStart(colIndex, cardIndex) {
  selectedCard.value = null
  draggingFrom.value = { col: colIndex, index: cardIndex }
}

function onCardDragEnd() {
  draggingFrom.value = null
}

function onDrop(fromCol, fromIndex, toCol) {
  selectedCard.value = null
  const successMove = props.game.moveCards(fromCol, fromIndex, toCol)
  if (successMove) {
    moveCount.value++
    success('✅ Carte déplacée')
  } else {
    error('❌ Déplacement impossible')
    triggerShake()
  }
  draggingFrom.value = null
}

function onDeal() {
  selectedCard.value = null
  const successDeal = props.game.dealFromStock()
  if (successDeal) {
    info('🃏 10 cartes distribuées')
  } else {
    warning('⚠️ Distribution impossible : une colonne est vide')
    triggerShake()
  }
}

/**
 * Gestion du tap-to-select / clic :
 * 1er clic : sélectionne la carte / séquence
 * 2ème clic : déplace vers la colonne ciblée
 */
function onCardClick(colIndex, cardIndex) {
  // Cas 1 : Aucune carte sélectionnée
  if (!selectedCard.value) {
    if (isCardDraggable(colIndex, cardIndex)) {
      selectedCard.value = { col: colIndex, index: cardIndex }
    } else {
      selectedCard.value = null
    }
    return
  }

  const fromCol = selectedCard.value.col
  const fromIndex = selectedCard.value.index

  // Cas 2 : Clic sur la même carte déjà sélectionnée -> essai de déplacement auto
  if (fromCol === colIndex && fromIndex === cardIndex) {
    const targetCol = props.game.findBestMove(cardIndex, colIndex)
    if (targetCol !== null) {
      const successMove = props.game.moveCards(colIndex, cardIndex, targetCol)
      if (successMove) {
        moveCount.value++
        success('✅ Carte déplacée')
      }
    }
    selectedCard.value = null
    return
  }

  // Cas 3 : Clic sur une autre carte / colonne -> tente le déplacement
  const successMove = props.game.moveCards(fromCol, fromIndex, colIndex)
  if (successMove) {
    moveCount.value++
    success('✅ Carte déplacée')
    selectedCard.value = null
  } else {
    // Si l'action échoue, sélectionne la nouvelle carte si elle est draggable
    if (isCardDraggable(colIndex, cardIndex)) {
      selectedCard.value = { col: colIndex, index: cardIndex }
    } else {
      selectedCard.value = null
      error('❌ Déplacement impossible')
      triggerShake()
    }
  }
}

/**
 * Clic sur une zone de colonne (ex: emplacement vide)
 */
function onColumnClick(colIndex) {
  if (selectedCard.value) {
    const fromCol = selectedCard.value.col
    const fromIndex = selectedCard.value.index
    if (fromCol !== colIndex) {
      const successMove = props.game.moveCards(fromCol, fromIndex, colIndex)
      if (successMove) {
        moveCount.value++
        success('✅ Carte déplacée')
        selectedCard.value = null
      } else {
        selectedCard.value = null
        error('❌ Déplacement impossible')
        triggerShake()
      }
    } else {
      selectedCard.value = null
    }
  }
}

function onCardDblClick(colIndex, cardIndex) {
  selectedCard.value = null
  const targetCol = props.game.findBestMove(cardIndex, colIndex)
  if (targetCol !== null) {
    const successMove = props.game.moveCards(colIndex, cardIndex, targetCol)
    if (successMove) {
      moveCount.value++
      success('✅ Carte déplacée')
    } else {
      error('❌ Déplacement impossible')
      triggerShake()
    }
  } else {
    error('❌ Aucune destination valide')
    triggerShake()
  }
}
</script>

<template>
  <div class="game-board" :class="{ 'game-board--shake': isShaking }">
    <!-- Zone supérieure : suites complétées + paquet -->
    <div class="game-board__top-bar">
      <!-- Suites complétées (jusqu'à 8) -->
      <div class="completed-zone">
        <div class="completed-zone__label">Suites complétées</div>
        <div class="completed-zone__slots">
          <div v-for="i in 8" :key="i" class="completed-slot"
            :class="{ 'completed-slot--filled': i <= game.completedSequences.value }">
            <span v-if="i <= game.completedSequences.value" class="completed-slot__symbol">♠</span>
            <span v-else class="completed-slot__placeholder">{{ i }}</span>
          </div>
        </div>
      </div>

      <!-- Paquet -->
      <Deck :cards-count="game.stock.value.length" :deals-left="game.dealsLeft.value" :can-deal="canDeal"
        @deal="onDeal" />
    </div>

    <!-- Plateau principal : 10 colonnes -->
    <div class="game-board__columns">
      <Column v-for="(column, index) in game.columns.value" :key="index" :column-index="index" :cards="column"
        :dragging-from="draggingFrom" :highlight-hint="highlightHint" :selected-card="selectedCard"
        @card-drag-start="onCardDragStart" @card-drag-end="onCardDragEnd" @drop="onDrop"
        @card-click="onCardClick" @column-click="onColumnClick" @card-dblclick="onCardDblClick" />
    </div>
  </div>
</template>

<style scoped>
.game-board {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 20px;
  min-height: calc(100vh - 80px);
  max-width: 1200px;
  margin: 0 auto;
}

.game-board--shake {
  animation: boardShake 0.4s ease;
}

@keyframes boardShake {

  0%,
  100% {
    transform: translateX(0);
  }

  15% {
    transform: translateX(-6px);
  }

  30% {
    transform: translateX(5px);
  }

  45% {
    transform: translateX(-4px);
  }

  60% {
    transform: translateX(3px);
  }

  75% {
    transform: translateX(-2px);
  }

  90% {
    transform: translateX(1px);
  }
}

.game-board__top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Zone des suites complétées */
.completed-zone {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.completed-zone__label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.completed-zone__slots {
  display: flex;
  gap: 6px;
}

.completed-slot {
  width: 44px;
  height: 62px;
  border-radius: 6px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.completed-slot--filled {
  background: linear-gradient(145deg, #ffffff 0%, #e8e8ee 100%);
  border: 1px solid #c0c0c8;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  animation: completePulse 0.5s ease;
}

.completed-slot__symbol {
  font-size: 24px;
  color: #1a1a1a;
  font-weight: 700;
}

.completed-slot__placeholder {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
}

@keyframes completePulse {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }

  50% {
    transform: scale(1.15);
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Plateau de colonnes */
.game-board__columns {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 5px;
  min-height: 500px;
  align-items: start;
}

/* Responsive : réduit l'espacement sur petits écrans */
@media (max-width: 1100px) {
  .game-board__columns {
    gap: 8px;
  }
}

@media (max-width: 900px) {
  .game-board {
    padding: 12px;
    gap: 16px;
  }

  .game-board__top-bar {
    padding: 12px;
    gap: 16px;
  }
}

@media (max-height: 700px) {
  .game-board {
    padding: 8px 12px;
    gap: 8px;
    min-height: auto;
  }

  .game-board__top-bar {
    padding: 6px 12px;
    gap: 10px;
    align-items: center;
    border-radius: 8px;
  }

  .completed-zone {
    gap: 2px;
  }

  .completed-zone__label {
    font-size: 10px;
  }

  .completed-slot {
    width: 32px;
    height: 44px;
  }

  .completed-slot__symbol {
    font-size: 18px;
  }
}

@media (max-height: 550px) {
  .game-board {
    padding: 4px 8px;
    gap: 6px;
  }

  .game-board__top-bar {
    padding: 3px 8px;
    gap: 8px;
    align-items: center;
    border-radius: 6px;
  }

  .completed-zone__label {
    display: none; /* Masque le libellé pour réduire la hauteur au maximum */
  }

  .completed-slot {
    width: 24px;
    height: 34px;
    border-radius: 4px;
  }

  .completed-slot__symbol {
    font-size: 14px;
  }

  .completed-slot__placeholder {
    font-size: 10px;
  }
}
</style>
