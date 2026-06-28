/**
 * useToast.js - Système de notifications Toast pour le Spider Solitaire
 *
 * Permet d'afficher des messages temporaires (succès, erreur, info)
 * avec une durée configurable et une animation de fondu.
 */
import { ref } from 'vue'

// État partagé entre tous les composants
const toasts = ref([])
let toastId = 0

/**
 * Types de toast disponibles
 */
const TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
}

/**
 * Icônes pour chaque type
 */
const ICONS = {
  [TYPES.SUCCESS]: '✅',
  [TYPES.ERROR]: '❌',
  [TYPES.INFO]: 'ℹ️',
  [TYPES.WARNING]: '⚠️'
}

/**
 * Durée d'affichage par défaut selon le type (en ms)
 */
const DURATIONS = {
  [TYPES.SUCCESS]: 2500,
  [TYPES.ERROR]: 3000,
  [TYPES.INFO]: 2000,
  [TYPES.WARNING]: 3000
}

/**
 * Composable useToast
 * Fonctions : show, success, error, info, warning, remove
 */
export function useToast() {
  /**
   * Ajoute un toast et le retire automatiquement après la durée
   *
   * @param {string} message - Le message à afficher
   * @param {string} type - Type de toast (success, error, info, warning)
   * @param {number} duration - Durée d'affichage en ms (optionnel)
   * @returns {number} L'ID du toast (pour le retirer manuellement)
   */
  function show(message, type = TYPES.INFO, duration) {
    const id = ++toastId
    const toast = {
      id,
      message,
      type,
      icon: ICONS[type] || '',
      duration: duration || DURATIONS[type] || 2500,
      visible: false
    }

    toasts.value.push(toast)

    // Déclenche l'animation d'entrée au prochain tick
    setTimeout(() => {
      const found = toasts.value.find(t => t.id === id)
      if (found) found.visible = true
    }, 10)

    // Retire automatiquement après la durée
    setTimeout(() => {
      remove(id)
    }, toast.duration)

    return id
  }

  function success(message, duration) {
    return show(message, TYPES.SUCCESS, duration)
  }

  function error(message, duration) {
    return show(message, TYPES.ERROR, duration)
  }

  function info(message, duration) {
    return show(message, TYPES.INFO, duration)
  }

  function warning(message, duration) {
    return show(message, TYPES.WARNING, duration)
  }

  /**
   * Retire un toast par son ID avec animation de sortie
   */
  function remove(id) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value[index].visible = false
      // Retire du tableau après l'animation
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
      }, 300)
    }
  }

  /**
   * Vide tous les toasts
   */
  function clear() {
    toasts.value = []
  }

  return {
    toasts,
    show,
    success,
    error,
    info,
    warning,
    remove,
    clear
  }
}