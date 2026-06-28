/**
 * useGame.js - Composable principal contenant la logique métier du Spider Solitaire
 *
 * Règles implémentées :
 * - 1 seule couleur (♠ Pique) - 104 cartes (8 jeux de 13 cartes)
 * - 10 colonnes : 4 colonnes de 6 cartes, 6 colonnes de 5 cartes
 * - Déplacement de séquences décroissantes de même couleur
 * - Retrait automatique des suites complètes K → A
 * - Paquet (stock) de 50 cartes distribuées 10 par 10
 * - Victoire quand 8 suites sont complétées
 */

import { ref, computed } from 'vue'

// Constantes du jeu
const TOTAL_CARDS = 104 // 8 × 13 cartes (A → K de ♠)
const NUM_COLUMNS = 10
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const SUIT = '♠'

/**
 * Crée un jeu complet de 104 cartes (8 jeux de 13 cartes de pique)
 * Chaque carte a un id unique pour le suivi Vue
 */
function createDeck() {
  const cards = []
  let idCounter = 0
  // 8 jeux de 13 cartes
  for (let deck = 0; deck < 8; deck++) {
    for (let rank = 1; rank <= 13; rank++) {
      cards.push({
        id: idCounter++,
        rank,           // 1 (As) → 13 (Roi)
        rankLabel: RANKS[rank - 1],
        suit: SUIT,
        faceUp: false
      })
    }
  }
  return cards
}

/**
 * Mélange un tableau (algorithme Fisher-Yates)
 */
