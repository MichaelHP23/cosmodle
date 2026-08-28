import type { CelestialObject } from "../types/celestial"
import type { DailyGameState } from "../types/game"

import { MAX_GUESSES, MAX_HINTS } from "./gameConstants"

export function createInitialState(date: string): DailyGameState {
  return { date, guessIds: [], won: false, hintsUsed: 0, gaveUp: false }
}

export function applyGuess(
  state: DailyGameState,
  guessId: string,
  dataset: CelestialObject[],
  answerId: string
): { state: DailyGameState; error?: "invalid_id" | "duplicate" | "already_won" | "game_over" } {
  if (state.won) return { state, error: "already_won" }
  if (state.gaveUp) return { state, error: "game_over" }
  if (state.guessIds.length >= MAX_GUESSES) return { state, error: "game_over" }
  if (!dataset.some(o => o.id === guessId)) return { state, error: "invalid_id" }
  if (state.guessIds.includes(guessId)) return { state, error: "duplicate" }

  const guessIds = [...state.guessIds, guessId]
  const won = guessId === answerId
  return { state: { ...state, guessIds, won } }
}

export function applyHint(
  state: DailyGameState
): { state: DailyGameState; error?: "already_won" | "no_hints_left" } {
  if (state.won || state.gaveUp) return { state, error: "already_won" }
  if (state.hintsUsed >= MAX_HINTS) return { state, error: "no_hints_left" }
  return { state: { ...state, hintsUsed: state.hintsUsed + 1 } }
}

// Giving up ends the day immediately and reveals the answer. It is deliberately not a loss: the only
// cost is the streak, applied by the statistics layer, so a player stuck on one puzzle can bail out
// without it dragging down their win rate.
export function applyGiveUp(
  state: DailyGameState
): { state: DailyGameState; error?: "already_won" | "already_gave_up" } {
  if (state.won) return { state, error: "already_won" }
  if (state.gaveUp) return { state, error: "already_gave_up" }
  return { state: { ...state, gaveUp: true } }
}

const STORAGE_PREFIX = "celestial:daily:"

export function loadDailyState(date: string): DailyGameState | null {
  const raw = localStorage.getItem(STORAGE_PREFIX + date)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as DailyGameState
    return { ...parsed, hintsUsed: parsed.hintsUsed ?? 0, gaveUp: parsed.gaveUp ?? false }
  } catch {
    return null
  }
}

export function saveDailyState(state: DailyGameState): void {
  localStorage.setItem(STORAGE_PREFIX + state.date, JSON.stringify(state))
}
