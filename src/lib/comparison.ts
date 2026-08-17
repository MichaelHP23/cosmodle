import type { ComparatorKind, ComparisonResult } from "../types/game"

const NUMERIC_CORRECT_TOLERANCE = 0.02 // within 2% -> correct
const NUMERIC_CLOSE_TOLERANCE = 0.15   // within 15% -> close
const TEMPERATURE_CORRECT_TOLERANCE_K = 3
const TEMPERATURE_CLOSE_TOLERANCE_K = 25

function relativeDiff(guess: number, answer: number): number {
  const denom = Math.max(Math.abs(guess), Math.abs(answer), 1e-9)
  return Math.abs(answer - guess) / denom
}

function compareNumeric(guess: number, answer: number): ComparisonResult {
  const difference = answer - guess
  const rel = relativeDiff(guess, answer)
  if (rel <= NUMERIC_CORRECT_TOLERANCE) return { status: "correct", difference }
  if (rel <= NUMERIC_CLOSE_TOLERANCE) return { status: "close", difference }
  return { status: difference > 0 ? "higher" : "lower", difference }
}

function compareTemperature(guess: number, answer: number): ComparisonResult {
  const difference = answer - guess
  const abs = Math.abs(difference)
  if (abs <= TEMPERATURE_CORRECT_TOLERANCE_K) return { status: "correct", difference }
  if (abs <= TEMPERATURE_CLOSE_TOLERANCE_K) return { status: "close", difference }
  return { status: difference > 0 ? "higher" : "lower", difference }
}

function compareExact(guess: unknown, answer: unknown): ComparisonResult {
  return { status: guess === answer ? "correct" : "incorrect" }
}

export function compareProperty(
  guessValue: unknown,
  answerValue: unknown,
  kind: ComparatorKind
): ComparisonResult {
  if (guessValue === undefined || guessValue === null || answerValue === undefined || answerValue === null) {
    return { status: "not_applicable" }
  }
  if (kind === "numeric") return compareNumeric(guessValue as number, answerValue as number)
  if (kind === "temperature") return compareTemperature(guessValue as number, answerValue as number)
  return compareExact(guessValue, answerValue)
}
