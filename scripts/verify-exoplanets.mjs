import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { cachedFetch } from "./lib/fetchCache.mjs"
import { renderReport, applyChanges } from "./lib/datasetDiff.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DATASET = path.join(ROOT, "src/data/celestialObjects.json")

const NAMES = {
  proxima_centauri_b: "Proxima Cen b", trappist_1e: "TRAPPIST-1 e", kepler_452b: "Kepler-452 b",
  "51_pegasi_b": "51 Peg b", hd_209458_b: "HD 209458 b", kepler_16b: "Kepler-16 b",
  wasp_12b: "WASP-12 b", "55_cancri_e": "55 Cnc e", kepler_186f: "Kepler-186 f",
  gj1214b: "GJ 1214 b", hr8799b: "HR 8799 b", gliese667cc: "GJ 667 C c", toi700d: "TOI-700 d",
  hd_189733_b: "HD 189733 b", kelt_9b: "KELT-9 b", k2_18b: "K2-18 b", lhs_1140b: "LHS 1140 b",
  wasp_121b: "WASP-121 b", kepler_442b: "Kepler-442 b", kepler_10b: "Kepler-10 b",
  wasp_76b: "WASP-76 b", gj_1132b: "GJ 1132 b",
}

const EARTH_RADIUS_KM = 6371
const EARTH_MASS_KG = 5.972e24
const LY_PER_PC = 3.2615638

const dataset = JSON.parse(fs.readFileSync(DATASET, "utf8"))
const changes = []
const quoted = Object.values(NAMES).map(n => `'${n.replace(/'/g, "''")}'`).join(",")
const adql = `select pl_name,pl_rade,pl_bmasse,pl_orbper,pl_eqt,sy_dist,disc_year from pscomppars where pl_name in (${quoted})`
const url = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?format=json&query=" + encodeURIComponent(adql)
const rows = JSON.parse(await cachedFetch(url))
const byName = new Map(rows.map(r => [r.pl_name, r]))

for (const [id, plName] of Object.entries(NAMES)) {
  const obj = dataset.find(o => o.id === id)
  const row = byName.get(plName)
  if (!obj || !row) { console.error("unmatched: " + id + " / " + plName); continue }
  compare(obj, "diameterKm", row.pl_rade * 2 * EARTH_RADIUS_KM, "pl_rade")
  compare(obj, "massKg", row.pl_bmasse * EARTH_MASS_KG, "pl_bmasse")
  compare(obj, "orbitalPeriodDays", row.pl_orbper, "pl_orbper")
  compare(obj, "temperatureK", row.pl_eqt, "pl_eqt")
  compare(obj, "distanceFromEarthLy", row.sy_dist * LY_PER_PC, "sy_dist")
  if (row.disc_year && obj.discoveredYear !== row.disc_year) {
    changes.push({ id, field: "discoveredYear", from: obj.discoveredYear, to: row.disc_year, reason: "disc_year", source: "NASA Exoplanet Archive" })
  }
}

function compare(obj, field, value, reason) {
  if (!Number.isFinite(value) || typeof obj[field] !== "number") return
  const rel = Math.abs(value - obj[field]) / Math.max(Math.abs(value), 1e-9)
  if (rel <= 0.05) return
  changes.push({ id: obj.id, field, from: obj[field], to: Number(value.toPrecision(6)), reason, source: "NASA Exoplanet Archive" })
}

console.log(renderReport(changes))
if (process.argv.includes("--apply")) console.log("applied " + applyChanges(DATASET, changes))
