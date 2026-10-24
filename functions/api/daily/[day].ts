import dataset from "../../../src/data/celestialObjects.json"
import { currentDayNumber, pickDailyObjectId } from "../../_shared/util"

interface Env {
  DB: D1Database
}

// The day's answer lives only in D1 and is drawn the first time anyone asks for that day, so no
// future answer exists anywhere, in the bundle or the repo, until the day is live somewhere on Earth.
// Once drawn it never changes, so growing the dataset can't rewrite a day people have played.
export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const day = Number(params.day)
  // UTC+14 is a calendar day ahead of UTC, so tomorrow-in-UTC is already someone's today.
  if (!Number.isInteger(day) || day < 1 || day > currentDayNumber() + 1) {
    return Response.json({ error: "invalid_day" }, { status: 404 })
  }

  const select = env.DB.prepare("SELECT object_id FROM daily_answers WHERE day_number = ?")
  let row = await select.bind(day).first<{ object_id: string }>()
  if (!row) {
    const { results } = await env.DB.prepare(
      "SELECT object_id, COUNT(*) AS n FROM daily_answers GROUP BY object_id"
    ).all<{ object_id: string; n: number }>()
    const previous = await select.bind(day - 1).first<{ object_id: string }>()
    const pick = pickDailyObjectId(
      dataset,
      new Map((results ?? []).map(r => [r.object_id, r.n])),
      previous?.object_id ?? null
    )
    // Two first requests can race; OR IGNORE plus the re-read means both serve whichever landed.
    await env.DB.prepare("INSERT OR IGNORE INTO daily_answers (day_number, object_id) VALUES (?, ?)")
      .bind(day, pick)
      .run()
    row = await select.bind(day).first<{ object_id: string }>()
  }

  return Response.json({ objectId: row!.object_id }, { headers: { "Cache-Control": "private, max-age=86400" } })
}
