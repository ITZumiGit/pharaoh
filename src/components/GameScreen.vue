<template>
  <div class="game-screen">
    <!-- Header -->
    <div class="game-header">
      <button class="back-btn" @click="goBack">←</button>
      <div class="header-balance">
        <span class="chip-icon">🪙</span>
        {{ store.balance }}
      </div>
      <div class="level-badge" :style="{ borderColor: levelConfig.color }">
        {{ levelConfig.icon }} x{{ levelConfig.multiplier }}
      </div>
    </div>

    <!-- Phase: Level & Bet Selection -->
    <div v-if="round.phase === 'idle'" class="setup-phase">
      <!-- Level Selection -->
      <div class="section">
        <h3 class="section-title">Уровень</h3>
        <div class="level-cards">
          <div
            v-for="lvl in [1, 2, 3]"
            :key="lvl"
            class="level-card"
            :class="{ active: selectedLevel === lvl }"
            :style="selectedLevel === lvl ? { borderColor: levels[lvl].color, background: levels[lvl].color + '15' } : {}"
            @click="selectedLevel = lvl"
          >
            <div class="level-icon">{{ levels[lvl].icon }}</div>
            <div class="level-name">{{ levels[lvl].name }}</div>
            <div class="level-mult">x{{ levels[lvl].multiplier }}</div>
          </div>
        </div>
        <p class="level-desc">{{ levels[selectedLevel].description }}</p>
      </div>

      <!-- Bet Selection -->
      <BetPanel
        :balance="store.balance"
        :min-bet="10"
        :step="10"
        v-model="betAmount"
      />

      <!-- Play Button -->
      <button
        class="btn btn-gold start-btn"
        @click="startRound"
        :disabled="betAmount > store.balance || betAmount < 10"
      >
        🎵 Играть
      </button>
    </div>

    <!-- Phase: Playing Music -->
    <div v-if="round.phase === 'playing' || round.phase === 'tension'" class="music-phase">
      <div class="pattern-info" v-if="round.patternInfo">
        <span class="key-badge">{{ round.patternInfo.key }}</span>
        <span class="bpm-badge">{{ round.patternInfo.bpm }} BPM</span>
      </div>

      <MusicPlayer :active="true" :phase="round.phase" />

      <div class="phase-label">
        <span v-if="round.phase === 'playing'" class="label-text building">
          🎼 Напряжение нарастает...
        </span>
        <span v-if="round.phase === 'tension'" class="label-text tension">
          ⚡ Точка напряжения!
        </span>
      </div>
    </div>

    <!-- Phase: Choosing -->
    <div v-if="round.phase === 'choosing'" class="choosing-phase">
      <div class="timer-display" :class="{ urgent: timeLeft <= 3 }">
        <svg class="timer-ring" viewBox="0 0 60 60">
          <circle class="timer-bg" cx="30" cy="30" r="26" />
          <circle
            class="timer-progress"
            cx="30" cy="30" r="26"
            :stroke-dashoffset="timerDashoffset"
          />
        </svg>
        <span class="timer-text">{{ timeLeft }}</span>
      </div>

      <p class="choice-prompt">Что будет дальше?</p>

      <ChoiceButtons
        :disabled="round.playerChoice !== null"
        @choose="makeChoice"
      />
    </div>

    <!-- Phase: Resolving -->
    <div v-if="round.phase === 'resolving'" class="resolving-phase">
      <MusicPlayer :active="true" phase="resolving" />
      <p class="resolving-text">🎵 Раскрытие...</p>
    </div>

    <!-- Phase: Result -->
    <div v-if="round.phase === 'result'" class="result-phase">
      <ResultScreen
        :result="round.result"
        :answer="round.answer"
        :choice="round.playerChoice"
        :bet="round.bet"
        :multiplier="levelConfig.multiplier"
        @play-again="playAgain"
        @back="goBack"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useGameStore } from '../stores/gameStore.js'
import { LEVELS } from '../game/levels.js'
import { generateSeed, getAnswerFromSeed, checkAnswer, getTelegramUserId } from '../game/engine.js'
import { getScheduler } from '../audio/scheduler.js'
import BetPanel from './BetPanel.vue'
import MusicPlayer from './MusicPlayer.vue'
import ChoiceButtons from './ChoiceButtons.vue'
import ResultScreen from './ResultScreen.vue'

const store = useGameStore()
const scheduler = getScheduler()
const levels = LEVELS

const selectedLevel = ref(1)
const betAmount = ref(10)
const timeLeft = ref(10)
let timerInterval = null

const round = computed(() => store.round)
const levelConfig = computed(() => LEVELS[round.value.level || selectedLevel.value])
const timerDashoffset = computed(() => {
  const circumference = 2 * Math.PI * 26 // 163.36
  const progress = timeLeft.value / 10
  return circumference * (1 - progress)
})

