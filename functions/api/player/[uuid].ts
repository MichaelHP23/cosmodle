import { isValidUuid, rowsToResults, type ResultRow } from "../../_shared/util"
import { deriveStatsFromResults } from "../../../src/lib/statisticsCore"

interface Env {
  DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const uuid = params.uuid
  if (!isValidUuid(uuid)) return Response.json({ error: "invalid_uuid" }, { status: 400 })

  const { results } = await env.DB.prepare(
    "SELECT day_number, won, guess_count, hints_used, gave_up FROM results WHERE uuid = ? ORDER BY day_number ASC"
  )
    .bind(uuid)
    .all<ResultRow>()

  return Response.json(deriveStatsFromResults(rowsToResults(results ?? [])), {
    headers: { "Cache-Control": "private, no-store" },
  })
}
