<script setup>
/**
 * Card.vue - Composant d'affichage d'une carte
 *
 * Gère :
 * - L'affichage face visible / face cachée
 * - Le drag & drop HTML5 (une carte ou une séquence commençant par cette carte)
 * - Les effets visuels hover et transitions
 *
 * Props :
 *   card     : objet carte { id, rank, rankLabel, suit, faceUp }
 *   isDraggable : si la carte peut être déplacée (face visible + séquence valide)
 *   isDragging  : si la carte fait partie de la séquence en cours de drag
 *   columnIndex : index de la colonne parente (pour le drag)
 *   cardIndex   : index de la carte dans la colonne (pour identifier la séquence)
 *
 * Emits :
 *   drag-start  : (columnIndex, cardIndex) au début du drag
 *   drag-end    : à la fin du drag
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
    <!-- Face visible : valeur + symbole -->
    <template v-if="card.faceUp">
      <div class="card__corner card__corner--top">
        <span class="card__rank">{{ card.rankLabel }}</span>
        <span class="card__suit">{{ card.suit }}</span>
      </div>
      <div class="card__center">{{ card.suit }}</div>
      <div class="card__corner card__corner--bottom">
        <span class="card__rank">{{ card.rankLabel }}</span>
        <span class="card__suit">{{ card.suit }}</span>
      </div>
    </template>

    <!-- Face cachée : motif décoratif -->
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
}

/* Carte face visible */
.card--face-up {
  background: linear-gradient(145deg, #ffffff 0%, #f0f0f5 100%);
  border: 1px solid #d0d0d8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  color: #1a1a1a;
}

/* Carte face cachée */
.card--face-down {
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
}
.card__corner--top {
  top: 5px;
  left: 6px;
}
.card__corner--bottom {
  bottom: 5px;
  right: 6px;
  transform: rotate(180deg);
}
.card__rank {
  font-size: 14px;
}
.card__suit {
  font-size: 12px;
}

/* Centre de la carte */
.card__center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 32px;
  opacity: 0.85;
}

/* Thème sombre */
:global(body.dark-theme) .card--face-up {
  background: linear-gradient(145deg, #e8e8ee 0%, #d4d4dc 100%);
  border-color: #888;
  color: #0a0a0a;
}
</style>
