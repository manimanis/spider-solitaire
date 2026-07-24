<script setup>
/**
 * Card.vue - Composant d'affichage d'une carte
 *
 * Gère :
 * - L'affichage face visible / face cachée
 * - Le nombre de pips (♠) correspondant à la valeur de la carte (1 à 10)
 * - Les cartes de figures (J, Q, K)
 * - Le drag & drop HTML5
 * - Les effets visuels hover, hint et transitions
 */
const props = defineProps({
  card: { type: Object, required: true },
  isDraggable: { type: Boolean, default: false },
  isDragging: { type: Boolean, default: false },
  isHinted: { type: Boolean, default: false },
  columnIndex: { type: Number, required: true },
  cardIndex: { type: Number, required: true }
})

const emit = defineEmits(['drag-start', 'drag-end', 'dblclick'])

/**
 * Disposition standard des pips (♠) selon la valeur de la carte (1 à 10)
 * x, y : coordonnées en pourcentage dans le conteneur central (.card__pips)
 * inverted : si true, le symbole est retourné (180°) pour la partie inférieure de la carte
 */
const PIPS_LAYOUT = {
  1: [
    { x: 50, y: 50, isAce: true }
  ],
  2: [
    { x: 50, y: 18 },
    { x: 50, y: 82, inverted: true }
  ],
  3: [
    { x: 50, y: 18 },
    { x: 50, y: 50 },
    { x: 50, y: 82, inverted: true }
  ],
  4: [
    { x: 26, y: 18 },
    { x: 74, y: 18 },
    { x: 26, y: 82, inverted: true },
    { x: 74, y: 82, inverted: true }
  ],
  5: [
    { x: 26, y: 18 },
    { x: 74, y: 18 },
    { x: 50, y: 50 },
    { x: 26, y: 82, inverted: true },
    { x: 74, y: 82, inverted: true }
  ],
  6: [
    { x: 26, y: 18 },
    { x: 74, y: 18 },
    { x: 26, y: 50 },
    { x: 74, y: 50 },
    { x: 26, y: 82, inverted: true },
    { x: 74, y: 82, inverted: true }
  ],
  7: [
    { x: 26, y: 18 },
    { x: 74, y: 18 },
    { x: 50, y: 34 },
    { x: 26, y: 50 },
    { x: 74, y: 50 },
    { x: 26, y: 82, inverted: true },
    { x: 74, y: 82, inverted: true }
  ],
  8: [
    { x: 26, y: 18 },
    { x: 74, y: 18 },
    { x: 50, y: 34 },
    { x: 26, y: 50 },
    { x: 74, y: 50 },
    { x: 50, y: 66, inverted: true },
    { x: 26, y: 82, inverted: true },
    { x: 74, y: 82, inverted: true }
  ],
  9: [
    { x: 26, y: 16 },
    { x: 74, y: 16 },
    { x: 26, y: 38.5 },
    { x: 74, y: 38.5 },
    { x: 50, y: 50 },
    { x: 26, y: 61.5, inverted: true },
    { x: 74, y: 61.5, inverted: true },
    { x: 26, y: 84, inverted: true },
    { x: 74, y: 84, inverted: true }
  ],
  10: [
    { x: 26, y: 16 },
    { x: 74, y: 16 },
    { x: 50, y: 27 },
    { x: 26, y: 38.5 },
    { x: 74, y: 38.5 },
    { x: 26, y: 61.5, inverted: true },
    { x: 74, y: 61.5, inverted: true },
    { x: 50, y: 73, inverted: true },
    { x: 26, y: 84, inverted: true },
    { x: 74, y: 84, inverted: true }
  ]
}

const FACE_CARDS = {
  11: { icon: '⚔️', title: 'Valet' },
  12: { icon: '👑', title: 'Dame' },
  13: { icon: '♚', title: 'Roi' }
}

function getPips(rank) {
  return PIPS_LAYOUT[rank] || []
}

function getFaceCard(rank) {
  return FACE_CARDS[rank] || { icon: '♠', title: '' }
}

/**
 * Démarre le drag : notifie le parent avec la position de la carte
 * pour qu'il puisse identifier toute la séquence à déplacer.
 */
function onDragStart(event) {
  emit('drag-start', props.columnIndex, props.cardIndex)
  // Données transférées (utiles si on veut interagir avec d'autres éléments)
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', `${props.columnIndex}:${props.cardIndex}`)
  // Rend le fantôme de drag semi-transparent
  event.target.style.opacity = '0.4'
}

function onDragEnd(event) {
  event.target.style.opacity = '1'
  emit('drag-end')
}

function onDblClick() {
  if (props.isDraggable) {
    emit('dblclick', props.cardIndex)
  }
}
</script>

