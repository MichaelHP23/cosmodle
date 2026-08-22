import type { DailyResult } from "../../src/lib/statisticsCore"

export type ResultRow = {
  day_number: number
  won: number
  guess_count: number
  hints_used: number
  gave_up: number
}

export function rowsToResults(rows: ResultRow[]): DailyResult[] {
  return rows.map(r => ({
    dayNumber: r.day_number,
    won: r.won === 1,
    guessCount: r.guess_count,
    hintsUsed: r.hints_used,
    gaveUp: r.gave_up === 1,
  }))
}
