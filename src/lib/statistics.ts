export type Statistics = {
  gamesPlayed: number
  currentStreak: number
  longestStreak: number
  lastDayNumber: number | null
}

const STORAGE_KEY = "celestial:statistics"

const ZERO_STATISTICS: Statistics = {
  gamesPlayed: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastDayNumber: null,
}

export function getStatistics(): Statistics {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return ZERO_STATISTICS
  try {
    return JSON.parse(raw) as Statistics
  } catch {
    return ZERO_STATISTICS
  }
}

export function recordDailyWin(dayNumber: number): Statistics {
  const previous = getStatistics()
  if (previous.lastDayNumber === dayNumber) return previous

  const currentStreak = previous.lastDayNumber === dayNumber - 1 ? previous.currentStreak + 1 : 1
  const next: Statistics = {
    gamesPlayed: previous.gamesPlayed + 1,
    currentStreak,
    longestStreak: Math.max(previous.longestStreak, currentStreak),
    lastDayNumber: dayNumber,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}
