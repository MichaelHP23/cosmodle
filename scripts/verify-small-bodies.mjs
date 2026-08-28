import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { cachedFetch } from "./lib/fetchCache.mjs"
import { renderReport, applyChanges } from "./lib/datasetDiff.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DATASET = path.join(ROOT, "src/data/celestialObjects.json")

// SBDB wants the designation a body is catalogued under, which is not always the display name.
const LOOKUP = {
  vesta: "4", pallas: "2", juno_asteroid: "3", hygiea: "10", interamnia: "704",
  eunomia: "15", davida: "511", lutetia: "21", psyche: "16", ida: "243",
  eros: "433", bennu: "101955", ryugu: "162173", apophis: "99942", itokawa: "25143",
  halley: "1P", encke: "2P", swift_tuttle: "109P", hyakutake: "C/1996 B2",
  hale_bopp: "C/1995 O1", neowise: "C/2020 F3", chiron: "95P",
  ceres: "1", pluto: "134340", eris: "136199", haumea: "136108", makemake: "136472",
  sylvia: "87", kleopatra: "216", mathilde: "253", hektor: "624", gaspra: "951",
  phaethon: "3200", churyumov_gerasimenko: "67P", tempel_1: "9P", wild_2: "81P",
  borrelly: "19P",
}

const TOLERANCE = { distanceFromSunAU: 0.02, diameterKm: 0.05, rotationPeriodHours: 0.02 }

// SBDB is the authority for orbits, but its physical diameters are often the IRAS-era radiometric
// figures, and for the large main-belt asteroids the dataset already carries the newer VLT/SPHERE
// adaptive-optics diameters. The discovery years SBDB reports for the distant dwarf planets are the
// dates of the precovery images rather than the year the object was recognised and announced, which
// is the year the game asks players for. Each rejection below names why the SBDB value is not used.
const REJECT = {
  "hygiea.diameterKm": "VLT/SPHERE 2019 mean diameter 434 km supersedes the IRAS 407 km",
  "interamnia.diameterKm": "VLT/SPHERE 2020 mean diameter 332 km supersedes the IRAS 306 km",
  "eunomia.diameterKm": "VLT/SPHERE 2019 mean diameter 268 km supersedes the IRAS 232 km",
  "davida.diameterKm": "VLT/SPHERE 2019 mean diameter 289 km supersedes the IRAS 270 km",
  "chiron.diameterKm": "stellar occultation gives about 218 km, SBDB still carries the older 166 km",
  "apophis.diameterKm": "Herschel 2013 measured 375 m, SBDB still carries the earlier 340 m",
  "halley.discoveredYear": "the dataset records 1705, the year Halley identified it as periodic",
  "eris.discoveredYear": "2005 is the year of recognition and announcement, 2003 is the precovery image",
  "haumea.discoveredYear": "2004 is the year of recognition, 2003 is the precovery image",
}

const dataset = JSON.parse(fs.readFileSync(DATASET, "utf8"))
const changes = []

for (const [id, sstr] of Object.entries(LOOKUP)) {
  const obj = dataset.find(o => o.id === id)
  if (!obj) { console.error("no such object: " + id); continue }
  const url = `https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=${encodeURIComponent(sstr)}&phys-par=1&discovery=1`
  const json = JSON.parse(await cachedFetch(url))

  const a = Number(json.orbit?.elements?.find(e => e.name === "a")?.value)
  if (Number.isFinite(a)) compare(obj, "distanceFromSunAU", a, "SBDB orbit element a")

  const phys = Object.fromEntries((json.phys_par ?? []).map(p => [p.name, Number(p.value)]))
  if (Number.isFinite(phys.diameter)) compare(obj, "diameterKm", phys.diameter, "SBDB phys_par diameter")
  if (Number.isFinite(phys.rot_per)) compare(obj, "rotationPeriodHours", phys.rot_per, "SBDB phys_par rot_per")

  const year = Number(String(json.discovery?.date ?? "").slice(0, 4))
  const yearRejection = REJECT[`${id}.discoveredYear`]
  if (yearRejection && obj.discoveredYear !== year) console.error(`skipping ${id}.discoveredYear: ${yearRejection}`)
  if (!yearRejection && Number.isFinite(year) && year > 1500 && obj.discoveredYear !== year) {
    changes.push({ id, field: "discoveredYear", from: obj.discoveredYear, to: year, reason: "SBDB discovery date", source: "JPL SBDB" })
  }
}

function compare(obj, field, value, reason) {
  const current = obj[field]
  if (typeof current !== "number") return
  const rel = Math.abs(value - current) / Math.max(Math.abs(value), 1e-9)
  if (rel <= (TOLERANCE[field] ?? 0.05)) return
  const rejection = REJECT[`${obj.id}.${field}`]
  if (rejection) { console.error(`skipping ${obj.id}.${field}: ${rejection}`); return }
  changes.push({ id: obj.id, field, from: current, to: Number(value.toPrecision(6)), reason, source: "JPL SBDB" })
}

// A comet's orbital period was derived from its semi-major axis by Kepler's third law, so correcting
// the axis without recomputing the period would leave the two contradicting each other.
for (const c of changes.filter(c => c.field === "distanceFromSunAU")) {
  const obj = dataset.find(o => o.id === c.id)
  if (typeof obj.orbitalPeriodDays !== "number") continue
  const period = Number((Math.pow(c.to, 1.5) * 365.25).toPrecision(6))
  changes.push({ id: c.id, field: "orbitalPeriodDays", from: obj.orbitalPeriodDays, to: period, reason: "Kepler's third law from the corrected semi-major axis", source: "derived" })
}

console.log(renderReport(changes))
if (process.argv.includes("--apply")) console.log("applied " + applyChanges(DATASET, changes))
