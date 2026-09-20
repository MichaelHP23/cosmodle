import type { ComparisonStatus } from "../types/game"

// The colour each comparison result is drawn in. Higher and lower are deliberately the same colour:
// they are the same kind of answer — a direction — and the chevrons are what tell them apart.
export const ORB_COLORS: Record<ComparisonStatus, string> = {
  correct: "var(--orb-correct)",
  close: "var(--orb-close)",
  higher: "var(--orb-direction)",
  lower: "var(--orb-direction)",
  incorrect: "var(--orb-wrong)",
  not_applicable: "var(--orb-na)",
}

// The summary row of a collapsed guess, where the four hues above turned a list of guesses into
// confetti. Three steps of one warm scale instead: it matched, it was close, it was neither. Which
// direction a miss went is a detail, and details belong in the guess you opened. The marks are
// squared off to the same corner as the tiles they stand in for.
export const MARK_TONES: Record<ComparisonStatus, string> = {
  correct: "var(--mark-hit)",
  close: "var(--mark-close)",
  higher: "var(--mark-off)",
  lower: "var(--mark-off)",
  incorrect: "var(--mark-off)",
  not_applicable: "var(--mark-na)",
}
