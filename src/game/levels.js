// Game level configurations

export const LEVELS = {
  1: {
    id: 1,
    name: 'Ученик',
    nameEn: 'Apprentice',
    multiplier: 1.2,
    description: 'Очевидные подсказки — ритм и мелодия ясно указывают направление',
    icon: '👁',
    color: '#2ecc71',
    hintStrength: 0.8,
    minBet: 10,
  },
  2: {
    id: 2,
    name: 'Жрец',
    nameEn: 'Priest',
    multiplier: 2,
    description: 'Тонкие подсказки — улавливай гармонические намёки',
    icon: '🔮',
    color: '#3498db',
    hintStrength: 0.5,
    minBet: 10,
  },
  3: {
    id: 3,
    name: 'Фараон',
    nameEn: 'Pharaoh',
    multiplier: 5,
    description: 'Минимум подсказок — только тончайшие детали в паттерне',
    icon: '👑',
    color: '#e74c3c',
    hintStrength: 0.25,
    minBet: 10,
  },
}

export const CHOICES = {
  A: {
    id: 'A',
    name: 'Разрешение',
    description: 'Мелодия разрешится, вернётся в тонику',
    icon: '🎵',
    color: '#2ecc71',
  },
  B: {
    id: 'B',
    name: 'Отклонение',
    description: 'Мелодия уйдёт в другую тональность',
    icon: '🌀',
    color: '#3498db',
  },
  C: {
    id: 'C',
    name: 'Разрыв',
    description: 'Резкий обрыв, диссонанс',
    icon: '⚡',
    color: '#e74c3c',
  },
}

export const INITIAL_BALANCE = 1000
export const MIN_BET = 10
export const BET_STEP = 10
export const CHOICE_TIMEOUT = 10 // seconds
