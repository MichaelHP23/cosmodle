import { isValidUuid, isValidGuessCount, isValidHintsUsed } from "../_shared/validate"
import { isValidDayNumber } from "../_shared/dayNumber"
import { json } from "../_shared/response"
import { rowsToResults, type ResultRow } from "../_shared/rows"
import { deriveStatsFromResults } from "../../src/lib/statisticsCore"

interface Env {
  DB: D1Database
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body || !isValidUuid(body.uuid)) return json({ error: "invalid_uuid" }, 400)
  if (!isValidDayNumber(body.dayNumber)) return json({ error: "invalid_day_number" }, 400)
  if (typeof body.won !== "boolean") return json({ error: "invalid_won" }, 400)
  if (!isValidHintsUsed(body.hintsUsed)) return json({ error: "invalid_hints_used" }, 400)
  // Older clients do not send gaveUp at all, so absent means a normal finished game.
  if (body.gaveUp !== undefined && typeof body.gaveUp !== "boolean") {
    return json({ error: "invalid_gave_up" }, 400)
  }
  if (!isValidGuessCount(body.guessCount, body.gaveUp === true)) {
    return json({ error: "invalid_guess_count" }, 400)
  }

  await env.DB.prepare(
    "INSERT OR IGNORE INTO results (uuid, day_number, won, guess_count, hints_used, gave_up, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      body.uuid,
      body.dayNumber,
      body.won ? 1 : 0,
      body.guessCount,
      body.hintsUsed,
      body.gaveUp ? 1 : 0,
      Date.now()
    )
    .run()

  const { results } = await env.DB.prepare(
    "SELECT day_number, won, guess_count, hints_used, gave_up FROM results WHERE uuid = ? ORDER BY day_number ASC"
  )
    .bind(body.uuid)
    .all<ResultRow>()

  return json(deriveStatsFromResults(rowsToResults(results ?? [])))
}
