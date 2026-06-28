<script setup>
/**
 * Deck.vue - Composant représentant le paquet (stock)
 *
 * Rôles :
 * - Afficher le paquet de cartes restantes (visuellement empilé)
 * - Indiquer combien de distributions restent
 * - Permettre de cliquer pour distribuer 10 cartes
 * - Désactiver le clic si la distribution est impossible (colonne vide)
 *
 * Props :
 *   cardsCount   : nombre de cartes restantes dans le stock
 *   dealsLeft    : nombre de distributions restantes
 *   canDeal      : boolean, indique si la distribution est autorisée
 *
 * Emits :
 *   deal : pour déclencher la distribution
 */
defineProps({
  cardsCount: { type: Number, required: true },
  dealsLeft: { type: Number, required: true },
  canDeal: { type: Boolean, default: true }
})

const emit = defineEmits(['deal'])

function onClick() {
  emit('deal')
}
</script>

<template>
  <div class="deck">
    <div
      class="deck__stack"
      :class="{ 'deck__stack--empty': cardsCount === 0, 'deck__stack--disabled': !canDeal && cardsCount > 0 }"
      @click="onClick"
    >
      <!-- Couches empilées pour l'effet 3D -->
      <div v-if="cardsCount > 0" class="deck__layer deck__layer--3"></div>
      <div v-if="cardsCount > 10" class="deck__layer deck__layer--2"></div>
      <div v-if="cardsCount > 20" class="deck__layer deck__layer--1"></div>
      <div v-if="cardsCount > 30" class="deck__layer deck__layer--0"></div>

      <!-- Carte du dessus -->
      <div v-if="cardsCount > 0" class="deck__top">
        <span class="deck__symbol">♠</span>
      </div>

      <!-- Paquet vide -->
      <div v-else class="deck__empty">
        <span>Vide</span>
      </div>
    </div>

    <div class="deck__info">
      <div class="deck__label">Paquet</div>
      <div class="deck__count">{{ dealsLeft }} distribution{{ dealsLeft > 1 ? 's' : '' }}</div>
      <div class="deck__cards-count">{{ cardsCount }} cartes</div>
    </div>
  </div>
</template>

<style scoped>
.deck {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.deck__stack {
  position: relative;
  width: var(--card-width, 80px);
  height: var(--card-height, 112px);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.deck__stack:hover:not(.deck__stack--disabled):not(.deck__stack--empty) {
  transform: translateY(-4px) scale(1.03);
}

.deck__stack:active:not(.deck__stack--disabled):not(.deck__stack--empty) {
  transform: translateY(-1px) scale(0.98);
}

.deck__stack--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.deck__stack--empty {
  cursor: default;
  opacity: 0.4;
}

/* Couches empilées (effet 3D) */
.deck__layer {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background: repeating-linear-gradient(45deg, #2a2a3a 0 6px, #1f1f2e 6px 12px);
  border: 1px solid #15151f;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
}
.deck__layer--3 { transform: translate(3px, 3px); }
.deck__layer--2 { transform: translate(2px, 2px); }
.deck__layer--1 { transform: translate(1px, 1px); }
.deck__layer--0 { transform: translate(0, 0); }

/* Carte du dessus */
.deck__top {
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background: repeating-linear-gradient(45deg, #2a2a3a 0 6px, #1f1f2e 6px 12px);
  border: 1px solid #15151f;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.5), inset 0 0 0 3px #4a4a5e, inset 0 0 0 4px #1f1f2e;
  display: flex;
  align-items: center;
  justify-content: center;
}
.deck__top::after {
  content: '♠';
  font-size: 32px;
  color: rgba(180, 180, 200, 0.25);
}

.deck__empty {
  position: absolute;
  inset: 0;
  border: 2px dashed rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.3);
  font-size: 14px;
}

.deck__info {
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}
.deck__label {
  font-weight: 700;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2px;
}
.deck__count {
  font-size: 11px;
}
.deck__cards-count {
  font-size: 10px;
  opacity: 0.6;
}
</style>
