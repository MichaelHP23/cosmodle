import fs from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { cachedFetch } from "./lib/fetchCache.mjs"
import { proposeChange, renderReport, applyChanges } from "./lib/datasetDiff.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DATASET = path.join(ROOT, "src/data/celestialObjects.json")

// The IAU publishes constellation areas as a table rather than through a service, and this article
// carries that table with the IAU page cited as its source. There is no TAP endpoint for any of it.
const SOURCE_PAGE = "IAU_designated_constellations"
const SOURCE_URL =
  "https://en.wikipedia.org/w/api.php?action=parse&format=json&formatversion=2&prop=wikitext&page=" + SOURCE_PAGE

const SOURCE = "IAU designated constellations table"

// Areas are whole square degrees and magnitudes are quoted to a hundredth, so anything past rounding
// is a real disagreement rather than a difference of precision.
const MAGNITUDE_TOLERANCE = 0.005

const REJECT = {
  // Antares is a semiregular variable that ranges roughly 0.6 to 1.6. The dataset carries the SIMBAD
  // V magnitude, and the table quotes a brighter epoch; neither is wrong, so the dataset keeps its
  // own figure rather than flipping between epochs each time this runs.
  "scorpius.brightestStarMagnitude": "Antares is variable; 1.06 is the SIMBAD V magnitude",
}

// The twelve the IAU treats as the zodiac. Ophiuchus is crossed by the ecliptic but is not one.
const ZODIAC = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpius", "sagittarius", "capricornus", "aquarius", "pisces",
]

// Three constellations are stored under a disambiguated name ("Andromeda (constellation)"), so the
// suffix comes off before either side is matched.
export function normalizeName(name) {
  return name.toLowerCase().replace(/\s*\(constellation\)\s*$/, "").trim()
}

function clean(cell) {
  let out = cell.replace(/<ref[^>]*\/>/g, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "")
  // Links keep their display half, then templates come off from the inside out. A single pass would
  // leave the outer half of a nest like {{nowrap|{{IPAc-en|...}}}} behind as visible text.
  out = out.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2").replace(/\[\[([^\]]+)\]\]/g, "$1")
  let previous
  do {
    previous = out
    out = out.replace(/\{\{[^{}]*\}\}/g, "")
  } while (out !== previous)
  return out
    .replace(/<[^>]+>/g, "")
    .replace(/''+/g, "")
    .replace(/data-sort-value="[^"]*"\s*\|/g, "")
    // Magnitudes are written with U+2212 MINUS SIGN, which Number() will not parse.
    .replace(/−/g, "-")
    .trim()
}

// The columns of interest sit at the end of each row (brightest star, its magnitude, then area), and
// the leading columns vary in how they are laid out, so they are read from the right.
export function parseConstellationTable(wikitext, expectedRows = 88) {
  const start = wikitext.indexOf("Area (sq. deg.)")
  if (start === -1) throw new Error("verify-constellations: the area column is gone from the source table")
  const end = wikitext.indexOf("\n|}", start)
  if (end === -1) throw new Error("verify-constellations: the source table is unterminated")

  const rows = []
  for (const row of wikitext.slice(start, end).split("\n|-").slice(1)) {
    const cells = row
      .split("\n")
      .flatMap(line => (line.startsWith("|") ? line.slice(1).split("||") : []))
      .map(clean)
    if (cells.length < 8) continue
    const area = Number(cells.at(-1).replace(/,/g, ""))
    const magnitude = Number(cells.at(-2))
    if (!Number.isInteger(area) || !Number.isFinite(magnitude)) {
      throw new Error(`verify-constellations: unreadable row for ${cells[0] || "?"}: area ${cells.at(-1)}, magnitude ${cells.at(-2)}`)
    }
    rows.push({ name: cells[0], brightestStar: cells.at(-3), magnitude, area })
  }

  // Every row has to parse. A table that yields 80 rows means the format moved, and silently
  // verifying the 80 that still work would report a clean run over a dataset nobody checked.
  if (rows.length !== expectedRows) {
    throw new Error(`verify-constellations: parsed ${rows.length} rows, expected ${expectedRows}`)
  }
  return rows
}

export function collectChanges(dataset, rows) {
  const changes = []
  const constellations = dataset.filter(o => o.category === "constellation")
  const byName = new Map(constellations.map(c => [normalizeName(c.name), c]))
  const byId = new Map(dataset.map(o => [o.id, o]))

  const compare = (obj, field, value, reason) => {
    const current = obj[field]
    if (typeof current !== "number") return
    const tolerance = field === "areaSqDeg" ? 0 : MAGNITUDE_TOLERANCE
    if (Math.abs(value - current) <= tolerance) return
    const rejection = REJECT[`${obj.id}.${field}`]
    if (rejection) {
      console.error(`skipping ${obj.id}.${field}: ${rejection}`)
      return
    }
    proposeChange(changes, { id: obj.id, field, from: current, to: value, reason, source: SOURCE })
  }

  for (const row of rows) {
    const obj = byName.get(normalizeName(row.name))
    if (!obj) {
      console.error(`no constellation in the dataset for ${row.name}`)
      continue
    }
    compare(obj, "areaSqDeg", row.area, "IAU area")
    compare(obj, "brightestStarMagnitude", row.magnitude, `visual magnitude of ${row.brightestStar}`)
  }

  for (const c of constellations) {
    if (c.brightestStarId && !byId.has(c.brightestStarId)) {
      console.error(`${c.id}.brightestStarId points at "${c.brightestStarId}", which is not in the dataset`)
    }
    const shouldBeZodiac = ZODIAC.includes(normalizeName(c.name))
    if (Boolean(c.isZodiac) !== shouldBeZodiac) {
      proposeChange(changes, {
        id: c.id,
        field: "isZodiac",
        from: c.isZodiac,
        to: shouldBeZodiac,
        reason: "the IAU zodiac is twelve constellations",
        source: "IAU",
      })
    }
  }

  // discoveredYear is deliberately not checked. The source's origin column dates a constellation to
  // the year its author published, and the dataset dates several to the year they were drawn or
  // first shown on a globe: Hevelius' constellations are 1687 here and 1690 there, the Keyser and de
  // Houtman ones 1597 against 1598. Both are cited in the literature, so a check would do nothing
  // but propose the same two dozen edits every run.

  return changes
}

async function main() {
  const dataset = JSON.parse(fs.readFileSync(DATASET, "utf8"))
  const response = JSON.parse(await cachedFetch(SOURCE_URL))
  const wikitext = response?.parse?.wikitext
  if (typeof wikitext !== "string") throw new Error("verify-constellations: no wikitext in the API response")

  const changes = collectChanges(dataset, parseConstellationTable(wikitext))
  console.log(renderReport(changes))
  if (process.argv.includes("--apply")) console.log("applied " + applyChanges(DATASET, changes))
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main()
