<script setup>
/**
 * ToastContainer.vue - Conteneur de notifications toast
 *
 * Affiche les messages temporaires en haut à droite de l'écran
 * avec une animation d'entrée/sortie.
 */
import { computed } from 'vue'
import { useToast } from '../composables/useToast'

const { toasts } = useToast()

const ICONS = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️'
}

const COLORS = {
  success: 'var(--toast-success, #4a8a5a)',
  error: 'var(--toast-error, #c0392b)',
  info: 'var(--toast-info, #2980b9)',
  warning: 'var(--toast-warning, #d4a017)'
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="[`toast--${toast.type}`, { 'toast--visible': toast.visible }]"
          :style="{ '--toast-accent': COLORS[toast.type] || COLORS.info }"
        >
          <span class="toast__icon">{{ toast.icon || ICONS[toast.type] }}</span>
          <span class="toast__message">{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
  max-width: 360px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  background: rgba(20, 30, 25, 0.95);
  border: 1px solid var(--toast-accent, rgba(255, 255, 255, 0.15));
  border-left: 4px solid var(--toast-accent, rgba(255, 255, 255, 0.15));
  border-radius: 8px;
  color: #e8e8e8;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  pointer-events: auto;
  backdrop-filter: blur(8px);
  transform: translateX(120%);
  opacity: 0;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 0.25s ease;
}

.toast--visible {
  transform: translateX(0);
  opacity: 1;
}

.toast__icon {
  font-size: 18px;
  flex-shrink: 0;
}

.toast__message {
  flex: 1;
  line-height: 1.4;
}

/* Animation d'entrée/sortie avec TransitionGroup */
.toast-enter-active {
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 0.3s ease;
}
.toast-leave-active {
  transition: transform 0.25s ease-in,
              opacity 0.2s ease;
}
.toast-enter-from {
  transform: translateX(120%);
  opacity: 0;
}
.toast-leave-to {
  transform: translateX(80%);
  opacity: 0;
}
</style>
