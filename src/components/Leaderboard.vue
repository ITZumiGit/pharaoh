<template>
  <div class="leaderboard">
    <div class="lb-header">
      <button class="back-btn" @click="$emit('back')">←</button>
      <h2 class="lb-title shimmer-text">Рейтинг</h2>
      <div class="spacer"></div>
    </div>

    <!-- Your stats -->
    <div class="your-stats">
      <div class="stat-row">
        <span class="stat-label">Раундов</span>
        <span class="stat-val">{{ store.stats.totalRounds }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Побед</span>
        <span class="stat-val win">{{ store.stats.wins }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Винрейт</span>
        <span class="stat-val">{{ store.winRate }}%</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Выиграно</span>
        <span class="stat-val gold">🪙 {{ store.stats.totalWon }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Проиграно</span>
        <span class="stat-val lose">🪙 {{ store.stats.totalLost }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Лучшая серия</span>
        <span class="stat-val">{{ store.stats.bestStreak }}🔥</span>
      </div>
    </div>

    <!-- Placeholder leaderboard -->
    <div class="lb-list">
      <h3 class="lb-subtitle">Топ игроки</h3>
      <div class="lb-empty">
        <span class="empty-icon">🏆</span>
        <p>Рейтинг пока пуст</p>
        <p class="empty-hint">Играй, чтобы попасть в топ!</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '../stores/gameStore.js'

const store = useGameStore()

defineEmits(['back'])
</script>

<style scoped>
.leaderboard {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 0 16px 24px;
}

.lb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(212, 168, 67, 0.15);
  margin-bottom: 20px;
}

.back-btn {
  background: none;
  border: none;
  color: var(--gold);
  font-size: 22px;
  cursor: pointer;
  padding: 4px 8px;
}

.lb-title {
  font-family: var(--font-display);
  font-size: 20px;
  letter-spacing: 3px;
}

.spacer {
  width: 38px;
}

.your-stats {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(212, 168, 67, 0.15);
  margin-bottom: 20px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(212, 168, 67, 0.05);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.stat-val {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-val.win { color: #2ecc71; }
.stat-val.lose { color: #e74c3c; }
.stat-val.gold { color: var(--gold-light); }

.lb-list {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(212, 168, 67, 0.15);
}

.lb-subtitle {
  font-family: var(--font-display);
  font-size: 14px;
  color: var(--text-secondary);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.lb-empty {
  text-align: center;
  padding: 24px 0;
}

.empty-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 8px;
}

.lb-empty p {
  color: var(--text-secondary);
  font-size: 14px;
}

.empty-hint {
  color: var(--text-muted) !important;
  font-size: 12px !important;
  margin-top: 4px;
}
</style>
