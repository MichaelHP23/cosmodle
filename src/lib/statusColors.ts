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
