// Seeded PRNG — mulberry32
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Hash string to number
function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}

import {
  SCALES, DEGREE_FUNCTIONS, RHYTHM_PATTERNS, BASS_PATTERNS,
  getScaleFrequency, getNextDegree, generateTensionProfile,
  MODULATION_TARGETS
} from './patterns.js'

/**
 * Core procedural music generator using Web Audio API
 */
export class MusicGenerator {
  constructor() {
    this.ctx = null
    this.masterGain = null
    this.isPlaying = false
    this.scheduledNodes = []
    this.analyserNode = null
  }

  init() {
    if (this.ctx) return
    this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.6

    // Analyser for visualization
    this.analyserNode = this.ctx.createAnalyser()
    this.analyserNode.fftSize = 256
    this.masterGain.connect(this.analyserNode)
    this.analyserNode.connect(this.ctx.destination)
  }

  getAnalyserData() {
    if (!this.analyserNode) return new Uint8Array(0)
    const data = new Uint8Array(this.analyserNode.frequencyBinCount)
    this.analyserNode.getByteFrequencyData(data)
    return data
  }

  stop() {
    this.isPlaying = false
    for (const node of this.scheduledNodes) {
      try {
        if (node.stop) node.stop(0)
        if (node.disconnect) node.disconnect()
      } catch (e) { /* already stopped */ }
    }
    this.scheduledNodes = []
  }

  /**
   * Generate and play a full round pattern
   * @param {Object} params
   * @param {number} params.seed - Deterministic seed
   * @param {string} params.answer - 'A', 'B', or 'C'
   * @param {number} params.level - 1, 2, or 3
   * @param {Function} params.onTensionPoint - Called when music reaches tension point
   * @param {Function} params.onComplete - Called when music finishes
   * @returns {Object} Pattern info for display
   */
  play({ seed, answer, level, onTensionPoint, onComplete }) {
    this.init()
    this.stop()
    this.isPlaying = true

    const rng = mulberry32(seed)

    // Choose key
    const rootNoteIdx = Math.floor(rng() * 12)
    const rootFreq = 220 * Math.pow(2, rootNoteIdx / 12) // octave 3
    const scaleType = rng() > 0.5 ? 'major' : 'minor'
    const scale = SCALES[scaleType]

    // Timing
    const bpm = 90 + Math.floor(rng() * 40) // 90-130 BPM
    const beatDuration = 60 / bpm
    const sixteenthDuration = beatDuration / 4
    const totalBeats = 8 // 2 bars
    const totalSteps = totalBeats * 4 // 16th note steps
    const tensionStep = Math.floor(totalSteps * 0.7) // 70% through

    // Tension profile
    const tensionProfile = generateTensionProfile(totalSteps, tensionStep)

    // Choose rhythm pattern based on level
    const rhythmSet = level === 1 ? 'simple' : level === 2 ? 'medium' : 'complex'
    const rhythmIdx = Math.floor(rng() * RHYTHM_PATTERNS[rhythmSet].length)
    const rhythm = RHYTHM_PATTERNS[rhythmSet][rhythmIdx]

    // Bass pattern
    const bassIdx = Math.floor(rng() * BASS_PATTERNS.length)
    const bassRhythm = BASS_PATTERNS[bassIdx]

    // Generate melody degrees (scale degrees)
    const melodyDegrees = this._generateMelody(rng, scaleType, totalSteps, answer, level, tensionStep)
    const bassDegrees = this._generateBass(rng, scaleType, totalSteps, answer, level, tensionStep)

    // Modulation target for answer B
    const modulationTargets = MODULATION_TARGETS[scaleType]
    const modulationTarget = modulationTargets[Math.floor(rng() * modulationTargets.length)]

    // Schedule all notes
    const now = this.ctx.currentTime + 0.1
    let tensionPointReached = false

    for (let step = 0; step < totalSteps; step++) {
      const time = now + step * sixteenthDuration
      const tension = tensionProfile[step]

      // Check tension point
      if (step === tensionStep && onTensionPoint && !tensionPointReached) {
        tensionPointReached = true
        // Schedule callback
        const callbackTime = (time - now) * 1000
        setTimeout(() => {
          if (this.isPlaying && onTensionPoint) onTensionPoint()
        }, callbackTime)
      }

      // Melody
      if (rhythm[step]) {
        const degree = melodyDegrees[step]
        const octaveOffset = degree >= scale.length ? 1 : 0
        const freq = getScaleFrequency(rootFreq, scaleType, degree, 0) *
          (octaveOffset ? 2 : 1) * (degree < 0 ? 0.5 : 1)

        // Apply answer-specific modifications after tension point
        let noteFreq = freq
        let noteGain = 0.25
        let noteDuration = sixteenthDuration * (step < tensionStep ? 1.5 : 2)

        if (step >= tensionStep) {
          noteFreq = this._applyAnswerAfterTension(
            freq, rootFreq, scaleType, degree, answer, level, rng, modulationTarget
          )

          // Level 1 hints — more obvious
          if (level === 1) {
            if (answer === 'A') {
              noteGain = 0.3 // louder, clearer
              noteDuration *= 1.2
            } else if (answer === 'B') {
              // Slightly detune for modulation feel
              noteFreq *= (1 + (rng() - 0.5) * 0.02)
            } else if (answer === 'C') {
              if (rng() < 0.3) noteFreq *= 1.059 // chromatic
            }
          }
        }

        this._scheduleNote(noteFreq, time, Math.min(noteDuration, sixteenthDuration * 3), noteGain, tension)
      }

      // Bass
      if (bassRhythm[step]) {
        const bDegree = bassDegrees[Math.floor(step / 4)] || 0
        const bFreq = getScaleFrequency(rootFreq / 2, scaleType, bDegree, -1)

        let bassFreq = bFreq
        if (step >= tensionStep) {
          bassFreq = this._applyBassAnswer(bFreq, rootFreq / 2, scaleType, bDegree, answer, level, rng, modulationTarget)
        }

        this._scheduleBass(bassFreq, time, sixteenthDuration * 3, 0.2)
      }

      // Percussion on beats (1, 5, 9, 13)
      if (step % 4 === 0) {
        this._schedulePercussion(time, step % 8 === 0 ? 'kick' : 'snare', 0.15)
      }
      // Hi-hat on 8th notes
      if (step % 2 === 0) {
        this._schedulePercussion(time, 'hihat', 0.06)
      }

      // Extra rhythmic instability for answer C at tension point
      if (answer === 'C' && step >= tensionStep && level >= 2) {
        if (rng() < 0.3) {
          this._schedulePercussion(time + sixteenthDuration * 0.5, 'snare', 0.1)
        }
      }
    }

    // Schedule completion
    const totalTime = totalSteps * sixteenthDuration * 1000
    setTimeout(() => {
      if (this.isPlaying && onComplete) onComplete()
    }, totalTime)

    // Return pattern info
    return {
      key: `${['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][rootNoteIdx]} ${scaleType === 'major' ? 'major' : 'minor'}`,
      bpm,
      scaleType,
      totalDuration: totalSteps * sixteenthDuration,
      tensionPointTime: tensionStep * sixteenthDuration
    }
  }

