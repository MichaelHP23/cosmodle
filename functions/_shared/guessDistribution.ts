export function buildGuessDistribution(rows: { guess_count: number; n: number }[], bucketCount: number): number[] {
  const distribution = new Array(bucketCount).fill(0)
  for (const row of rows) {
    if (row.guess_count >= 1) {
      distribution[Math.min(row.guess_count, bucketCount) - 1] += row.n
    }
  }
  return distribution
}
