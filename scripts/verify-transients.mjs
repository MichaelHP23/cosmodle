import fs from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { cachedFetch } from "./lib/fetchCache.mjs"
import { renderReport, applyChanges } from "./lib/datasetDiff.mjs"
import { firstNonEmpty, extractField, parseLyField, parseBareNumber } from "./lib/wikiInfobox.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DATASET = path.join(ROOT, "src/data/celestialObjects.json")

const WIKI_SOURCE = "Wikipedia infobox"

// GW170817/AT 2017gfo is catalogued on Wikipedia under its gravitational-wave name.
const WIKI_PAGE = { at_2017gfo: "GW170817" }

const sleep = ms => new Promise(r => setTimeout(r, ms))
const wikiUrl = page =>
  "https://en.wikipedia.org/w/api.php?action=parse&format=json&formatversion=2&redirects=&prop=wikitext&page=" +
  encodeURIComponent(page)

export function parseTransientInfobox(wikitext) {
  const distText = firstNonEmpty(wikitext, ["distance", "dist_ly"])
  const magText = firstNonEmpty(wikitext, ["mag_v", "appmag_v"])
  const redshiftText = extractField(wikitext, "redshift")
  return {
    distanceFromEarthLy: parseLyField(distText),
    apparentMagnitude: parseBareNumber(magText),
    redshift: parseBareNumber(redshiftText),
  }
}

const TOLERANCE = { distanceFromEarthLy: 0.15, apparentMagnitude: 0.2, redshift: 0.15 }

// The dataset's narrative ("the light reaching us tonight left it X years ago") uses light-travel
// (lookback) distance throughout, matching the convention verify-black-holes.mjs establishes for
// the same reason. At z=0.151, light-travel distance works out to 1.90 Gly, matching the dataset's
// existing 1.9 billion ly exactly. Wikipedia's rounded "~2.4 billion ly" doesn't match light-travel
// (1.90 Gly) or comoving (2.04 Gly) distance for this redshift under standard LCDM, so it isn't a
// correction, just a different, unreconciled figure; applying it would break the convention.
const SKIP = {
  "grb_221009a.distanceFromEarthLy": "dataset already uses the correct light-travel distance for z=0.151; Wikipedia's rounded figure matches neither light-travel nor comoving distance",
}

function compare(changes, obj, field, value, reason) {
  if (SKIP[`${obj.id}.${field}`]) return
  const current = obj[field]
  if (typeof current !== "number" || value == null || !Number.isFinite(value)) return
  const rel = Math.abs(value - current) / Math.max(Math.abs(value), 1e-12)
  if (rel <= (TOLERANCE[field] ?? 0.1)) return
  changes.push({ id: obj.id, field, from: current, to: Number(value.toPrecision(6)), reason, source: WIKI_SOURCE })
}

export function collectChanges(objects, infoboxById) {
  const changes = []
  for (const obj of objects) {
    const info = infoboxById[obj.id]
    if (!info) { console.error(`no Wikipedia infobox parsed for ${obj.id} (${obj.name})`); continue }

    if (info.distanceFromEarthLy != null) compare(changes, obj, "distanceFromEarthLy", info.distanceFromEarthLy, "Wikipedia infobox distance")
    else console.error(`no distance field for ${obj.id} (${obj.name})`)

    if (info.apparentMagnitude != null) compare(changes, obj, "apparentMagnitude", info.apparentMagnitude, "Wikipedia infobox apparent magnitude")
    else console.error(`no magnitude field for ${obj.id} (${obj.name})`)

    if (info.redshift != null) compare(changes, obj, "redshift", info.redshift, "Wikipedia infobox redshift")
    else console.error(`no redshift field for ${obj.id} (${obj.name})`)
  }
  return changes
}

async function main() {
  const dataset = JSON.parse(fs.readFileSync(DATASET, "utf8"))
  const objects = dataset.filter(o => o.category === "transient")

  const infoboxById = {}
  for (const obj of objects) {
    const page = WIKI_PAGE[obj.id] || obj.name
    try {
      const body = await cachedFetch(wikiUrl(page), { retries: 3, baseDelayMs: 2000 })
      const wikitext = JSON.parse(body)?.parse?.wikitext
      if (typeof wikitext !== "string") { console.error(`no wikitext returned for ${page} (${obj.id})`); continue }
      if (!/\{\{Infobox/i.test(wikitext)) { console.error(`no infobox on ${page} (${obj.id}); not verified`); continue }
      infoboxById[obj.id] = parseTransientInfobox(wikitext)
    } catch (err) {
      console.error(`fetch failed for ${page} (${obj.id}): ${err.message}`)
    }
    await sleep(1500)
  }

  const changes = collectChanges(objects, infoboxById)
  console.log(renderReport(changes))
  if (process.argv.includes("--apply")) console.log("applied " + applyChanges(DATASET, changes))
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main()