  /**
   * Play the resolution phase (after player makes choice)
   */
  playResolution({ seed, answer, level, onComplete }) {
    this.init()
    this.stop()
    this.isPlaying = true

    const rng = mulberry32(seed + 9999) // Different sequence for resolution

    const rootNoteIdx = Math.floor(mulberry32(seed)() * 12)
    const rootFreq = 220 * Math.pow(2, rootNoteIdx / 12)
    const scaleType = mulberry32(seed)() > 0.5 ? 'major' : 'minor'
    const modulationTargets = MODULATION_TARGETS[scaleType]
    const modulationTarget = modulationTargets[Math.floor(rng() * modulationTargets.length)]

    const bpm = 90 + Math.floor(mulberry32(seed + 1)() * 40)
    const beatDuration = 60 / bpm
    const sixteenthDuration = beatDuration / 4

    const now = this.ctx.currentTime + 0.05
    const resolutionSteps = 16 // 1 bar resolution

    for (let step = 0; step < resolutionSteps; step++) {
      const time = now + step * sixteenthDuration
      const progress = step / resolutionSteps

      if (answer === 'A') {
        // Resolution — settle to tonic
        const degree = Math.max(0, Math.round(4 * (1 - progress))) // V -> I
        const freq = getScaleFrequency(rootFreq, scaleType, degree, 0)
        this._scheduleNote(freq, time, sixteenthDuration * 2, 0.3 * (1 - progress * 0.3), 0.2)
        // Bass on tonic
        if (step % 4 === 0) {
          const bFreq = getScaleFrequency(rootFreq / 2, scaleType, 0, -1)
          this._scheduleBass(bFreq, time, sixteenthDuration * 3, 0.2)
        }
      } else if (answer === 'B') {
        // Modulation — shift to new key
        const newRoot = rootFreq * Math.pow(2, modulationTarget / 12)
        const degree = Math.floor(rng() * 5)
        const freq = getScaleFrequency(newRoot, scaleType, degree, 0)
        this._scheduleNote(freq, time, sixteenthDuration * 2, 0.25 * (1 - progress * 0.2), 0.4)
        // Bass in new key
        if (step % 4 === 0) {
          const bDegree = Math.floor(rng() * 4)
          const bFreq = getScaleFrequency(newRoot / 2, scaleType, bDegree, -1)
          this._scheduleBass(bFreq, time, sixteenthDuration * 3, 0.18)
        }
      } else {
        // Break — dissonance and stop
        if (rng() < 0.6 - progress * 0.4) {
          const dissonantInterval = [1, 2, 6, 11, 13][Math.floor(rng() * 5)]
          const freq = rootFreq * Math.pow(2, dissonantInterval / 12) * (1 + rng() * 0.05)
          this._scheduleNote(freq, time, sixteenthDuration, 0.2 * (1 - progress * 0.7), 0.7)
        }
        if (step === Math.floor(resolutionSteps * 0.6)) {
          // Abrupt cutoff effect
          this._schedulePercussion(time, 'snare', 0.3)
        }
      }

      // Light percussion
      if (step % 4 === 0 && (answer !== 'C' || rng() > 0.4)) {
        this._schedulePercussion(time, step % 8 === 0 ? 'kick' : 'hihat', 0.08)
      }
    }

    const totalTime = resolutionSteps * sixteenthDuration * 1000
    setTimeout(() => {
      this.isPlaying = false
      if (onComplete) onComplete()
    }, totalTime + 200)

    return resolutionSteps * sixteenthDuration
  }