function startRound() {
  const userId = getTelegramUserId()
  const seed = generateSeed(userId)
  const answer = getAnswerFromSeed(seed)
  const level = selectedLevel.value
  const bet = betAmount.value

  // Deduct bet from balance
  if (!store.placeBet(bet)) return

  store.startRound(seed, level, bet)

  // Start audio playback
  const patternInfo = scheduler.playPattern({
    seed,
    answer,
    level,
    onTensionPoint: () => {
      // After tension point + brief pause, switch to choosing
      setTimeout(() => {
        store.setRoundPhase('choosing')
        startTimer()
      }, 800)
    },
    onComplete: () => {
      // Music ended but we may still be choosing
    }
  })

  store.setPatternInfo(patternInfo)
}

function startTimer() {
  timeLeft.value = 10
  clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      clearInterval(timerInterval)
      // Auto-lose if time ran out
      if (!round.value.playerChoice) {
        makeChoice('TIMEOUT')
      }
    }
  }, 1000)
}

function makeChoice(choice) {
  clearInterval(timerInterval)
  store.setPlayerChoice(choice)
  store.setRoundPhase('resolving')

  const { seed, bet, level } = round.value
  const multiplier = LEVELS[level].multiplier
  const answer = getAnswerFromSeed(seed)

  // Play resolution
  scheduler.playResolution({
    seed,
    answer,
    level,
    onComplete: () => {
      // Check result
      const result = checkAnswer(seed, choice, bet, multiplier)
      store.setResult(result)
    }
  })
}

function playAgain() {
  scheduler.stop()
  store.resetRound()
  betAmount.value = Math.min(betAmount.value, store.balance)
}

function goBack() {
  scheduler.stop()
  clearInterval(timerInterval)
  store.resetRound()
  store.setScreen('menu')
}

onUnmounted(() => {
  scheduler.stop()
  clearInterval(timerInterval)
})
</script>

<style scoped>
.game-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid rgba(212, 168, 67, 0.15);
}

.back-btn {
  background: none;
  border: none;
  color: var(--gold);
  font-size: 22px;
  cursor: pointer;
  padding: 4px 8px;
  -webkit-tap-highlight-color: transparent;
}

.header-balance {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 18px;
  font-weight: 600;
  color: var(--gold-light);
}

.chip-icon {
  font-size: 16px;
}

.level-badge {
  padding: 4px 10px;
  border-radius: 20px;
  border: 1.5px solid;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

/* Setup Phase */
.setup-phase {
  flex: 1;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeIn 0.3s ease;
}

.section-title {
  font-family: var(--font-display);
  font-size: 16px;
  color: var(--text-secondary);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.level-cards {
  display: flex;
  gap: 10px;
}

.level-card {
  flex: 1;
  padding: 14px 8px;
  border-radius: 12px;
  border: 1.5px solid var(--bg-card-hover);
  background: var(--bg-card);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.level-card.active {
  transform: scale(1.02);
}

.level-card:active {
  transform: scale(0.97);
}

.level-icon {
  font-size: 28px;
  margin-bottom: 4px;
}

.level-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.level-mult {
  font-size: 18px;
  font-weight: 700;
  color: var(--gold);
}

.level-desc {
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.4;
}

.start-btn {
  width: 100%;
  height: 52px;
  font-size: 18px;
  font-family: var(--font-display);
  letter-spacing: 1px;
  margin-top: auto;
}

/* Music Phase */
.music-phase {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

.pattern-info {
  display: flex;
  gap: 8px;
}

.key-badge, .bpm-badge {
  padding: 4px 12px;
  border-radius: 20px;
  background: var(--bg-card);
  border: 1px solid rgba(212, 168, 67, 0.2);
  font-size: 12px;
  color: var(--text-secondary);
}

.phase-label {
  text-align: center;
}

.label-text {
  font-size: 16px;
  font-weight: 500;
}

.label-text.building {
  color: var(--text-secondary);
}

.label-text.tension {
  color: var(--gold-light);
  animation: timer-pulse 0.5s ease-in-out 3;
}

/* Choosing Phase */
.choosing-phase {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

.timer-display {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timer-display.urgent .timer-text {
  color: var(--danger);
  animation: timer-pulse 0.5s ease-in-out infinite;
}

.timer-display.urgent .timer-progress {
  stroke: var(--danger);
}

.timer-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.timer-bg {
  fill: none;
  stroke: var(--bg-card);
  stroke-width: 4;
}

.timer-progress {
  fill: none;
  stroke: var(--gold);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 163.36; /* 2 * π * 26 */
  transition: stroke-dashoffset 1s linear;
}

.timer-text {
  font-size: 28px;
  font-weight: 700;
  color: var(--gold-light);
  font-family: var(--font-display);
}

.choice-prompt {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
  text-align: center;
}

/* Resolving Phase */
.resolving-phase {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  animation: fadeIn 0.3s ease;
}

.resolving-text {
  font-size: 18px;
  color: var(--gold);
  animation: float 1.5s ease-in-out infinite;
}

/* Result Phase */
.result-phase {
  flex: 1;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.3s ease;
}
</style>
