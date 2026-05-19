/**
 * Game engine — deterministic round logic
 */

// Seeded PRNG (same as generator for consistency)
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Generate a seed for a new round
 * @param {string} userId - Telegram user ID or fallback
 * @returns {number}
 */
export function generateSeed(userId) {
  const timestamp = Date.now()
  const userHash = hashCode(String(userId))
  return timestamp ^ userHash
}

function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/**
 * Deterministically compute the correct answer from a seed
 * @param {number} seed
 * @returns {'A' | 'B' | 'C'}
 */
export function getAnswerFromSeed(seed) {
  const rng = mulberry32(seed)
  const val = rng()
  if (val < 0.4) return 'A'   // 40% chance — resolution
  if (val < 0.7) return 'B'   // 30% chance — deviation
  return 'C'                   // 30% chance — break
}

/**
 * Check if a player's choice is correct
 * @param {number} seed
 * @param {'A' | 'B' | 'C'} choice
 * @returns {{ correct: boolean, answer: string, winnings: number }}
 */
export function checkAnswer(seed, choice, betAmount, multiplier) {
  const answer = getAnswerFromSeed(seed)
  const correct = choice === answer
  return {
    correct,
    answer,
    winnings: correct ? Math.floor(betAmount * multiplier) : 0,
    loss: correct ? 0 : betAmount,
  }
}

/**
 * Get Telegram user ID
 */
export function getTelegramUserId() {
  try {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
      const user = window.Telegram.WebApp.initDataUnsafe.user
      if (user && user.id) return String(user.id)
    }
  } catch (e) {
    // Not in Telegram context
  }
  return 'guest_' + Math.random().toString(36).substr(2, 8)
}

/**
 * Initialize Telegram WebApp
 */
export function initTelegram() {
  try {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready()
      window.Telegram.WebApp.expand()
      return true
    }
  } catch (e) {
    // Not in Telegram context
  }
  return false
}
