const LABELS: Record<number, string> = {
  1: "Perfect",
  2: "Amazing",
  3: "Great",
  4: "Good",
  5: "Solid",
}

export function getScoreLabel(guessCount: number): string {
  return LABELS[guessCount] ?? "Completed"
}
