import { isValidUuid } from "../../_shared/validate"
import { json } from "../../_shared/response"
import { rowsToResults, type ResultRow } from "../../_shared/rows"
import { deriveStatsFromResults } from "../../../src/lib/statisticsCore"

interface Env {
  DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const uuid = params.uuid
  if (!isValidUuid(uuid)) return json({ error: "invalid_uuid" }, 400)

  const { results } = await env.DB.prepare(
    "SELECT day_number, won, guess_count, hints_used FROM results WHERE uuid = ? ORDER BY day_number ASC"
  )
    .bind(uuid)
    .all<ResultRow>()

  return json(deriveStatsFromResults(rowsToResults(results ?? [])), 200, { "Cache-Control": "private, no-store" })
}
