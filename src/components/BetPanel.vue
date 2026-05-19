<template>
  <div class="bet-panel">
    <h3 class="panel-title">Ставка</h3>
    <div class="bet-display">
      <span class="bet-amount">🪙 {{ modelValue }}</span>
    </div>
    <div class="bet-controls">
      <button class="bet-btn" @click="decrease" :disabled="modelValue <= minBet">−</button>
      <div class="bet-presets">
        <button
          v-for="preset in presets"
          :key="preset"
          class="preset-btn"
          :class="{ active: modelValue === preset }"
          @click="$emit('update:modelValue', Math.min(preset, balance))"
        >
          {{ preset }}
        </button>
      </div>
      <button class="bet-btn" @click="increase" :disabled="modelValue >= balance">+</button>
    </div>
    <div class="bet-info">
      <span v-if="modelValue > balance" class="bet-error">Недостаточно фишек</span>
      <span v-else class="bet-hint">Мин. {{ minBet }} · Доступно {{ balance }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 10 },
  balance: { type: Number, default: 1000 },
  minBet: { type: Number, default: 10 },
  step: { type: Number, default: 10 },
})

const emit = defineEmits(['update:modelValue'])

const presets = computed(() => {
  const vals = [10, 50, 100, 250, 500]
  return vals.filter(v => v <= props.balance)
})

function decrease() {
  const newVal = Math.max(props.minBet, props.modelValue - props.step)
  emit('update:modelValue', newVal)
}

function increase() {
  const newVal = Math.min(props.balance, props.modelValue + props.step)
  emit('update:modelValue', newVal)
}
</script>

<style scoped>
.bet-panel {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(212, 168, 67, 0.1);
}

.panel-title {
  font-family: var(--font-display);
  font-size: 14px;
  color: var(--text-secondary);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 12px;
  text-align: center;
}

.bet-display {
  text-align: center;
  margin-bottom: 12px;
}

.bet-amount {
  font-size: 28px;
  font-weight: 700;
  color: var(--gold-light);
}

.bet-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bet-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1.5px solid var(--gold-dark);
  background: var(--bg-secondary);
  color: var(--gold);
  font-size: 22px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.bet-btn:active:not(:disabled) {
  transform: scale(0.92);
  background: rgba(212, 168, 67, 0.15);
}

.bet-btn:disabled {
  opacity: 0.3;
}

.bet-presets {
  flex: 1;
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
}

.preset-btn {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid var(--bg-card-hover);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.preset-btn.active {
  background: rgba(212, 168, 67, 0.15);
  border-color: var(--gold);
  color: var(--gold-light);
}

.preset-btn:active {
  transform: scale(0.95);
}

.bet-info {
  text-align: center;
  margin-top: 8px;
  min-height: 18px;
}

.bet-hint {
  font-size: 11px;
  color: var(--text-muted);
}

.bet-error {
  font-size: 11px;
  color: var(--danger);
}
</style>
