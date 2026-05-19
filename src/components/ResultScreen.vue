<template>
  <div class="result-screen">
    <!-- Win particles -->
    <div v-if="result?.correct" class="particles">
      <div v-for="i in 12" :key="i" class="particle" :style="particleStyle(i)"></div>
    </div>

    <!-- Darken overlay for loss -->
    <div v-if="result && !result.correct" class="darken-overlay"></div>

    <div class="result-content">
      <!-- Result icon -->
      <div class="result-icon" :class="{ win: result?.correct, lose: result && !result.correct }">
        <span v-if="result?.correct">👑</span>
        <span v-else>💀</span>
      </div>

      <!-- Result text -->
      <h2 class="result-title" :class="{ win: result?.correct, lose: result && !result.correct }">
        {{ result?.correct ? 'Победа!' : 'Поражение' }}
      </h2>

      <!-- Answer reveal -->
      <div class="answer-reveal">
        <div class="correct-answer">
          <span class="reveal-label">Правильный ответ:</span>
          <span class="reveal-value" :style="{ color: choiceColor(answer) }">
            {{ answer }} — {{ choiceName(answer) }}
          </span>
        </div>
        <div class="your-choice" v-if="choice !== 'TIMEOUT'">
          <span class="reveal-label">Твой выбор:</span>
          <span class="reveal-value" :style="{ color: choiceColor(choice) }">
            {{ choice }} — {{ choiceName(choice) }}
          </span>
        </div>
        <div class="your-choice timeout" v-else>
          <span class="reveal-label">Время вышло!</span>
        </div>
      </div>

      <!-- Winnings / Loss -->
      <div class="amount-display" :class="{ win: result?.correct, lose: result && !result.correct }">
        <template v-if="result?.correct">
          <span class="amount-prefix">+</span>
          <span class="amount-value">{{ result.winnings }}</span>
          <span class="amount-suffix">🪙</span>
        </template>
        <template v-else>
          <span class="amount-prefix">−</span>
          <span class="amount-value">{{ result?.loss || bet }}</span>
          <span class="amount-suffix">🪙</span>
        </template>
      </div>

      <!-- Multiplier info -->
      <div class="multiplier-info" v-if="result?.correct">
        Ставка {{ bet }} × {{ multiplier }} = {{ result.winnings }}
      </div>

      <!-- Actions -->
      <div class="result-actions">
        <button class="btn btn-gold" @click="$emit('playAgain')">
          🎵 Ещё раунд
        </button>
        <button class="btn btn-outline" @click="$emit('back')">
          В меню
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  result: { type: Object, default: null },
  answer: { type: String, default: '' },
  choice: { type: String, default: '' },
  bet: { type: Number, default: 0 },
  multiplier: { type: Number, default: 1 },
})

const emit = defineEmits(['playAgain', 'back'])

function choiceName(id) {
  const names = { A: 'Разрешение', B: 'Отклонение', C: 'Разрыв' }
  return names[id] || id
}

function choiceColor(id) {
  const colors = { A: '#2ecc71', B: '#3498db', C: '#e74c3c' }
  return colors[id] || '#fff'
}

function particleStyle(i) {
  const angle = (i / 12) * 360
  const distance = 60 + Math.random() * 80
  const x = Math.cos(angle * Math.PI / 180) * distance
  const y = Math.sin(angle * Math.PI / 180) * distance
  const delay = Math.random() * 0.5
  const size = 4 + Math.random() * 8
  return {
    '--x': x + 'px',
    '--y': y + 'px',
    '--delay': delay + 's',
    '--size': size + 'px',
    left: '50%',
    top: '40%',
    animationDelay: delay + 's',
  }
}
</script>

<style scoped>
.result-screen {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
}

.particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: var(--size);
  height: var(--size);
  background: var(--gold-light);
  border-radius: 50%;
  animation: particle-rise 1.5s ease-out forwards;
  opacity: 0;
  box-shadow: 0 0 6px var(--gold-glow);
}

.darken-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  animation: darken 0.5s ease forwards;
  pointer-events: none;
}

.result-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  z-index: 1;
  animation: fadeInScale 0.4s ease;
}

.result-icon {
  font-size: 64px;
  animation: float 2s ease-in-out infinite;
}

.result-icon.win {
  filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.5));
}

.result-icon.lose {
  filter: grayscale(0.3);
}

.result-title {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 900;
  letter-spacing: 4px;
}

.result-title.win {
  color: var(--gold-light);
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}

.result-title.lose {
  color: var(--text-secondary);
}

.answer-reveal {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 20px;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid rgba(212, 168, 67, 0.15);
  text-align: center;
}

.reveal-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.reveal-value {
  font-size: 16px;
  font-weight: 600;
}

.timeout .reveal-label {
  color: var(--danger);
  font-size: 13px;
}

.amount-display {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 36px;
  font-weight: 700;
  margin: 8px 0;
}

.amount-display.win {
  color: var(--gold-light);
  text-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
}

.amount-display.lose {
  color: var(--danger);
}

.amount-prefix {
  font-size: 28px;
}

.amount-value {
  font-family: var(--font-display);
}

.amount-suffix {
  font-size: 24px;
}

.multiplier-info {
  font-size: 13px;
  color: var(--text-secondary);
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 260px;
  margin-top: 8px;
}

.result-actions .btn {
  width: 100%;
  justify-content: center;
}
</style>
