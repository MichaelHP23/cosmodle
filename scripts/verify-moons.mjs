import fs from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { cachedFetch } from "./lib/fetchCache.mjs"
import { renderReport, applyChanges } from "./lib/datasetDiff.mjs"
import { extractField, parseValTemplate } from "./lib/wikiInfobox.mjs"
export { parseValTemplate }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DATASET = path.join(ROOT, "src/data/celestialObjects.json")

// JPL keeps satellite data as two server-rendered DataTables rather than a queryable API: physical
// parameters (GM, mean radius, mean density) and mean orbital elements (semi-major axis, period, ...).
// Both are fetched as HTML and read the same way verify-constellations.mjs reads a wikitext table.
const PHYS_PAR_URL = "https://ssd.jpl.nasa.gov/sats/phys_par/"
const ELEM_URL = "https://ssd.jpl.nasa.gov/sats/elem/"

const PHYS_PAR_SOURCE = "JPL SSD planetary satellite physical parameters"
const ELEM_SOURCE = "JPL SSD planetary satellite mean orbital elements"
const WIKI_SOURCE = "Wikipedia infobox"

const G = 6.674e-11
// GM is tabulated in km^3/s^2. G expressed in the same km-based units turns GM straight into a mass.
const G_KM = 6.674e-20

// distanceFromParentKm and orbitalPeriodDays come straight off a fitted orbit and land within a
// fraction of a percent of the dataset almost everywhere, so the tolerance stays tight. The physical
// parameters are looser: many of these moons only have GM known to two or three significant figures.
const TOLERANCE = {
  distanceFromParentKm: 0.02,
  orbitalPeriodDays: 0.02,
  diameterKm: 0.05,
  massKg: 0.05,
  gravityMs2: 0.05,
}

// Five small moons are irregular lumps rather than spheres. Their dataset-recorded surface gravity is
// the figure quoted at the longest axis, where gravity is weakest, while g = GM / r^2 here always uses
// the mean (volume-equivalent) radius, which overstates gravity for a lumpy body. src/data/
// celestialObjects.test.ts exempts the same five ids from the same mass/diameter-implies-gravity check
// for exactly this reason.
const REJECT = {
  "epimetheus.gravityMs2": "irregular moon; published gravity is quoted at the longest axis, a mean-radius sphere overstates it",
  "pan.gravityMs2": "irregular moon; published gravity is quoted at the longest axis, a mean-radius sphere overstates it",
  "larissa.gravityMs2": "irregular moon; published gravity is quoted at the longest axis, a mean-radius sphere overstates it",
  "nix.gravityMs2": "irregular moon; published gravity is quoted at the longest axis, a mean-radius sphere overstates it",
  "hydra_moon.gravityMs2": "irregular moon; published gravity is quoted at the longest axis, a mean-radius sphere overstates it",
}

// JPL's physical-parameters table has no row at all for these three: no spacecraft has ever measured
// their mass by tracking, so GM has never been fit for them. Wikipedia is the fallback source for those
// two fields only, keyed by the dataset id.
const WIKI_FALLBACK = {
  puck: "Puck_(moon)",
  daphnis: "Daphnis_(moon)",
  portia: "Portia_(moon)",
}
const wikiUrl = page =>
  "https://en.wikipedia.org/w/api.php?action=parse&format=json&formatversion=2&prop=wikitext&page=" + page

function cleanCell(text) {
  return text.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()
}

// Neither JPL table closes every <td> before the next one opens, so splitting on the closing tag
// would silently misalign columns. Splitting on the opening tag instead is exact regardless of that.
function rowsOf(html, tableId) {
  const tableStart = html.indexOf(`id="${tableId}"`)
  if (tableStart === -1) throw new Error(`verify-moons: could not find table #${tableId}, the page layout moved`)
  const bodyStart = html.indexOf("<tbody>", tableStart)
  const bodyEnd = html.indexOf("</tbody>", bodyStart)
  if (bodyStart === -1 || bodyEnd === -1) throw new Error(`verify-moons: #${tableId} has no tbody`)
  return html.slice(bodyStart, bodyEnd).split("<tr>").slice(1)
}

function cellsOf(row) {
  return row.split(/<td[^>]*>/).slice(1).map(cleanCell)
}

// Columns: Planet, Satellite, Code, GM value/sigma/ref, Mean Radius value/sigma/ref, Mean Density
// value/sigma/ref. An unmeasured GM is printed as 0.00000 rather than left blank, so callers treat
// gm <= 0 as "not measured" rather than a real zero.
export function parsePhysParTable(html) {
  const records = {}
  for (const row of rowsOf(html, "sat_phys_par")) {
    const cells = cellsOf(row)
    const name = cells[1]
    if (!name) continue
    records[name] = { gm: Number(cells[3]), radius: Number(cells[6]), density: Number(cells[9]) }
  }
  if (Object.keys(records).length === 0) {
    throw new Error("verify-moons: parsed zero rows from the physical parameters table")
  }
  return records
}

// Columns: ID, Planet, Satellite, Code, Ephemeris, Frame, Epoch, a (km), e, omega, M, i, node,
// P (days), P_apsis, P_node, R.A., Dec., Tilt, Ref. Only the semi-major axis and period are needed.
export function parseElemTable(html) {
  const records = {}
  for (const row of rowsOf(html, "sat_elem")) {
    const cells = cellsOf(row)
    const name = cells[2]
    if (!name) continue
    records[name] = { a: Number(cells[7].replace(/,/g, "")), period: Number(cells[13]) }
  }
  if (Object.keys(records).length === 0) {
    throw new Error("verify-moons: parsed zero rows from the orbital elements table")
  }
  return records
}


