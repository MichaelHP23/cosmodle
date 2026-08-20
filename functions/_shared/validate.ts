import { MAX_GUESSES, MAX_HINTS } from "../../src/lib/gameConstants"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value)
}

export function isValidGuessCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= MAX_GUESSES
}

export function isValidHintsUsed(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_HINTS
}