  // --- Private methods ---

  _generateMelody(rng, scaleType, totalSteps, answer, level, tensionStep) {
    const degrees = []
    let current = Math.floor(rng() * 5) + 2 // start on degree 2-6

    for (let step = 0; step < totalSteps; step++) {
      if (step < tensionStep) {
        // Pre-tension: build up with stepwise motion + occasional leaps
        const leap = rng()
        if (leap < 0.5) {
          // Step
          current += rng() > 0.5 ? 1 : -1
        } else if (leap < 0.8) {
          // Leap
          current += Math.floor(rng() * 3) - 1
        } else {
          // Stay
        }
        current = Math.max(0, Math.min(6, current))
      } else {
        // Post-tension: answer-dependent direction
        const hintStrength = level === 1 ? 0.8 : level === 2 ? 0.5 : 0.25

        if (answer === 'A') {
          // Move toward tonic (degree 0)
          if (rng() < hintStrength) {
            current = Math.max(0, current - 1)
          } else {
            current += Math.floor(rng() * 3) - 1
          }
        } else if (answer === 'B') {
          // Move away, introduce non-scale tones
          if (rng() < hintStrength * 0.6) {
            current = Math.min(7, current + 1)
          } else {
            current += Math.floor(rng() * 3) - 1
          }
        } else {
          // C: erratic movement
          if (rng() < hintStrength * 0.7) {
            current += Math.floor(rng() * 5) - 2
          } else {
            current += Math.floor(rng() * 3) - 1
          }
        }
        current = Math.max(-1, Math.min(8, current))
      }

      degrees.push(current)
    }

    return degrees
  }

  _generateBass(rng, scaleType, totalSteps, answer, level, tensionStep) {
    // Bass changes per beat (4 steps = 1 beat)
    const beatsCount = Math.ceil(totalSteps / 4)
    const degrees = []
    // Common bass progressions: I-IV-V-I, I-vi-IV-V, etc.
    const progressions = [
      [0, 3, 4, 0], [0, 5, 3, 4], [0, 3, 4, 5], [0, 4, 3, 0]
    ]
    const prog = progressions[Math.floor(rng() * progressions.length)]

    for (let beat = 0; beat < beatsCount; beat++) {
      let degree = prog[beat % prog.length]

      if (beat * 4 >= tensionStep) {
        const hintStrength = level === 1 ? 0.7 : level === 2 ? 0.4 : 0.2

        if (answer === 'A') {
          // Bass stays on tonic or dominant
          if (rng() < hintStrength) {
            degree = beat % 2 === 0 ? 0 : 4
          }
        } else if (answer === 'B') {
          // Bass starts moving to new key
          if (rng() < hintStrength) {
            degree = [2, 5, 6][Math.floor(rng() * 3)]
          }
        } else {
          // Bass becomes unstable
          if (rng() < hintStrength * 0.6) {
            degree = [1, 6, 3][Math.floor(rng() * 3)]
          }
        }
      }

      degrees.push(degree)
    }

    return degrees
  }

