import { json } from "../_shared/response"
import { buildGuessDistribution } from "../_shared/guessDistribution"
import { currentDayNumber } from "../_shared/dayNumber"
import { STATS_BUCKET_COUNT } from "../../src/lib/gameConstants"

interface Env {
  DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const today = currentDayNumber()

  const totalPlayersRow = await env.DB.prepare("SELECT COUNT(DISTINCT uuid) as n FROM results").first<{ n: number }>()
  const playedTodayRow = await env.DB.prepare("SELECT COUNT(DISTINCT uuid) as n FROM results WHERE day_number = ?")
    .bind(today)
    .first<{ n: number }>()
  const winRow = await env.DB.prepare("SELECT SUM(won) as wins, COUNT(*) as total FROM results").first<{
    wins: number | null
    total: number
  }>()
  const { results: wonRows } = await env.DB.prepare(
    "SELECT guess_count, COUNT(*) as n FROM results WHERE won = 1 GROUP BY guess_count"
  ).all<{
    guess_count: number
    n: number
  }>()

  const totalGames = winRow?.total ?? 0
  const totalWins = winRow?.wins ?? 0

  return json(
    {
      totalPlayers: totalPlayersRow?.n ?? 0,
      playedToday: playedTodayRow?.n ?? 0,
      winRate: totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0,
      guessDistribution: buildGuessDistribution(wonRows ?? [], STATS_BUCKET_COUNT),
    },
    200,
    { "Cache-Control": "public, max-age=60" }
  )
}
