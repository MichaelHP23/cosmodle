import type { CelestialObject } from "../types/celestial"
import type { DailyGameState } from "../types/game"

import { MAX_GUESSES, MAX_HINTS } from "./gameConstants"
export { MAX_GUESSES, MAX_HINTS }

export function createInitialState(date: string): DailyGameState {
  return { date, guessIds: [], won: false, hintsUsed: 0 }
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

export function useHint(
  state: DailyGameState
): { state: DailyGameState; error?: "already_won" | "no_hints_left" } {
  if (state.won) return { state, error: "already_won" }
  if (state.hintsUsed >= MAX_HINTS) return { state, error: "no_hints_left" }
  return { state: { ...state, hintsUsed: state.hintsUsed + 1 } }
}

const STORAGE_PREFIX = "celestial:daily:"

export function loadDailyState(date: string): DailyGameState | null {
  const raw = localStorage.getItem(STORAGE_PREFIX + date)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as DailyGameState
    return { ...parsed, hintsUsed: parsed.hintsUsed ?? 0 }
  } catch {
    return null
  }
}

export function saveDailyState(state: DailyGameState): void {
  localStorage.setItem(STORAGE_PREFIX + state.date, JSON.stringify(state))
}
