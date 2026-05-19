<template>
  <div class="app-container">
    <Transition name="fade" mode="out-in">
      <!-- Main Menu -->
      <MainMenu v-if="screen === 'menu'" key="menu" />

      <!-- Tutorial -->
      <div v-else-if="screen === 'tutorial'" class="tutorial-screen" key="tutorial">
        <div class="tutorial-content">
          <!-- Step 1: Слушай -->
          <div v-if="store.tutorialStep === 0" class="tutorial-step" key="step1">
            <div class="tutorial-icon">👂</div>
            <h2 class="tutorial-title">Слушай</h2>
            <p class="tutorial-desc">
              Алгоритм генерирует уникальный музыкальный паттерн.
              Слушай внимательно — в нём зашифрованы подсказки.
            </p>
            <div class="tutorial-visual">
              <div class="wave-line"></div>
              <div class="wave-line delay-1"></div>
              <div class="wave-line delay-2"></div>
            </div>
          </div>

          <!-- Step 2: Анализируй -->
          <div v-if="store.tutorialStep === 1" class="tutorial-step" key="step2">
            <div class="tutorial-icon">🧠</div>
            <h2 class="tutorial-title">Анализируй</h2>
            <p class="tutorial-desc">
              Музыка остановится в точке напряжения.
              Проанализируй направление мелодии, ритм и гармонию —
              они указывают, что будет дальше.
            </p>
            <div class="tutorial-visual">
              <div class="choice-preview">
                <span class="cp-a">A — Разрешение</span>
                <span class="cp-b">B — Отклонение</span>
                <span class="cp-c">C — Разрыв</span>
              </div>
            </div>
          </div>

          <!-- Step 3: Ставь -->
          <div v-if="store.tutorialStep === 2" class="tutorial-step" key="step3">
            <div class="tutorial-icon">🎲</div>
            <h2 class="tutorial-title">Ставь</h2>
            <p class="tutorial-desc">
              У тебя 10 секунд, чтобы сделать ставку.
              Угадал — выиграй с множителем уровня.
              Не угадал — теряешь ставку.
            </p>
            <div class="tutorial-visual">
              <div class="mult-preview">
                <div class="mp-item">
                  <span class="mp-level">👁 Ученик</span>
                  <span class="mp-mult">x1.2</span>
                </div>
                <div class="mp-item">
                  <span class="mp-level">🔮 Жрец</span>
                  <span class="mp-mult">x2</span>
                </div>
                <div class="mp-item">
                  <span class="mp-level">👑 Фараон</span>
                  <span class="mp-mult">x5</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation dots -->
          <div class="tutorial-dots">
            <div
              v-for="i in 3"
              :key="i"
              class="dot"
              :class="{ active: store.tutorialStep === i - 1 }"
            ></div>
          </div>

          <!-- Buttons -->
          <div class="tutorial-actions">
            <button class="btn btn-outline" @click="skipTutorial" v-if="store.tutorialStep < 2">
              Пропустить
            </button>
            <button class="btn btn-gold" @click="store.nextTutorialStep()">
              {{ store.tutorialStep < 2 ? 'Далее →' : 'Начать игру!' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Game Screen -->
      <GameScreen v-else-if="screen === 'game'" key="game" />

      <!-- Leaderboard -->
      <Leaderboard v-else-if="screen === 'leaderboard'" key="leaderboard" @back="store.setScreen('menu')" />
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useGameStore } from './stores/gameStore.js'
import { initTelegram } from './game/engine.js'
import MainMenu from './components/MainMenu.vue'
import GameScreen from './components/GameScreen.vue'
import Leaderboard from './components/Leaderboard.vue'

const store = useGameStore()
const screen = computed(() => store.currentScreen)

function skipTutorial() {
  store.completeTutorial()
}

onMounted(() => {
  initTelegram()
})
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* Tutorial */
.tutorial-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--bg-primary);
  position: relative;
  overflow: hidden;
}

.tutorial-screen::before {
  content: '';
  position: absolute;
  top: -50%;
  left: 50%;
  transform: translateX(-50%);
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(212, 168, 67, 0.06) 0%, transparent 70%);
  pointer-events: none;
}

.tutorial-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 320px;
  z-index: 1;
}

.tutorial-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  animation: fadeInScale 0.4s ease;
}

.tutorial-icon {
  font-size: 56px;
  animation: float 2.5s ease-in-out infinite;
}

.tutorial-title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 900;
  color: var(--gold-light);
  letter-spacing: 4px;
}

.tutorial-desc {
  font-size: 15px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.6;
}

.tutorial-visual {
  margin: 8px 0;
}

/* Wave animation for step 1 */
.wave-line {
  width: 200px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
  margin: 6px auto;
  animation: shimmer 2s ease-in-out infinite;
}

.wave-line.delay-1 { animation-delay: 0.3s; opacity: 0.7; }
.wave-line.delay-2 { animation-delay: 0.6s; opacity: 0.4; }

/* Choice preview for step 2 */
.choice-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cp-a, .cp-b, .cp-c {
  padding: 8px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

.cp-a {
  background: rgba(46, 204, 113, 0.12);
  border: 1px solid rgba(46, 204, 113, 0.3);
  color: #2ecc71;
}

.cp-b {
  background: rgba(52, 152, 219, 0.12);
  border: 1px solid rgba(52, 152, 219, 0.3);
  color: #3498db;
}

.cp-c {
  background: rgba(231, 76, 60, 0.12);
  border: 1px solid rgba(231, 76, 60, 0.3);
  color: #e74c3c;
}

/* Multiplier preview for step 3 */
.mult-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mp-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: var(--bg-card);
  border-radius: 10px;
  border: 1px solid rgba(212, 168, 67, 0.1);
}

.mp-level {
  font-size: 14px;
  color: var(--text-secondary);
}

.mp-mult {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--gold-light);
}

/* Tutorial dots */
.tutorial-dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--bg-card-hover);
  transition: all 0.3s ease;
}

.dot.active {
  background: var(--gold);
  box-shadow: 0 0 8px var(--gold-glow);
  transform: scale(1.3);
}

.tutorial-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.tutorial-actions .btn {
  flex: 1;
  justify-content: center;
}
</style>
