/**
 * useStats.js - Statistiques et meilleurs scores (localStorage)
 *
 * Sauvegarde dans localStorage :
 * - Meilleur score
 * - Meilleur temps
 * - Parties jouées / gagnées
 * - Séries de victoires
 */
import { ref } from 'vue'

const STORAGE_KEY = 'spider-solitaire-stats'

// Valeurs par défaut
const defaultStats = {
  bestScore: 0,
  bestTime: Infinity,
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalMoves: 0
}

function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return { ...defaultStats, ...JSON.parse(raw) }
    }
  } catch (e) {
    // Si erreur de parsing, on ignore
  }
  return { ...defaultStats }
}

function saveStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch (e) {
    // Ignore les erreurs de stockage (ex: localStorage plein)
  }
}

export function useStats() {
  const stats = ref(loadStats())

  /**
   * Enregistre une partie terminée (gagnée ou perdue)
   *
   * @param {boolean} won - true si la partie est gagnée
   * @param {number} score - Score final
   * @param {number} time - Temps écoulé en secondes
   * @param {number} moves - Nombre de coups joués (optionnel)
   */
  function recordGame(won, score, time, moves = 0) {
    const s = { ...stats.value }

    s.gamesPlayed += 1
    s.totalMoves += moves

    if (won) {
      s.gamesWon += 1
      s.currentStreak += 1
      if (s.currentStreak > s.bestStreak) {
        s.bestStreak = s.currentStreak
      }
      if (score > s.bestScore) {
        s.bestScore = score
      }
      if (time < s.bestTime) {
        s.bestTime = time
      }
    } else {
      s.currentStreak = 0
    }

    stats.value = s
    saveStats(s)
  }

  /**
   * Calcule le ratio de victoires
   */
  function getWinRate() {
    const s = stats.value
    if (s.gamesPlayed === 0) return 0
    return Math.round((s.gamesWon / s.gamesPlayed) * 100)
  }

  /**
   * Réinitialise toutes les statistiques
   */
  function resetStats() {
    stats.value = { ...defaultStats }
    saveStats(stats.value)
  }

  /**
   * Formate le temps en MM:SS pour l'affichage
   */
  function formatTime(seconds) {
    if (!seconds || seconds === Infinity) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return {
    stats,
    recordGame,
    getWinRate,
    resetStats,
    formatTime
  }
}