<template>
  <div
    class="card"
    :class="{
      'card--face-down': !card.faceUp,
      'card--face-up': card.faceUp,
      'card--draggable': isDraggable,
      'card--dragging': isDragging,
      'card--hinted': isHinted
    }"
    :draggable="isDraggable"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @dblclick="onDblClick"
  >
    <!-- Face visible -->
    <template v-if="card.faceUp">
      <!-- Coin supérieur gauche -->
      <div class="card__corner card__corner--top">
        <span class="card__rank">{{ card.rankLabel }}</span>
        <span class="card__suit">{{ card.suit }}</span>
      </div>

      <!-- Centre de la carte : Nombre de pips ♠ (1 à 10) -->
      <div
        v-if="card.rank >= 1 && card.rank <= 10"
        class="card__pips"
        :class="`card__pips--rank-${card.rank}`"
      >
        <span
          v-for="(pip, i) in getPips(card.rank)"
          :key="i"
          class="card__pip"
          :class="{ 'card__pip--ace': pip.isAce, 'card__pip--inverted': pip.inverted }"
          :style="{
            left: `${pip.x}%`,
            top: `${pip.y}%`,
            transform: `translate(-50%, -50%) ${pip.inverted ? 'rotate(180deg)' : ''}`
          }"
        >
          {{ card.suit }}
        </span>
      </div>

      <!-- Centre de la carte : Figures (J, Q, K) -->
      <div v-else class="card__face-figure">
        <span class="card__face-icon">{{ getFaceCard(card.rank).icon }}</span>
        <span class="card__face-suit">♠</span>
      </div>

      <!-- Coin inférieur droit -->
      <div class="card__corner card__corner--bottom">
        <span class="card__rank">{{ card.rankLabel }}</span>
        <span class="card__suit">{{ card.suit }}</span>
      </div>
    </template>

    <!-- Face cachée -->
    <template v-else>
      <div class="card__back-pattern"></div>
    </template>
  </div>
</template>

<style scoped>
.card {
  width: var(--card-width, 100%);
  height: var(--card-height, 112px);
  border-radius: 8px;
  position: relative;
  user-select: none;
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
  flex-shrink: 0;
  cursor: default;
  isolation: isolate;
  background-color: #ffffff;
}

/* Carte face visible */
.card--face-up {
  background-color: #ffffff;
  background: linear-gradient(145deg, #ffffff 0%, #f0f0f5 100%);
  border: 1px solid #d0d0d8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  color: #1a1a1a;
}

/* Carte face cachée */
.card--face-down {
  background-color: #1f1f2e;
  background:
    repeating-linear-gradient(45deg, #2a2a3a 0 6px, #1f1f2e 6px 12px);
  border: 1px solid #15151f;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4), inset 0 0 0 3px #4a4a5e,
    inset 0 0 0 4px #1f1f2e;
}

.card--face-down::after {
  content: '♠';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 32px;
  color: rgba(180, 180, 200, 0.25);
}

/* Carte draggable : curseur grab + effet hover */
.card--draggable {
  cursor: grab;
}
.card--draggable:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25);
  z-index: 100;
}
.card--draggable:active {
  cursor: grabbing;
}

/* Carte en cours de drag */
.card--dragging {
  opacity: 0.3;
  transform: scale(0.95);
}

/* Carte suggérée par l'indice */
.card--hinted {
  animation: hintPulse 1s ease-in-out 3;
  box-shadow: 0 0 0 3px #ffd700, 0 0 16px rgba(255, 215, 0, 0.6);
  z-index: 50;
  border-color: #ffd700;
}

@keyframes hintPulse {
  0%, 100% {
    box-shadow: 0 0 0 3px #ffd700, 0 0 12px rgba(255, 215, 0, 0.4);
    transform: translateY(0);
  }
  50% {
    box-shadow: 0 0 0 5px #ffd700, 0 0 24px rgba(255, 215, 0, 0.8);
    transform: translateY(-2px);
  }
}

/* Coins (valeur + symbole) */
.card__corner {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
  font-weight: 700;
  z-index: 2;
}
.card__corner--top {
  top: 4px;
  left: 5px;
}
.card__corner--bottom {
  bottom: 4px;
  right: 5px;
  transform: rotate(180deg);
}
.card__rank {
  font-size: 13px;
}
.card__suit {
  font-size: 11px;
}

/* Zone des pips (cartes 1 à 10) */
.card__pips {
  position: absolute;
  top: 16px;
  bottom: 16px;
  left: 14px;
  right: 14px;
  pointer-events: none;
  z-index: 1;
}

.card__pip {
	position: absolute;
	font-size: 28px;
	line-height: 1;
	user-select: none;
	color: #1a1a1a;
	transition: transform 0.15s ease;
}

/* Ace : un seul grand symbole central */
.card__pip--ace {
  font-size: 32px;
  opacity: 0.9;
}

/* Ajustement fin de la taille pour la lisibilité sur 7-10 */
.card__pips--rank-7 .card__pip,
.card__pips--rank-8 .card__pip {
  font-size: 28px;
}

.card__pips--rank-9 .card__pip,
.card__pips--rank-10 .card__pip {
  font-size: 28px;
}

/* Figures (J, Q, K) */
.card__face-figure {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50%;
  height: 60%;
  border: 1px dashed rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  pointer-events: none;
  z-index: 1;
}

.card__face-icon {
  font-size: 22px;
  line-height: 1;
}

.card__face-suit {
  font-size: 16px;
  line-height: 1;
  opacity: 0.85;
}

/* Thème sombre */
:global(body.dark-theme) .card--face-up {
  background: linear-gradient(145deg, #e8e8ee 0%, #d4d4dc 100%);
  border-color: #888;
  color: #0a0a0a;
}
</style>
