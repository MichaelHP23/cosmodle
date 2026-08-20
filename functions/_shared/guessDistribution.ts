export function buildGuessDistribution(rows: { guess_count: number; n: number }[], maxGuesses: number): number[] {
  const distribution = new Array(maxGuesses).fill(0)
  for (const row of rows) {
    if (row.guess_count >= 1 && row.guess_count <= maxGuesses) {
      distribution[row.guess_count - 1] += row.n
    }
  }
  return distribution
}
