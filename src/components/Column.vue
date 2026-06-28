<script setup>
/**
 * Column.vue - Composant représentant une colonne du plateau
 *
 * Rôles :
 * - Afficher les cartes empilées avec décalage vertical
 * - Gérer le drag-over et le drop (cible de dépôt)
 * - Indiquer visuellement si la colonne est une cible valide
 *
 * Props :
 *   columnIndex : index de la colonne
 *   cards       : tableau des cartes de la colonne
 *   draggingFrom : { col, index } ou null - info sur le drag en cours
 *
 * Emits :
 *   card-drag-start : (colIndex, cardIndex) quand une carte commence à être dragguée
 *   card-drag-end   : à la fin du drag
 *   drop            : (fromCol, fromIndex, toCol) quand on dépose sur cette colonne
 */
import Card from './Card.vue'
import { ref, computed } from 'vue'

const props = defineProps({
  columnIndex: { type: Number, required: true },
  cards: { type: Array, required: true },
  draggingFrom: { type: Object, default: null },
  highlightHint: { type: Object, default: null }
})

const emit = defineEmits(['card-drag-start', 'card-drag-end', 'drop', 'card-dblclick'])

// Indique si cette colonne est actuellement survolée par un drag valide
const isDragOver = ref(false)

// Indices des cartes faisant partie de la séquence en cours de drag
const draggingCardIndices = computed(() => {
  if (!props.draggingFrom || props.draggingFrom.col !== props.columnIndex) return new Set()
  const start = props.draggingFrom.index
  const end = props.cards.length
  return new Set(Array.from({ length: end - start }, (_, i) => start + i))
})

// Indices des cartes mises en surbrillance par l'indice
const hintedCardIndices = computed(() => {
  if (!props.highlightHint || props.highlightHint.col !== props.columnIndex) return new Set()
  const start = props.highlightHint.index
  const end = props.cards.length
  return new Set(Array.from({ length: end - start }, (_, i) => start + i))
})

/**
 * Vérifie si une carte peut être dragguée :
 * - elle doit être face visible
 * - elle et toutes les cartes suivantes doivent former une séquence décroissante valide
 */
function isCardDraggable(cardIndex) {
  const card = props.cards[cardIndex]
  if (!card || !card.faceUp) return false
  // Vérifie que les cartes à partir de cardIndex forment une séquence décroissante
  for (let i = cardIndex; i < props.cards.length - 1; i++) {
    if (props.cards[i].rank !== props.cards[i + 1].rank + 1) return false
    if (!props.cards[i + 1].faceUp) return false
  }
  return true
}

function onDragStart(columnIndexFromCard, actualCardIndex) {
  emit('card-drag-start', props.columnIndex, actualCardIndex)
}

function onDragEnd() {
  emit('card-drag-end')
}

function onDragOver(event) {
  // Nécessaire pour autoriser le drop
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
  isDragOver.value = true
}

function onDragLeave(event) {
  // Vérifie qu'on quitte vraiment la colonne (pas un enfant)
  if (event.currentTarget.contains(event.relatedTarget)) return
  isDragOver.value = false
}

function onDrop(event) {
  event.preventDefault()
  isDragOver.value = false
  if (props.draggingFrom) {
    emit('drop', props.draggingFrom.col, props.draggingFrom.index, props.columnIndex)
  }
}

function onCardDblClick(cardIndex) {
  emit('card-dblclick', props.columnIndex, cardIndex)
}
</script>

<template>
  <div
    class="column"
    :class="{ 'column--drag-over': isDragOver, 'column--empty': cards.length === 0 }"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- Emplacement vide : indique où déposer -->
    <div v-if="cards.length === 0" class="column__placeholder">
      <span>♠</span>
    </div>

    <!-- Cartes empilées avec décalage vertical -->
    <div
      v-for="(card, index) in cards"
      :key="card.id"
      class="column__card-wrapper"
      :style="{ top: `${index * 28}px` }"
    >
      <Card
        :card="card"
        :column-index="columnIndex"
        :card-index="index"
        :is-draggable="isCardDraggable(index)"
        :is-dragging="draggingCardIndices.has(index)"
        :is-hinted="hintedCardIndices.has(index)"
        @drag-start="onDragStart"
        @drag-end="onDragEnd"
        @dblclick="onCardDblClick"
      />
    </div>
  </div>
</template>

<style scoped>
.column {
  position: relative;
  width: var(--card-width, 80px);
  min-height: var(--card-height, 112px);
  /* Hauteur dynamique pour permettre le scroll si la colonne est longue */
  height: 100%;
}

.column__card-wrapper {
  position: absolute;
  left: 0;
  transition: top 0.25s ease;
}

.column__placeholder {
  width: var(--card-width, 80px);
  height: var(--card-height, 112px);
  border: 2px dashed rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.15);
}

.column--drag-over .column__placeholder {
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.1);
}

.column--drag-over::after {
  content: '';
  position: absolute;
  inset: -4px;
  border: 2px solid #ffd700;
  border-radius: 10px;
  pointer-events: none;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
  z-index: 200;
}
</style>