// A few small moons are known only by their three axis lengths rather than a mean radius or diameter.
// The volume-equivalent mean diameter of a triaxial body is the geometric mean of those three lengths.
// The citation markup that follows the unit is dropped first so a footnote year is never read as a
// fourth measurement.
export function meanDiameterFromDimensions(text) {
  const beforeUnit = text.split(/km/i)[0]
  const nums = [...beforeUnit.matchAll(/\d+(?:\.\d+)?/g)].map(Number)
  if (nums.length < 3) return null
  return Math.cbrt(nums[0] * nums[1] * nums[2])
}

// mean_diameter and mean_radius are direct measurements and are preferred over dimensions, which
// requires assuming the body is well approximated by an ellipsoid.
export function parseWikiPhysical(wikitext) {
  const massField = extractField(wikitext, "mass")
  const massKg = massField ? parseValTemplate(massField) : null

  const diameterField = extractField(wikitext, "mean_diameter")
  const radiusField = extractField(wikitext, "mean_radius")
  const dimensionsField = extractField(wikitext, "dimensions")

  let diameterKm = null
  if (diameterField) diameterKm = parseValTemplate(diameterField)
  else if (radiusField) {
    const r = parseValTemplate(radiusField)
    diameterKm = r === null ? null : r * 2
  } else if (dimensionsField) diameterKm = meanDiameterFromDimensions(dimensionsField)

  return { massKg, diameterKm }
}

function compare(changes, obj, field, value, source, reason) {
  const current = obj[field]
  if (typeof current !== "number" || value == null || !Number.isFinite(value)) return
  const rel = Math.abs(value - current) / Math.max(Math.abs(value), 1e-12)
  if (rel <= (TOLERANCE[field] ?? 0.05)) return
  const rejection = REJECT[`${obj.id}.${field}`]
  if (rejection) { console.error(`skipping ${obj.id}.${field}: ${rejection}`); return }
  changes.push({ id: obj.id, field, from: current, to: Number(value.toPrecision(6)), reason, source })
}

// diameterKm and massKg are resolved independently, because JPL sometimes has a mean radius for a
// moon whose GM has never been measured (Nereid: no spacecraft has tracked it closely enough), and the
// dataset can still be checked on the field JPL does carry rather than skipping the moon entirely.
export function collectChanges(moons, physRecords, elemRecords, wikiPhysicalById = {}) {
  const changes = []

  for (const obj of moons) {
    const elem = elemRecords[obj.name]
    if (!elem) console.error(`no JPL orbital element row for ${obj.id} (${obj.name})`)
    else {
      compare(changes, obj, "distanceFromParentKm", elem.a, ELEM_SOURCE, "JPL mean semi-major axis")
      compare(changes, obj, "orbitalPeriodDays", elem.period, ELEM_SOURCE, "JPL mean orbital period")
    }

    const phys = physRecords[obj.name]
    const fallback = wikiPhysicalById[obj.id]

    let diameterKm = null
    let diameterSource = null
    if (phys && phys.radius > 0) { diameterKm = phys.radius * 2; diameterSource = PHYS_PAR_SOURCE }
    else if (fallback && fallback.diameterKm != null) { diameterKm = fallback.diameterKm; diameterSource = WIKI_SOURCE }

    let massKg = null
    let massSource = null
    if (phys && phys.gm > 0) { massKg = phys.gm / G_KM; massSource = PHYS_PAR_SOURCE }
    else if (fallback && fallback.massKg != null) { massKg = fallback.massKg; massSource = WIKI_SOURCE }

    if (diameterKm != null) {
      compare(changes, obj, "diameterKm", diameterKm, diameterSource,
        diameterSource === PHYS_PAR_SOURCE ? "JPL mean diameter (2x mean radius)" : "Wikipedia mean diameter")
    } else console.error(`no mean radius/diameter for ${obj.id} (${obj.name}) in JPL or Wikipedia`)

    if (massKg != null) {
      compare(changes, obj, "massKg", massKg, massSource,
        massSource === PHYS_PAR_SOURCE ? "JPL GM / G" : "Wikipedia mass")
    } else console.error(`no measured mass for ${obj.id} (${obj.name}) in JPL or Wikipedia`)

    if (massKg != null && diameterKm != null) {
      const r = (diameterKm * 1000) / 2
      const g = (G * massKg) / (r * r)
      const source = massSource === PHYS_PAR_SOURCE && diameterSource === PHYS_PAR_SOURCE ? PHYS_PAR_SOURCE : WIKI_SOURCE
      const reason = `g = GM/r^2 from ${massSource === PHYS_PAR_SOURCE ? "JPL GM" : "Wikipedia mass"} and ` +
        `${diameterSource === PHYS_PAR_SOURCE ? "JPL mean radius" : "Wikipedia mean diameter"}`
      compare(changes, obj, "gravityMs2", g, source, reason)
    }
  }

  return changes
}

async function main() {
  const dataset = JSON.parse(fs.readFileSync(DATASET, "utf8"))
  const moons = dataset.filter(o => o.category === "moon")

  const physRecords = parsePhysParTable(await cachedFetch(PHYS_PAR_URL))
  const elemRecords = parseElemTable(await cachedFetch(ELEM_URL))

  const wikiPhysicalById = {}
  for (const [id, page] of Object.entries(WIKI_FALLBACK)) {
    const wikitext = JSON.parse(await cachedFetch(wikiUrl(page)))?.parse?.wikitext
    if (typeof wikitext === "string") wikiPhysicalById[id] = parseWikiPhysical(wikitext)
    else console.error(`no wikitext returned for ${page}`)
  }

  const changes = collectChanges(moons, physRecords, elemRecords, wikiPhysicalById)
  console.log(renderReport(changes))
  if (process.argv.includes("--apply")) console.log("applied " + applyChanges(DATASET, changes))
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main()
