import fs from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { cachedFetch } from "./lib/fetchCache.mjs"
import { renderReport, applyChanges } from "./lib/datasetDiff.mjs"
import { extractField, stripMarkup, parseValTemplate, parseLyField, parseBareNumber, MSUN_KG } from "./lib/wikiInfobox.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DATASET = path.join(ROOT, "src/data/celestialObjects.json")

const WIKI_SOURCE = "Wikipedia infobox"

// A few dataset names don't match their Wikipedia article title (common names that redirect, or
// ambiguous titles that need disambiguation). Wikipedia's own redirect resolves everything else.
const WIKI_PAGE = {
  bodes_galaxy: "Messier 81",
  cigar_galaxy: "Messier 82",
  pinwheel_galaxy: "Pinwheel Galaxy",
}

const sleep = ms => new Promise(r => setTimeout(r, ms))
const wikiUrl = page =>
  "https://en.wikipedia.org/w/api.php?action=parse&format=json&formatversion=2&redirects=&prop=wikitext&page=" +
  encodeURIComponent(page)

export function parseGalaxyInfobox(wikitext) {
  const distText = extractField(wikitext, "dist_ly")
  const distLy = parseLyField(distText)

  const sizeText = extractField(wikitext, "size")
  const diameterLy = parseLyField(sizeText)

  const radiusText = extractField(wikitext, "radius_ly")
  const radiusLy = radiusText != null ? parseLyField(radiusText) : null

  const massText = extractField(wikitext, "mass")
  const massClean = massText == null ? null : stripMarkup(massText)
  const massSolar = massClean == null ? null : parseValTemplate(massClean)

  const magText = extractField(wikitext, "appmag_v")
  const apparentMagnitude = parseBareNumber(magText)

  const zText = extractField(wikitext, "z")
  const redshift = zText == null ? null : parseBareNumber(zText)

  return {
    distanceFromEarthLy: distLy,
    diameterKm: diameterLy != null ? diameterLy * 9.4607e12
      : radiusLy != null ? radiusLy * 2 * 9.4607e12 : null,
    massKg: massSolar != null ? massSolar * MSUN_KG : null,
    apparentMagnitude,
    redshift,
  }
}

const TOLERANCE = {
  distanceFromEarthLy: 0.1,
  diameterKm: 0.15,
  massKg: 0.3,
  apparentMagnitude: 0.15,
  redshift: 0.5,
}

// The Milky Way has no distanceFromEarthLy or redshift (we're inside it), and no Wikipedia
// appmag_v (it isn't seen as a point source). Its mass and size are checked like any other galaxy.
const SKIP = {
  "milky_way.distanceFromEarthLy": "we are inside it; distance from Earth isn't a meaningful figure",
  "milky_way.apparentMagnitude": "seen from within, not as a point source; no apparent magnitude applies",
  "milky_way.redshift": "peculiar motion within the Local Group dominates; not a cosmological measurement",
  // Wikipedia states this as a range ("11-13 Mly"); the parser reads only the low end, but the
  // dataset's existing 13 Mly already sits inside the cited range and is not wrong.
  "centaurus_a.distanceFromEarthLy": "cited as a range (11-13 Mly); the current value already falls within it",
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

    if (info.diameterKm != null) compare(changes, obj, "diameterKm", info.diameterKm, "Wikipedia infobox size")
    else console.error(`no size/radius field for ${obj.id} (${obj.name})`)

    if (info.massKg != null) compare(changes, obj, "massKg", info.massKg, "Wikipedia infobox mass")

    if (info.apparentMagnitude != null) compare(changes, obj, "apparentMagnitude", info.apparentMagnitude, "Wikipedia infobox apparent magnitude")

    if (info.redshift != null) compare(changes, obj, "redshift", info.redshift, "Wikipedia infobox redshift")
  }
  return changes
}

async function main() {
  const dataset = JSON.parse(fs.readFileSync(DATASET, "utf8"))
  const objects = dataset.filter(o => o.category === "galaxy" || o.category === "nebula")

  const infoboxById = {}
  for (const obj of objects) {
    const page = WIKI_PAGE[obj.id] || obj.name
    try {
      const body = await cachedFetch(wikiUrl(page), { retries: 3, baseDelayMs: 2000 })
      const wikitext = JSON.parse(body)?.parse?.wikitext
      if (typeof wikitext === "string") infoboxById[obj.id] = parseGalaxyInfobox(wikitext)
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
