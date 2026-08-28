import fs from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { cachedFetch } from "./lib/fetchCache.mjs"
import { renderReport, applyChanges } from "./lib/datasetDiff.mjs"
import { extractField, firstNonEmpty, parseLyField, parseBareNumber, MSUN_KG } from "./lib/wikiInfobox.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DATASET = path.join(ROOT, "src/data/celestialObjects.json")

const WIKI_SOURCE = "Wikipedia infobox"

// Several dataset names are a common nickname plus a Messier number in parens; the Wikipedia
// article lives at the bare Messier designation.
const WIKI_PAGE = {
  hyades: "Hyades (star cluster)",
  m13: "Messier 13",
  m7: "Messier 7",
  m67: "Messier 67",
  m22: "Messier 22",
  m15: "Messier 15",
}

const sleep = ms => new Promise(r => setTimeout(r, ms))
const wikiUrl = page =>
  "https://en.wikipedia.org/w/api.php?action=parse&format=json&formatversion=2&redirects=&prop=wikitext&page=" +
  encodeURIComponent(page)

export function parseClusterInfobox(wikitext) {
  const distText = firstNonEmpty(wikitext, ["dist_ly", "dist_pc"])
  const radiusText = extractField(wikitext, "radius_ly")
  const massMsolText = extractField(wikitext, "mass_msol")
  const massKgText = extractField(wikitext, "mass_kg")
  const magText = extractField(wikitext, "appmag_v")

  const massMsol = massMsolText ? parseBareNumber(massMsolText) : null
  const massKgDirect = massKgText ? parseBareNumber(massKgText) : null

  return {
    distanceFromEarthLy: parseLyField(distText),
    diameterKm: radiusText != null ? (() => {
      const r = parseLyField(radiusText)
      return r == null ? null : r * 2 * 9.4607e12
    })() : null,
    massKg: massMsol != null ? massMsol * MSUN_KG : massKgDirect != null ? massKgDirect : null,
    apparentMagnitude: parseBareNumber(magText),
  }
}

const TOLERANCE = {
  distanceFromEarthLy: 0.1,
  diameterKm: 0.2,
  massKg: 0.3,
  apparentMagnitude: 0.15,
}

function compare(changes, obj, field, value, reason) {
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

    if (info.diameterKm != null) compare(changes, obj, "diameterKm", info.diameterKm, "Wikipedia infobox radius (doubled)")
    else console.error(`no radius field for ${obj.id} (${obj.name})`)

    if (info.massKg != null) compare(changes, obj, "massKg", info.massKg, "Wikipedia infobox mass")
    else console.error(`no mass field for ${obj.id} (${obj.name})`)

    if (info.apparentMagnitude != null) compare(changes, obj, "apparentMagnitude", info.apparentMagnitude, "Wikipedia infobox apparent magnitude")
  }
  return changes
}

async function main() {
  const dataset = JSON.parse(fs.readFileSync(DATASET, "utf8"))
  const objects = dataset.filter(o => o.category === "star_cluster")

  const infoboxById = {}
  for (const obj of objects) {
    const page = WIKI_PAGE[obj.id] || obj.name
    try {
      const body = await cachedFetch(wikiUrl(page), { retries: 3, baseDelayMs: 2000 })
      const wikitext = JSON.parse(body)?.parse?.wikitext
      if (typeof wikitext === "string") infoboxById[obj.id] = parseClusterInfobox(wikitext)
      else console.error(`no wikitext returned for ${page} (${obj.id})`)
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
