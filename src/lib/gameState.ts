import type { CelestialObject } from "../types/celestial"
import type { DailyGameState } from "../types/game"

export const MAX_GUESSES = 7

export function createInitialState(date: string): DailyGameState {
  return { date, guessIds: [], won: false }
}

export function applyGuess(
  state: DailyGameState,
  guessId: string,
  dataset: CelestialObject[],
  answerId: string
): { state: DailyGameState; error?: "invalid_id" | "duplicate" | "already_won" | "game_over" } {
  if (state.won) return { state, error: "already_won" }
  if (state.guessIds.length >= MAX_GUESSES) return { state, error: "game_over" }
  if (!dataset.some(o => o.id === guessId)) return { state, error: "invalid_id" }
  if (state.guessIds.includes(guessId)) return { state, error: "duplicate" }

  const guessIds = [...state.guessIds, guessId]
  const won = guessId === answerId
  return { state: { ...state, guessIds, won } }
}

const STORAGE_PREFIX = "celestial:daily:"

export function loadDailyState(date: string): DailyGameState | null {
  const raw = localStorage.getItem(STORAGE_PREFIX + date)
  if (!raw) return null
  try {
    return JSON.parse(raw) as DailyGameState
  } catch {
    return null
  }
}

export function saveDailyState(state: DailyGameState): void {
  localStorage.setItem(STORAGE_PREFIX + state.date, JSON.stringify(state))
}
