import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { INITIAL_BALANCE } from '../game/levels.js'

export const useGameStore = defineStore('game', () => {
  // State
  const balance = ref(INITIAL_BALANCE)
  const stats = ref({
    totalRounds: 0,
    wins: 0,
    losses: 0,
    totalWon: 0,
    totalLost: 0,
    currentStreak: 0,
    bestStreak: 0,
  })
  const currentScreen = ref('menu') // menu | tutorial | game | result
  const tutorialStep = ref(0)
  const tutorialDone = ref(false)

  // Current round state
  const round = ref({
    seed: null,
    level: null,
    bet: null,
    answer: null,
    playerChoice: null,
    phase: 'idle', // idle | playing | tension | choosing | resolving | result
    patternInfo: null,
    result: null,
  })

  // Computed
  const winRate = computed(() => {
    if (stats.value.totalRounds === 0) return 0
    return Math.round((stats.value.wins / stats.value.totalRounds) * 100)
  })

  const canPlay = computed(() => balance.value >= 10)

  // Actions
  function setScreen(screen) {
    currentScreen.value = screen
  }

  function startRound(seed, level, bet) {
    round.value = {
      seed,
      level,
      bet,
      answer: null,
      playerChoice: null,
      phase: 'playing',
      patternInfo: null,
      result: null,
    }
  }

  function setRoundPhase(phase) {
    round.value.phase = phase
  }

  function setPatternInfo(info) {
    round.value.patternInfo = info
  }

  function setPlayerChoice(choice) {
    round.value.playerChoice = choice
  }

  function setResult(result) {
    round.value.result = result
    round.value.phase = 'result'

    // Update stats
    stats.value.totalRounds++

    if (result.correct) {
      stats.value.wins++
      stats.value.totalWon += result.winnings
      stats.value.currentStreak++
      if (stats.value.currentStreak > stats.value.bestStreak) {
        stats.value.bestStreak = stats.value.currentStreak
      }
      balance.value += result.winnings
    } else {
      stats.value.losses++
      stats.value.totalLost += result.loss
      stats.value.currentStreak = 0
    }
  }

  function placeBet(amount) {
    if (amount <= balance.value) {
      balance.value -= amount
      return true
    }
    return false
  }

  function resetRound() {
    round.value = {
      seed: null,
      level: null,
      bet: null,
      answer: null,
      playerChoice: null,
      phase: 'idle',
      patternInfo: null,
      result: null,
    }
  }

  function completeTutorial() {
    tutorialDone.value = true
    currentScreen.value = 'game'
  }

  function nextTutorialStep() {
    tutorialStep.value++
    if (tutorialStep.value >= 3) {
      completeTutorial()
    }
  }

  function resetBalance() {
    balance.value = INITIAL_BALANCE
  }

  return {
    balance,
    stats,
    currentScreen,
    tutorialStep,
    tutorialDone,
    round,
    winRate,
    canPlay,
    setScreen,
    startRound,
    setRoundPhase,
    setPatternInfo,
    setPlayerChoice,
    setResult,
    placeBet,
    resetRound,
    completeTutorial,
    nextTutorialStep,
    resetBalance,
  }
})
