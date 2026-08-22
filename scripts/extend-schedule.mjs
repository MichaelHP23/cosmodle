// Generates src/data/dailySchedule.json: the committed list of which object each day serves.
//
// The old rotation derived every day's answer from dataset.length, so adding one object
// reshuffled days people had already played. The schedule replaces that: it is append-only
// data, so growing the dataset can never rewrite a day that already exists in the file.
//
// Run `npm run schedule` to extend it. A test fails once the file runs close to its end.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SCHEDULE_PATH = path.join(ROOT, "src/data/dailySchedule.json")
const DATASET_PATH = path.join(ROOT, "src/data/celestialObjects.json")

// How far past today the schedule is kept stocked. Also the longest a newly added object can
// wait before it can appear, since days already written are never rewritten.
export const HORIZON_DAYS = 90

// The days that were served by the pre-schedule rotation and can never move: days 1-3 were
// played, day 4 was live when the schedule was introduced.
const SEED = ["cartwheel_galaxy", "nix", "3c48", "ankaa"]

function mulberry32(seed) {
  let state = seed
  return function next() {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Appends days until the schedule is `targetLength` long, never touching existing entries.
// Each new day draws from the objects used least so far, so nothing repeats until every
// object has had a turn and newly added objects (used zero times) come up straight away.
//
// Within that pool it also avoids the category that played yesterday. Constellations are 30% of the
// dataset, so without this they clump into runs of two and three days that all look alike, which is
// what makes the rotation feel repetitive even though it never actually repeats an object.
export function extendSchedule(existing, dataset, targetLength) {
  const schedule = [...existing]
  const categoryOf = new Map(dataset.map(o => [o.id, o.category]))
  const datasetIds = dataset.map(o => o.id)
  const counts = new Map(datasetIds.map(id => [id, 0]))
  for (const id of schedule) {
    if (counts.has(id)) counts.set(id, counts.get(id) + 1)
  }

  while (schedule.length < targetLength) {
    const day = schedule.length + 1
    const min = Math.min(...counts.values())
    const previous = schedule[schedule.length - 1]
    const previousCategory = categoryOf.get(previous)
    let pool = datasetIds.filter(id => counts.get(id) === min).sort()
    // Only bites when the pool is down to the single object that just played.
    if (pool.length > 1) pool = pool.filter(id => id !== previous)
    // Skipped when every remaining candidate shares yesterday's category, because holding the
    // no-repeat guarantee matters more than the variety this adds.
    const varied = pool.filter(id => categoryOf.get(id) !== previousCategory)
    if (varied.length > 0) pool = varied
    const pick = pool[Math.floor(mulberry32(day)() * pool.length)]
    schedule.push(pick)
    counts.set(pick, counts.get(pick) + 1)
  }
  return schedule
}

// The alarm the test asserts on: how long the schedule has left before it runs out.
// Kept here so the generator and the test agree on when it is time to extend.
export function daysRemaining(scheduleLength, todayDayNumber) {
  return scheduleLength - todayDayNumber
}

export function daysSinceLaunch(today, launch) {
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const b = new Date(launch.getFullYear(), launch.getMonth(), launch.getDate()).getTime()
  return Math.round((a - b) / 86400000)
}

function main() {
  const dataset = JSON.parse(fs.readFileSync(DATASET_PATH, "utf8"))
  const datasetIds = dataset.map(o => o.id)
  const existing = fs.existsSync(SCHEDULE_PATH)
    ? JSON.parse(fs.readFileSync(SCHEDULE_PATH, "utf8"))
    : SEED

  const stale = existing.filter(id => !datasetIds.includes(id))
  if (stale.length > 0) {
    console.error(`Refusing to write: scheduled objects missing from the dataset: ${stale.join(", ")}`)
    console.error("Removing or renaming a scheduled object rewrites days people have played. Restore the id.")
    process.exit(1)
  }

  const launch = new Date(2026, 7, 18)
  const today = daysSinceLaunch(new Date(), launch) + 1
  const target = today + HORIZON_DAYS
  if (existing.length >= target) {
    console.log(`Schedule already covers day ${existing.length} (today is day ${today}). Nothing to do.`)
    return
  }

  const next = extendSchedule(existing, dataset, target)
  fs.writeFileSync(SCHEDULE_PATH, JSON.stringify(next, null, 2) + "\n")
  console.log(`Extended schedule from day ${existing.length} to day ${next.length} (today is day ${today}).`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
