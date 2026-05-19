/**
 * Audio playback scheduler — manages timing and state transitions
 */
import { getGenerator } from './generator.js'

export class AudioScheduler {
  constructor() {
    this.generator = getGenerator()
    this.currentRound = null
    this.state = 'idle' // idle | playing | tension | waiting | resolving
  }

  /**
   * Start playing a round's pattern
   */
  playPattern({ seed, answer, level, onTensionPoint, onComplete }) {
    this.state = 'playing'
    this.currentRound = { seed, answer, level }

    const info = this.generator.play({
      seed,
      answer,
      level,
      onTensionPoint: () => {
        this.state = 'tension'
        if (onTensionPoint) onTensionPoint()
      },
      onComplete: () => {
        this.state = 'waiting'
        if (onComplete) onComplete()
      }
    })

    return info
  }

  /**
   * Play the resolution after player choice
   */
  playResolution({ onComplete }) {
    if (!this.currentRound) return

    this.state = 'resolving'
    const { seed, answer, level } = this.currentRound

    this.generator.playResolution({
      seed,
      answer,
      level,
      onComplete: () => {
        this.state = 'idle'
        this.currentRound = null
        if (onComplete) onComplete()
      }
    })
  }

  /**
   * Stop all audio
   */
  stop() {
    this.generator.stop()
    this.state = 'idle'
    this.currentRound = null
  }

  /**
   * Get analyser data for visualization
   */
  getAnalyserData() {
    return this.generator.getAnalyserData()
  }
}

// Singleton
let instance = null

export function getScheduler() {
  if (!instance) {
    instance = new AudioScheduler()
  }
  return instance
}
