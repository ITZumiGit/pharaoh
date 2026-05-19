<template>
  <div class="music-player">
    <div class="visualizer-container">
      <canvas ref="canvasRef" class="visualizer-canvas"></canvas>
      <div class="center-icon" :class="{ active, resolving: phase === 'resolving' }">
        <span v-if="phase === 'resolving'">🔮</span>
        <span v-else>👁</span>
      </div>
    </div>
    <div class="wave-label">
      {{ phase === 'resolving' ? 'Раскрытие...' : active ? 'Вслушивайся...' : '' }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { getScheduler } from '../audio/scheduler.js'

const props = defineProps({
  active: { type: Boolean, default: false },
  phase: { type: String, default: 'idle' },
})

const canvasRef = ref(null)
let animationId = null

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height

  ctx.clearRect(0, 0, width, height)

  if (!props.active) {
    // Draw idle state
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(212, 168, 67, 0.15)'
    ctx.lineWidth = 2
    const centerY = height / 2
    for (let x = 0; x < width; x++) {
      const y = centerY + Math.sin(x * 0.03 + Date.now() * 0.001) * 8
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    animationId = requestAnimationFrame(draw)
    return
  }

  // Get analyser data
  const scheduler = getScheduler()
  const data = scheduler.getAnalyserData()

  if (data.length > 0) {
    const barWidth = width / data.length
    const centerY = height / 2

    // Draw frequency bars
    for (let i = 0; i < data.length; i++) {
      const barHeight = (data[i] / 255) * (height * 0.4)
      const x = i * barWidth
      const alpha = 0.4 + (data[i] / 255) * 0.6

      // Gold gradient based on intensity
      const r = 212
      const g = 168 + Math.floor((data[i] / 255) * 87)
      const b = 67

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`

      // Top half
      ctx.fillRect(x, centerY - barHeight, barWidth - 1, barHeight)
      // Bottom half (mirror)
      ctx.fillRect(x, centerY, barWidth - 1, barHeight * 0.6)
    }

    // Center line
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'
    ctx.lineWidth = 1
    ctx.moveTo(0, centerY)
    ctx.lineTo(width, centerY)
    ctx.stroke()
  }

  animationId = requestAnimationFrame(draw)
}

onMounted(() => {
  const canvas = canvasRef.value
  if (canvas) {
    const container = canvas.parentElement
    canvas.width = container.clientWidth * 2
    canvas.height = container.clientHeight * 2
    canvas.style.width = container.clientWidth + 'px'
    canvas.style.height = container.clientHeight + 'px'
  }
  animationId = requestAnimationFrame(draw)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<style scoped>
.music-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.visualizer-container {
  position: relative;
  width: 100%;
  max-width: 340px;
  height: 180px;
  border-radius: 16px;
  background: var(--bg-card);
  border: 1px solid rgba(212, 168, 67, 0.15);
  overflow: hidden;
}

.visualizer-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.center-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 32px;
  opacity: 0.3;
  transition: all 0.3s ease;
  pointer-events: none;
}

.center-icon.active {
  opacity: 0.6;
  animation: float 2s ease-in-out infinite;
}

.center-icon.resolving {
  animation: spin-slow 3s linear infinite;
}

.wave-label {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 1px;
}
</style>
