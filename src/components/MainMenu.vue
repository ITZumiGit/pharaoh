<template>
  <div class="main-menu">
    <!-- Background decorative elements -->
    <div class="bg-pattern"></div>
    <div class="pyramid-glow"></div>

    <!-- Logo / Title -->
    <div class="logo-section">
      <div class="eye-icon">👁</div>
      <h1 class="title shimmer-text">ФАРАОН</h1>
      <p class="subtitle">Музыкальное Казино</p>
    </div>

    <!-- Balance -->
    <div class="balance-display">
      <span class="balance-label">Баланс</span>
      <span class="balance-amount">
        <span class="chip-icon">🪙</span>
        {{ store.balance }}
      </span>
    </div>

    <!-- Quick Stats -->
    <div class="quick-stats" v-if="store.stats.totalRounds > 0">
      <div class="stat">
        <span class="stat-value">{{ store.stats.wins }}W</span>
        <span class="stat-label">Побед</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat">
        <span class="stat-value">{{ store.winRate }}%</span>
        <span class="stat-label">Винрейт</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat">
        <span class="stat-value">{{ store.stats.bestStreak }}🔥</span>
        <span class="stat-label">Серия</span>
      </div>
    </div>

    <!-- Play Button -->
    <button class="btn btn-gold play-btn" @click="startGame" :disabled="!store.canPlay">
      <span class="btn-icon">▶</span>
      Играть
    </button>

    <!-- No balance warning -->
    <div class="no-balance" v-if="!store.canPlay">
      <p>Недостаточно фишек!</p>
      <button class="btn btn-outline reset-btn" @click="store.resetBalance()">
        Получить 1000 фишек
      </button>
    </div>

    <!-- Bottom navigation -->
    <div class="bottom-nav">
      <button class="nav-btn" @click="store.setScreen('tutorial')">
        <span class="nav-icon">📖</span>
        <span class="nav-label">Как играть</span>
      </button>
      <button class="nav-btn" @click="store.setScreen('leaderboard')">
        <span class="nav-icon">🏆</span>
        <span class="nav-label">Рейтинг</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '../stores/gameStore.js'

const store = useGameStore()

function startGame() {
  if (!store.tutorialDone) {
    store.setScreen('tutorial')
  } else {
    store.setScreen('game')
  }
}
</script>

<style scoped>
.main-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(212, 168, 67, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(212, 168, 67, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

.pyramid-glow {
  position: absolute;
  top: 15%;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 200px;
  background: radial-gradient(ellipse, rgba(212, 168, 67, 0.08) 0%, transparent 70%);
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  pointer-events: none;
}

.logo-section {
  text-align: center;
  margin-bottom: 32px;
  animation: fadeInScale 0.6s ease;
}

.eye-icon {
  font-size: 48px;
  margin-bottom: 8px;
  animation: float 3s ease-in-out infinite;
}

.title {
  font-family: var(--font-display);
  font-size: 42px;
  font-weight: 900;
  letter-spacing: 6px;
  line-height: 1.1;
}

.subtitle {
  font-family: var(--font-display);
  font-size: 14px;
  color: var(--text-secondary);
  letter-spacing: 4px;
  margin-top: 8px;
  text-transform: uppercase;
}

.balance-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
  animation: fadeIn 0.6s ease 0.2s both;
}

.balance-label {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.balance-amount {
  font-size: 32px;
  font-weight: 700;
  color: var(--gold-light);
  display: flex;
  align-items: center;
  gap: 8px;
}

.chip-icon {
  font-size: 24px;
}

.quick-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid rgba(212, 168, 67, 0.15);
  margin-bottom: 32px;
  animation: fadeIn 0.6s ease 0.3s both;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-label {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-divider {
  width: 1px;
  height: 24px;
  background: rgba(212, 168, 67, 0.2);
}

.play-btn {
  width: 200px;
  height: 56px;
  font-size: 20px;
  font-family: var(--font-display);
  letter-spacing: 2px;
  animation: fadeIn 0.6s ease 0.4s both, pulse-gold 2s ease-in-out infinite;
  margin-bottom: 16px;
}

.btn-icon {
  font-size: 18px;
}

.no-balance {
  text-align: center;
  animation: fadeIn 0.4s ease;
  margin-bottom: 16px;
}

.no-balance p {
  color: var(--danger);
  font-size: 14px;
  margin-bottom: 8px;
}

.reset-btn {
  font-size: 13px;
  padding: 8px 16px;
}

.bottom-nav {
  position: absolute;
  bottom: 24px;
  display: flex;
  gap: 24px;
  animation: fadeIn 0.6s ease 0.5s both;
}

.nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.2s;
}

.nav-btn:active {
  color: var(--gold);
}

.nav-icon {
  font-size: 24px;
}

.nav-label {
  font-size: 11px;
  letter-spacing: 0.5px;
}
</style>
