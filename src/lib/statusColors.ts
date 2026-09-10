import type { ComparisonStatus } from "../types/game"

// The colour each comparison result is drawn in, shared by the full-size orbs and by the compact dot
// row that summarises a collapsed guess. Higher and lower are deliberately the same colour: they are
// the same kind of answer — a direction — and the chevron is what tells them apart.
export const ORB_COLORS: Record<ComparisonStatus, string> = {
  correct: "#e8a33d",
  close: "#2f9e8f",
  higher: "#7c74c9",
  lower: "#7c74c9",
  incorrect: "#c17287",
  not_applicable: "#d8cdb6",
}

// The summary row of a collapsed guess, where the four hues above turned a list of guesses into
// confetti. Three steps of one warm scale instead: it matched, it was close, it was neither. Which
// direction a miss went is a detail, and details belong in the guess you opened.
export const MARK_TONES: Record<ComparisonStatus, string> = {
  correct: "#d99a2b",
  close: "#cbb489",
  higher: "#e3dccd",
  lower: "#e3dccd",
  incorrect: "#e3dccd",
  not_applicable: "#eee8dc",
}