function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function useGame() {
  // ============ ÉTAT RÉACTIF ============
  // 10 colonnes de cartes
  const columns = ref(Array.from({ length: NUM_COLUMNS }, () => []))
  // Paquet (stock) - 50 cartes restantes après distribution initiale
  const stock = ref([])
  // Nombre de suites complétées (objectif: 8 pour gagner)
  const completedSequences = ref(0)
  // Score (commence à 500, -1 par coup, +100 par suite)
  const score = ref(500)
  // Historique des coups pour le bouton Annuler
  const history = ref([])
  // Temps écoulé en secondes
  const elapsedSeconds = ref(0)
  // Indique si la partie est gagnée
  const isWon = ref(false)
  // Indique si le minuteur est en cours
  const isTimerRunning = ref(false)
  // ID du minuteur
  let timerInterval = null

  // ============ GETTERS / COMPUTED ============

  // Nombre de distributions restantes (10 cartes par distribution)
  const dealsLeft = computed(() => Math.ceil(stock.value.length / NUM_COLUMNS))

  // Progression vers la victoire (0 → 100%)
  const progress = computed(() => (completedSequences.value / 8) * 100)

  // Nombre total de cartes encore en jeu (hors stock et suites complétées)
  const cardsInPlay = computed(() =>
    columns.value.reduce((sum, col) => sum + col.length, 0)
  )

  // ============ LOGIQUE DE JEU ============

  /**
   * Démarre une nouvelle partie :
   * - Crée et mélange les 104 cartes
   * - Distribue 54 cartes dans les 10 colonnes
   * - Met 50 cartes dans le stock
   */
  function newGame() {
    // Réinitialise l'état
    columns.value = Array.from({ length: NUM_COLUMNS }, () => [])
    stock.value = []
    completedSequences.value = 0
    score.value = 500
    history.value = []
    elapsedSeconds.value = 0
    isWon.value = false
    stopTimer()

    const deck = shuffle(createDeck())

    // Distribution initiale :
    // Colonnes 0-3 : 6 cartes (5 cachées + 1 visible)
    // Colonnes 4-9 : 5 cartes (4 cachées + 1 visible)
    let cardIndex = 0
    for (let col = 0; col < NUM_COLUMNS; col++) {
      const cardsInColumn = col < 4 ? 6 : 5
      for (let i = 0; i < cardsInColumn; i++) {
        const card = { ...deck[cardIndex++] }
        // Seule la dernière carte de chaque colonne est face visible
        card.faceUp = (i === cardsInColumn - 1)
        columns.value[col].push(card)
      }
    }

    // Le reste va dans le stock (50 cartes)
    stock.value = deck.slice(cardIndex)

    startTimer()
  }

  /**
   * Vérifie si une séquence de cartes (à partir d'un index) forme une
   * séquence décroissante valide de même couleur.
   * En mode 1 couleur, toutes les cartes sont de la même couleur,
   * il suffit donc de vérifier l'ordre décroissant.
   *
   * @param {Array} column - La colonne source
   * @param {number} fromIndex - Index de départ dans la colonne
   * @returns {boolean}
   */
  function isValidSequence(column, fromIndex) {
    // Sécurité : fromIndex doit être un index valide dans la colonne
    if (fromIndex < 0 || fromIndex >= column.length) return false
    for (let i = fromIndex; i < column.length; i++) {
      // Toutes les cartes de la séquence doivent être face visible
      if (!column[i].faceUp) return false
      // À partir de la 2ème carte, elle doit avoir un rang juste inférieur
      if (i > fromIndex) {
        if (column[i - 1].rank !== column[i].rank + 1) return false
      }
    }
    return true
  }

  /**
   * Vérifie si on peut déposer une carte (ou séquence commençant par cette carte)
   * sur une colonne cible.
   * Règle : la carte doit être posée sur une carte de rang supérieur de 1,
   * ou sur une colonne vide.
   *
   * @param {Object} draggedCard - La première carte de la séquence déplacée
   * @param {number} targetColIndex - Index de la colonne cible
   * @returns {boolean}
   */
  function canDropOn(draggedCard, targetColIndex) {
    // Sécurité : draggedCard doit être définie
    if (!draggedCard) return false
    const targetColumn = columns.value[targetColIndex]
    if (!targetColumn) return false
    // Colonne vide : on peut toujours y poser
    if (targetColumn.length === 0) return true
    const topCard = targetColumn[targetColumn.length - 1]
    // La carte du dessus doit être face visible et avoir un rang supérieur de 1
    return topCard.faceUp && topCard.rank === draggedCard.rank + 1
  }

  /**
   * Sauvegarde l'état actuel dans l'historique (pour annulation)
   */
  function pushHistory() {
    // Limite l'historique à 50 coups pour économiser la mémoire
    if (history.value.length >= 50) {
      history.value.shift()
    }
    history.value.push({
      columns: columns.value.map(col => col.map(c => ({ ...c }))),
      stock: stock.value.map(c => ({ ...c })),
      completedSequences: completedSequences.value,
      score: score.value
    })
  }

  /**
   * Annule le dernier coup
   */
  function undo() {
    if (history.value.length === 0) return
    const last = history.value.pop()
    columns.value = last.columns
    stock.value = last.stock
    completedSequences.value = last.completedSequences
    score.value = Math.max(0, last.score - 5) // Pénalité d'annulation
    isWon.value = false
  }

  /**
   * Déplace une séquence de cartes d'une colonne à une autre
   *
   * @param {number} fromCol - Index colonne source
   * @param {number} fromIndex - Index de départ dans la colonne source
   * @param {number} toCol - Index colonne cible
   * @returns {boolean} true si le déplacement a réussi
   */
  function moveCards(fromCol, fromIndex, toCol) {
    if (fromCol === toCol) return false

    const sourceColumn = columns.value[fromCol]
    const targetColumn = columns.value[toCol]

    // Vérifie que la séquence est valide
    if (!isValidSequence(sourceColumn, fromIndex)) return false

    const draggedCards = sourceColumn.slice(fromIndex)
    // Vérifie qu'on peut déposer sur la cible
    if (!canDropOn(draggedCards[0], toCol)) return false

    // Sauvegarde l'état avant modification
    pushHistory()

    // Effectue le déplacement
    columns.value[fromCol] = sourceColumn.slice(0, fromIndex)
    columns.value[toCol] = [...targetColumn, ...draggedCards]

    // Retourne la carte du dessus de la colonne source si elle est face cachée
    const newSourceColumn = columns.value[fromCol]
    if (newSourceColumn.length > 0 && !newSourceColumn[newSourceColumn.length - 1].faceUp) {
      newSourceColumn[newSourceColumn.length - 1].faceUp = true
    }

    // Pénalité de score pour un déplacement
    score.value = Math.max(0, score.value - 1)

    // Vérifie et retire les suites complètes
    checkCompleteSequence(toCol)
    checkCompleteSequence(fromCol)

    // Vérifie la victoire
    checkWin()

    return true
  }

  /**
   * Vérifie si la dernière carte d'une colonne termine une suite K → A
   * complète. Si oui, retire les 13 cartes et incrémente le compteur.
   *
   * @param {number} colIndex - Index de la colonne à vérifier
   */
  function checkCompleteSequence(colIndex) {
    const column = columns.value[colIndex]
    if (column.length < 13) return

    // Vérifie les 13 dernières cartes : K(13) → Q(12) → ... → A(1)
    const startIdx = column.length - 13
    for (let i = 0; i < 13; i++) {
      const card = column[startIdx + i]
      if (!card.faceUp) return
      if (card.rank !== 13 - i) return
    }

    // Suite complète trouvée ! On retire les 13 cartes.
    columns.value[colIndex] = column.slice(0, startIdx)
    completedSequences.value += 1
    score.value += 100 // Bonus de suite complétée

    // Retourne la carte nouvellement exposée
    const newColumn = columns.value[colIndex]
    if (newColumn.length > 0 && !newColumn[newColumn.length - 1].faceUp) {
      newColumn[newColumn.length - 1].faceUp = true
    }
  }

  /**
   * Distribue 10 cartes du stock (une par colonne).
   * Impossible si une colonne est vide (règle du Spider).
   */
  function dealFromStock() {
    if (stock.value.length === 0) return false
    // Règle : on ne peut pas distribuer si une colonne est vide
    if (columns.value.some(col => col.length === 0)) {
      return false
    }

    pushHistory()

    // Distribue une carte face visible sur chaque colonne
    for (let i = 0; i < NUM_COLUMNS; i++) {
      if (stock.value.length === 0) break
      const card = { ...stock.value.shift(), faceUp: true }
      columns.value[i].push(card)
    }

    // Après distribution, vérifie les suites complètes sur toutes les colonnes
    for (let i = 0; i < NUM_COLUMNS; i++) {
      checkCompleteSequence(i)
    }

    checkWin()
    return true
  }

  /**
   * Vérifie si la partie est gagnée (8 suites complétées)
   */
  function checkWin() {
    if (completedSequences.value === 8) {
      isWon.value = true
      stopTimer()
    }
  }

  // ============ MINUTEUR ============

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval)
    isTimerRunning.value = true
    timerInterval = setInterval(() => {
      elapsedSeconds.value += 1
    }, 1000)
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    isTimerRunning.value = false
  }

  /**
   * Formate le temps en MM:SS
   */
  const formattedTime = computed(() => {
    const mins = Math.floor(elapsedSeconds.value / 60)
    const secs = elapsedSeconds.value % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  })

  // ============ INDICE ET DÉPLACEMENT AUTO ============

  /**
   * Trouve la meilleure colonne où déposer la carte à un index donné.
   * Cherche une colonne dont la carte du dessus est exactement
   * draggedCard.rank + 1 (une carte de rang supérieur).
   * Priorise les colonnes non vides, puis la première colonne vide.
   *
   * @param {number} cardIndex - Index de la carte dans sa colonne
   * @param {number} fromCol - Index de la colonne source
   * @returns {number|null} Index de la colonne cible ou null
   */
  function findBestMove(cardIndex, fromCol) {
    const sourceColumn = columns.value[fromCol]
    const draggedCard = sourceColumn[cardIndex]
    if (!draggedCard) return null

    const bestTarget = { col: null, priority: -1 }

    for (let col = 0; col < NUM_COLUMNS; col++) {
      if (col === fromCol) continue
      const target = columns.value[col]

      // Colonne vide (priorité basse)
      if (target.length === 0) {
        if (bestTarget.priority < 0) {
          bestTarget.col = col
          bestTarget.priority = 0
        }
        continue
      }

      const topCard = target[target.length - 1]
      if (topCard.faceUp && topCard.rank === draggedCard.rank + 1) {
        // Priorité : placer sur une colonne déjà longue plutôt que vide
        // pour libérer des colonnes vides pour les distributions
        bestTarget.col = col
        bestTarget.priority = target.length
      }
    }

    return bestTarget.col
  }

  /**
   * Trouve un coup possible pour l'indice.
   * Parcourt toutes les colonnes et cartes face visible pour trouver
   * une séquence valide déplaçable.
   *
   * @returns {{
   *   col: number,
   *   index: number,
   *   targetCol: number,
   *   cardLabel: string,
   *   sequenceLength: number,
   *   targetLabel: string
   * } | null}
   */
  function getHint() {
    for (let col = 0; col < NUM_COLUMNS; col++) {
      const column = columns.value[col]
      for (let i = column.length - 1; i >= 0; i--) {
        const card = column[i]
        if (!card || !card.faceUp) continue
        // Vérifie que la séquence à partir de i est valide
        if (!isValidSequence(column, i)) continue
        // Trouve la meilleure cible
        const targetCol = findBestMove(i, col)
        if (targetCol !== null) {
          // Vérifie qu'on peut bien déposer
          if (canDropOn(card, targetCol)) {
            const targetColumn = columns.value[targetCol]
            const topTarget = targetColumn[targetColumn.length - 1]
            const targetLabel = topTarget ? `${topTarget.rankLabel}♠` : 'colonne vide'
            return {
              col,
              index: i,
              targetCol,
              cardLabel: `${card.rankLabel}♠`,
              sequenceLength: column.length - i,
              targetLabel
            }
          }
        }
      }
    }
    return null
  }

  return {
    // État
    columns,
    stock,
    completedSequences,
    score,
    history,
    elapsedSeconds,
    isWon,
    isTimerRunning,
    // Computed
    dealsLeft,
    progress,
    cardsInPlay,
    formattedTime,
    // Actions
    newGame,
    moveCards,
    dealFromStock,
    undo,
    findBestMove,
    getHint,
    isValidSequence,
    canDropOn
  }
}
