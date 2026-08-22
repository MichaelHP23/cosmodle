import { MAX_HINTS } from "../../src/lib/gameConstants"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// The client's guess limit has come down over time (20 at launch, 15 now). A player still running a
// cached older build, or a retry carrying an older result, must not have their game rejected, so the
// server validates against the highest limit ever shipped rather than the current one.
const HIGHEST_SHIPPED_GUESS_LIMIT = 20

export function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value)
}

// A player can give up before guessing anything, so a give-up is the one result with no guesses.
export function isValidGuessCount(value: unknown, allowZero = false): value is number {
  if (typeof value !== "number" || !Number.isInteger(value)) return false
  return value >= (allowZero ? 0 : 1) && value <= HIGHEST_SHIPPED_GUESS_LIMIT
}

export function isValidHintsUsed(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_HINTS
}
