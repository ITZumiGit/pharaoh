<template>
  <div class="choice-buttons">
    <button
      class="choice-btn choice-a"
      :class="{ disabled, selected: selectedChoice === 'A' }"
      @click="choose('A')"
      :disabled="disabled"
    >
      <div class="choice-letter">A</div>
      <div class="choice-icon">🎵</div>
      <div class="choice-name">Разрешение</div>
      <div class="choice-desc">Мелодия вернётся в тонику</div>
    </button>

    <button
      class="choice-btn choice-b"
      :class="{ disabled, selected: selectedChoice === 'B' }"
      @click="choose('B')"
      :disabled="disabled"
    >
      <div class="choice-letter">B</div>
      <div class="choice-icon">🌀</div>
      <div class="choice-name">Отклонение</div>
      <div class="choice-desc">Модуляция в новую тональность</div>
    </button>

    <button
      class="choice-btn choice-c"
      :class="{ disabled, selected: selectedChoice === 'C' }"
      @click="choose('C')"
      :disabled="disabled"
    >
      <div class="choice-letter">C</div>
      <div class="choice-icon">⚡</div>
      <div class="choice-name">Разрыв</div>
      <div class="choice-desc">Диссонанс и обрыв</div>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['choose'])
const selectedChoice = ref(null)

function choose(choice) {
  if (props.disabled || selectedChoice.value) return
  selectedChoice.value = choice
  emit('choose', choice)
}
</script>

<style scoped>
.choice-buttons {
  display: flex;
  gap: 10px;
  width: 100%;
  max-width: 380px;
}

.choice-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 8px;
  border-radius: 16px;
  border: 2px solid;
  background: var(--bg-card);
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  position: relative;
  overflow: hidden;
}

.choice-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.choice-btn.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.choice-a {
  border-color: rgba(46, 204, 113, 0.3);
}
.choice-a.selected {
  background: rgba(46, 204, 113, 0.15);
  border-color: rgba(46, 204, 113, 0.7);
  box-shadow: 0 0 20px rgba(46, 204, 113, 0.2);
}

.choice-b {
  border-color: rgba(52, 152, 219, 0.3);
}
.choice-b.selected {
  background: rgba(52, 152, 219, 0.15);
  border-color: rgba(52, 152, 219, 0.7);
  box-shadow: 0 0 20px rgba(52, 152, 219, 0.2);
}

.choice-c {
  border-color: rgba(231, 76, 60, 0.3);
}
.choice-c.selected {
  background: rgba(231, 76, 60, 0.15);
  border-color: rgba(231, 76, 60, 0.7);
  box-shadow: 0 0 20px rgba(231, 76, 60, 0.2);
}

.choice-letter {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.choice-a .choice-letter { color: #2ecc71; }
.choice-b .choice-letter { color: #3498db; }
.choice-c .choice-letter { color: #e74c3c; }

.choice-icon {
  font-size: 24px;
}

.choice-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}

.choice-desc {
  font-size: 10px;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.3;
}
</style>