  _applyAnswerAfterTension(freq, rootFreq, scaleType, degree, answer, level, rng, modulationTarget) {
    if (answer === 'A') {
      // Resolution hints: slight pitch bend toward stable tones
      const hintStrength = level === 1 ? 0.015 : level === 2 ? 0.008 : 0.003
      // Bend slightly toward root
      const ratio = freq / rootFreq
      const nearestHarmonic = Math.round(Math.log2(ratio) * 12) / 12
      return freq * (1 + (Math.pow(2, nearestHarmonic) / ratio - 1) * hintStrength)
    } else if (answer === 'B') {
      // Modulation hints: micro-pitch shifts toward target key
      const hintStrength = level === 1 ? 0.025 : level === 2 ? 0.012 : 0.005
      const shift = modulationTarget / 12
      return freq * (1 + shift * hintStrength * (rng() * 0.5 + 0.5))
    } else {
      // Break hints: slight detuning / micro-dissonance
      const hintStrength = level === 1 ? 0.04 : level === 2 ? 0.02 : 0.008
      return freq * (1 + (rng() - 0.5) * hintStrength)
    }
  }

  _applyBassAnswer(freq, rootFreq, scaleType, degree, answer, level, rng, modulationTarget) {
    if (answer === 'A') {
      // Bass stabilizes on tonic/dominant
      return freq
    } else if (answer === 'B') {
      const hintStrength = level === 1 ? 0.02 : level === 2 ? 0.01 : 0.004
      return freq * (1 + modulationTarget / 12 * hintStrength)
    } else {
      const hintStrength = level === 1 ? 0.03 : level === 2 ? 0.015 : 0.006
      return freq * (1 + (rng() - 0.5) * hintStrength)
    }
  }

  _scheduleNote(freq, time, duration, gain, tension = 0.5) {
    if (!this.ctx || !this.isPlaying) return

    const osc = this.ctx.createOscillator()
    const gainNode = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()

    // Oscillator type based on tension
    if (tension < 0.4) {
      osc.type = 'sine'
    } else if (tension < 0.7) {
      osc.type = 'triangle'
    } else {
      osc.type = rng_local(this.ctx, time) > 0.5 ? 'sawtooth' : 'square'
    }

    osc.frequency.setValueAtTime(freq, time)

    // Filter
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(800 + tension * 2000, time)
    filter.Q.setValueAtTime(1 + tension * 3, time)

    // Envelope
    gainNode.gain.setValueAtTime(0, time)
    gainNode.gain.linearRampToValueAtTime(gain, time + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration)

    osc.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(this.masterGain)

    osc.start(time)
    osc.stop(time + duration + 0.01)

    this.scheduledNodes.push(osc, gainNode, filter)
  }

  _scheduleBass(freq, time, duration, gain) {
    if (!this.ctx || !this.isPlaying) return

    const osc = this.ctx.createOscillator()
    const gainNode = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, time)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(400, time)

    gainNode.gain.setValueAtTime(0, time)
    gainNode.gain.linearRampToValueAtTime(gain, time + 0.03)
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration)

    osc.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(this.masterGain)

    osc.start(time)
    osc.stop(time + duration + 0.01)

    this.scheduledNodes.push(osc, gainNode, filter)
  }

  _schedulePercussion(time, type, gain) {
    if (!this.ctx || !this.isPlaying) return

    const gainNode = this.ctx.createGain()

    if (type === 'kick') {
      const osc = this.ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(150, time)
      osc.frequency.exponentialRampToValueAtTime(30, time + 0.15)

      gainNode.gain.setValueAtTime(gain, time)
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.15)

      osc.connect(gainNode)
      gainNode.connect(this.masterGain)
      osc.start(time)
      osc.stop(time + 0.15)
      this.scheduledNodes.push(osc)
    } else if (type === 'snare') {
      // Noise-based snare
      const bufferSize = this.ctx.sampleRate * 0.1
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1)
      }

      const noise = this.ctx.createBufferSource()
      noise.buffer = buffer

      const filter = this.ctx.createBiquadFilter()
      filter.type = 'highpass'
      filter.frequency.setValueAtTime(1000, time)

      gainNode.gain.setValueAtTime(gain, time)
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1)

      noise.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(this.masterGain)
      noise.start(time)
      noise.stop(time + 0.1)
      this.scheduledNodes.push(noise)
    } else if (type === 'hihat') {
      const bufferSize = this.ctx.sampleRate * 0.05
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1)
      }

      const noise = this.ctx.createBufferSource()
      noise.buffer = buffer

      const filter = this.ctx.createBiquadFilter()
      filter.type = 'highpass'
      filter.frequency.setValueAtTime(5000, time)

      gainNode.gain.setValueAtTime(gain, time)
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.04)

      noise.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(this.masterGain)
      noise.start(time)
      noise.stop(time + 0.05)
      this.scheduledNodes.push(noise)
    }

    this.scheduledNodes.push(gainNode)
  }
}

// Helper — deterministic-ish oscillator type selection
function rng_local(ctx, time) {
  return (Math.sin(time * 12345.6789) + 1) / 2
}

// Singleton
let instance = null

export function getGenerator() {
  if (!instance) {
    instance = new MusicGenerator()
  }
  return instance
}
