// Musical scales, intervals, chord definitions, and pattern rules

// Note frequencies (A4 = 440Hz, equal temperament)
const NOTE_BASE = {
  'C': 261.63, 'C#': 277.18, 'Db': 277.18,
  'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
  'E': 329.63, 'F': 349.23, 'F#': 369.99, 'Gb': 369.99,
  'G': 392.00, 'G#': 415.30, 'Ab': 415.30,
  'A': 440.00, 'A#': 466.16, 'Bb': 466.16,
  'B': 493.88
}

// Scale intervals (semitones from root)
export const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
}

// Scale degree functions for tension/resolution
export const DEGREE_FUNCTIONS = {
  // degree index (0-6) -> functional weight (0 = stable, 1 = tense)
  major: [0, 0.4, 0.6, 0.3, 0.7, 0.5, 0.9],  // I ii iii IV V vi vii
  minor: [0, 0.5, 0.7, 0.3, 0.8, 0.4, 0.9],
}

// Chord types by scale degree
export const CHORD_TYPES = {
  major: ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'],
  minor: ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'],
}

// Modulation target keys (for answer B)
export const MODULATION_TARGETS = {
  major: [4, 5, 9, 7],  // IV, V, relative minor, vii
  minor: [3, 5, 8, 10], // III, V, relative major, vii
}

// Rhythm patterns (1 = note, 0 = rest) — 16th note grid, 4 beats
export const RHYTHM_PATTERNS = {
  simple: [
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // quarter notes
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], // eighth notes
    [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0], // dotted pattern
  ],
  medium: [
    [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0],
    [1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0],
  ],
  complex: [
    [1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1],
    [1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0],
    [1, 1, 0, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1],
  ]
}

// Bass patterns (beat-level, 4 beats)
export const BASS_PATTERNS = [
  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
  [1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0],
]

// Get frequency for a note name and octave
export function getFrequency(noteName, octave) {
  const base = NOTE_BASE[noteName]
  if (!base) return 440
  return base * Math.pow(2, octave - 4)
}

// Get frequency from scale degree, root, and scale type
export function getScaleFrequency(rootFreq, scaleType, degree, octaveOffset = 0) {
  const scale = SCALES[scaleType]
  if (!scale) return rootFreq
  const fullOctaves = Math.floor(degree / scale.length)
  const degreeInOctave = ((degree % scale.length) + scale.length) % scale.length
  const semitones = scale[degreeInOctave] + fullOctaves * 12
  return rootFreq * Math.pow(2, (semitones + octaveOffset * 12) / 12)
}

// Voice leading rules — smooth transitions
export function getNextDegree(current, target, rng) {
  const diff = target - current
  if (Math.abs(diff) <= 2) return target
  // Stepwise motion preference
  if (rng() < 0.7) {
    return current + Math.sign(diff)
  }
  // Occasionally leap
  return target
}

// Tension profile for a phrase — builds tension then stops
export function generateTensionProfile(totalSteps, tensionPoint) {
  const profile = []
  for (let i = 0; i < totalSteps; i++) {
    if (i < tensionPoint) {
      // Build tension: gradually increase
      const t = i / tensionPoint
      profile.push(0.2 + 0.8 * t * t) // quadratic rise
    } else {
      // After tension point (for resolution phase)
      const t = (i - tensionPoint) / (totalSteps - tensionPoint)
      profile.push(1.0 - 0.6 * t)
    }
  }
  return profile
}
