import { buildGuessDistribution, currentDayNumber } from "../_shared/util"
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
  // Days a player gave up on are not games played, the same rule the per-player stats use, so they
  // must not drag the global win rate down.
  const winRow = await env.DB.prepare("SELECT SUM(won) as wins, COUNT(*) as total FROM results WHERE gave_up = 0").first<{
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

  return Response.json(
    {
      totalPlayers: totalPlayersRow?.n ?? 0,
      playedToday: playedTodayRow?.n ?? 0,
      winRate: totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0,
      guessDistribution: buildGuessDistribution(wonRows ?? [], STATS_BUCKET_COUNT),
    },
    { headers: { "Cache-Control": "public, max-age=60" } }
  )
}
