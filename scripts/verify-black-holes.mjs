import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { cachedFetch } from "./lib/fetchCache.mjs"
import { renderReport, applyChanges } from "./lib/datasetDiff.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DATASET = path.join(ROOT, "src/data/celestialObjects.json")

// ---------------------------------------------------------------------------
// Cosmology: flat LCDM, H0 = 70 km/s/Mpc, Om = 0.3, Ode = 0.7. This is the
// standard reference cosmology quoted alongside a redshift, and it is what the
// KEY CHECK further down tests the dataset's distances against. There is no
// single "distance" in cosmology once you get past a few hundred million light
// years: comoving distance is how far an object is today, light-travel
// (lookback) distance is how far its light has travelled to reach us, and they
// diverge fast at high z. A dataset has to pick one and stay consistent.
// ---------------------------------------------------------------------------
export const H0_KM_S_MPC = 70
export const OMEGA_M = 0.3
export const OMEGA_DE = 0.7
const C_KM_S = 299792.458
const LY_PER_MPC = 3.2615637962e6
const LY_PER_KPC = LY_PER_MPC / 1000
const MSUN_KG = 1.989e30

// The Hubble distance c/H0, in millions of light years, sets the scale for
// every distance measure below.
export const HUBBLE_DISTANCE_MLY = (C_KM_S / H0_KM_S_MPC) * (LY_PER_MPC / 1e6)

function inverseE(z) {
  return 1 / Math.sqrt(OMEGA_M * (1 + z) ** 3 + OMEGA_DE)
}

// Simpson's rule. n is forced even; 200 slabs already lands several digits past
// where any tolerance below cares, so this stays cheap to call per object.
function simpson(f, a, b, n = 200) {
  if (n % 2 === 1) n += 1
  const h = (b - a) / n
  let total = f(a) + f(b)
  for (let i = 1; i < n; i++) total += (i % 2 === 0 ? 2 : 4) * f(a + i * h)
  return (total * h) / 3
}

// Comoving distance: the proper distance to the object today.
export function comovingDistanceMly(z) {
  if (!(z > 0)) return 0
  return HUBBLE_DISTANCE_MLY * simpson(inverseE, 0, z)
}

// Light-travel (lookback) distance: c times the lookback time. This is what
// popular and press-release astronomy usually means by "N billion light years
// away" for a high-redshift object, because it is the distance whose light left
// the object N billion years ago.
export function lightTravelDistanceMly(z) {
  if (!(z > 0)) return 0
  return HUBBLE_DISTANCE_MLY * simpson(zz => inverseE(zz) / (1 + zz), 0, z)
}

export function luminosityDistanceMly(z) {
  return (1 + z) * comovingDistanceMly(z)
}

// Coordinate helpers, used only to build the NED cone-search lookup below.
export function hmsToDeg(h, m, s) { return (h + m / 60 + s / 3600) * 15 }
export function dmsToDeg(sign, d, m, s) { return sign * (d + m / 60 + s / 3600) }

// ---------------------------------------------------------------------------
// J2000 positions for every object with a genuine cosmological redshift. These
// are looked up on NED by position rather than by name because NED's catalogued
// "prefname" strings do not match common object names closely enough to query
// by name reliably (M87 is filed under neither "M87" nor "MESSIER 087" alone),
// while every one of these positions is a well published catalogue position.
// Objects not listed here are galactic (redshift 0 by nature) and are checked
// against a directly measured literature distance instead, further down.
// ---------------------------------------------------------------------------
const COORDS = {
  m87_star: { ra: hmsToDeg(12, 30, 49.42), dec: dmsToDeg(1, 12, 23, 28.0) },
  ton_618: { ra: hmsToDeg(12, 28, 24.9), dec: dmsToDeg(1, 31, 28, 38) },
  oj_287: { ra: hmsToDeg(8, 54, 48.9), dec: dmsToDeg(1, 20, 6, 31) },
  ngc4889_black_hole: { ra: hmsToDeg(13, 0, 8.0), dec: dmsToDeg(1, 27, 58, 35) },
  phoenix_a: { ra: hmsToDeg(23, 44, 43.9), dec: dmsToDeg(-1, 42, 43, 12) },
  holmberg_15a_black_hole: { ra: hmsToDeg(0, 41, 50.46), dec: dmsToDeg(-1, 9, 18, 12) },
  hlx_1: { ra: hmsToDeg(1, 10, 28.31), dec: dmsToDeg(-1, 46, 4, 22) },
  "3c273": { ra: hmsToDeg(12, 29, 6.7), dec: dmsToDeg(1, 2, 3, 9) },
  "3c48": { ra: hmsToDeg(1, 37, 41.3), dec: dmsToDeg(1, 33, 9, 35) },
  ulas_j1120: { ra: hmsToDeg(11, 20, 1.48), dec: dmsToDeg(1, 6, 41, 24.3) },
  apm08279: { ra: hmsToDeg(8, 31, 41.7), dec: dmsToDeg(1, 52, 45, 17) },
  markarian_231: { ra: hmsToDeg(12, 56, 14.2), dec: dmsToDeg(1, 56, 52, 25) },
  "3c279": { ra: hmsToDeg(12, 56, 11.2), dec: dmsToDeg(-1, 5, 47, 22) },
  pds456: { ra: hmsToDeg(17, 28, 19.8), dec: dmsToDeg(-1, 14, 15, 56) },
  j0313_1806: { ra: hmsToDeg(3, 13, 43.84), dec: dmsToDeg(-1, 18, 6, 38.7) },
  pks2126_158: { ra: hmsToDeg(21, 29, 12.2), dec: dmsToDeg(-1, 15, 38, 41) },
}

// ---------------------------------------------------------------------------
// Literature reference values. There is no single queryable service for a
// black hole's mass the way SBDB serves orbital elements or the Exoplanet
// Archive serves planet parameters: masses here come from EHT imaging (Sgr A*,
// M87*), dynamical/parallax studies (the X-ray binaries, the Gaia binaries),
// stellar-dynamical modelling (the brightest cluster galaxies), and virial or
// orbital-fit estimates (the quasars, TON 618, OJ 287). Each entry cites the
// paper it comes from. Redshift is checked against NED itself, over the
// network, below; distance for the eight galactic objects is checked against
// each one's own distance paper; distance for the sixteen objects with a real
// cosmological redshift is checked against the LCDM cosmology above instead.
// ---------------------------------------------------------------------------
const LITERATURE = {
  sagittarius_a_star: {
    massKg: 4.297e6 * MSUN_KG, distanceFromEarthLy: 8.178 * LY_PER_KPC, discoveredYear: 1974,
    source: "GRAVITY Collaboration 2022 (mass, distance); Balick & Brown 1974 (radio discovery)",
  },
  m87_star: {
    massKg: 6.5e9 * MSUN_KG, apparentMagnitude: 9.59, discoveredYear: 2019,
    source: "Event Horizon Telescope Collaboration 2019 (mass, EHT image); RC3 B_T (apparent magnitude)",
  },
  cygnus_x1: {
    massKg: 21.2 * MSUN_KG, distanceFromEarthLy: 2.22 * LY_PER_KPC, apparentMagnitude: 8.9, discoveredYear: 1964,
    source: "Miller-Jones et al. 2021 (mass, distance)",
  },
  ton_618: {
    // The dataset's 6.6e10 Msun is the widely repeated figure, but it traces to a
    // popular restatement rather than a single settled paper. Shemmer et al. 2004's
    // CIV-based virial estimate, a genuine peer-reviewed alternative, is used here
    // so the disagreement surfaces rather than being silently absorbed by tolerance.
    massKg: 4.05e10 * MSUN_KG, apparentMagnitude: 15.9, discoveredYear: 1970,
    source: "Shemmer et al. 2004 (mass, contested, see REJECT)",
  },
  oj_287: {
    // Same shape of problem as TON 618: the primary's mass depends on which
    // relativistic precession model is fit to a century of flare timings.
    // Valtonen et al. 2010's ~1.8e10 Msun (which the dataset carries) and
    // Valtonen et al. 2008's ~1.34e10 Msun both appear in the literature.
    massKg: 1.34e10 * MSUN_KG, discoveredYear: 1891,
    source: "Valtonen et al. 2008 (mass, contested, see REJECT); Sillanpaa et al. 1988 (1891 plate)",
  },
  gro_j1655_40: {
    massKg: 6.3 * MSUN_KG, distanceFromEarthLy: 3.2 * LY_PER_KPC, apparentMagnitude: 14, discoveredYear: 1994,
    source: "Greene, Bailyn & Orosz 2001 (mass); Hjellming & Rupen 1995 (distance)",
  },
  v404_cygni: {
    massKg: 9.0 * MSUN_KG, distanceFromEarthLy: 2.39 * LY_PER_KPC, apparentMagnitude: 11.2, discoveredYear: 1989,
    source: "Khargharia, Froning & Robinson 2010 (mass); Miller-Jones et al. 2009 (distance)",
  },
  a0620_00: {
    massKg: 6.6 * MSUN_KG, distanceFromEarthLy: 1.06 * LY_PER_KPC, apparentMagnitude: 11.2, discoveredYear: 1975,
    source: "Cantrell et al. 2010 (mass, distance)",
  },
  grs1915: {
    // Reid et al. 2014's VLBA parallax replaced the older ~11 kpc kinematic
    // distance with 8.6 kpc, and revised the mass down from ~14 to ~12.4 Msun in
    // the same paper. The dataset's mass already matches the revised figure, so
    // its distance carrying the old ~36,000 ly is two different papers' numbers
    // stitched together rather than either paper on its own.
    massKg: 12.4 * MSUN_KG, distanceFromEarthLy: 8.6 * LY_PER_KPC, discoveredYear: 1992,
    source: "Reid et al. 2014 (parallax distance and revised mass)",
  },
  ngc4889_black_hole: {
    massKg: 2.1e10 * MSUN_KG, apparentMagnitude: 11.4, discoveredYear: 2011,
    source: "McConnell et al. 2011 (mass); NED/HyperLeda integrated V magnitude",
  },
  phoenix_a: {
    massKg: 2.0e10 * MSUN_KG, discoveredYear: 2012,
    source: "McDonald et al. 2019 (mass); McDonald et al. 2012 (cluster discovery)",
  },
  gaia_bh1: {
    massKg: 9.62 * MSUN_KG, distanceFromEarthLy: 0.48 * LY_PER_KPC, discoveredYear: 2023,
    source: "El-Badry et al. 2023",
  },
  gaia_bh3: {
    massKg: 32.70 * MSUN_KG, distanceFromEarthLy: 0.59 * LY_PER_KPC, discoveredYear: 2024,
    source: "Gaia Collaboration, Panuzzo et al. 2024",
  },
  holmberg_15a_black_hole: {
    massKg: 4.0e10 * MSUN_KG, discoveredYear: 2019,
    source: "Mehrgan et al. 2019",
  },
  hlx_1: {
    massKg: 2.0e4 * MSUN_KG, discoveredYear: 2009,
    source: "Davis et al. 2011 (mass); Farrell et al. 2009 (discovery)",
  },
  "3c273": {
    massKg: 8.86e8 * MSUN_KG, apparentMagnitude: 12.9, discoveredYear: 1963,
    source: "Peterson et al. 2004 reverberation mapping (mass); Schmidt 1963 (discovery)",
  },
  "3c48": {
    massKg: 1.0e9 * MSUN_KG, apparentMagnitude: 16.2, discoveredYear: 1960,
    source: "order-of-magnitude literature estimate (mass); 3C survey (discovery)",
  },
  ulas_j1120: {
    massKg: 2.0e9 * MSUN_KG, apparentMagnitude: 20.3, discoveredYear: 2011,
    source: "Mortlock et al. 2011",
  },
  apm08279: {
    massKg: 1.0e10 * MSUN_KG, apparentMagnitude: 15.2, discoveredYear: 1998,
    source: "lensing-corrected virial mass (mass); Irwin et al. 1998 (discovery)",
  },
  markarian_231: {
    massKg: 4.6e7 * MSUN_KG, apparentMagnitude: 13.8, discoveredYear: 1969,
    source: "virial mass estimate, Markarian survey (discovery)",
  },
  "3c279": {
    massKg: 5.0e8 * MSUN_KG, discoveredYear: 1965,
    source: "accretion-argument mass estimate; identified as extragalactic 1965",
  },
  pds456: {
    massKg: 1.0e9 * MSUN_KG, apparentMagnitude: 13.0, discoveredYear: 1987,
    source: "Eddington-ratio mass estimate; Pico dos Dias Survey (discovery)",
  },
  j0313_1806: {
    massKg: 1.6e9 * MSUN_KG, apparentMagnitude: 24.5, discoveredYear: 2021,
    source: "Wang et al. 2021",
  },
  pks2126_158: {
    massKg: 1.0e10 * MSUN_KG, apparentMagnitude: 17.0, discoveredYear: 1979,
    source: "Eddington-ratio mass estimate; Parkes catalogue (discovery)",
  },
}

// apparentMagnitude is deliberately absent above for OJ 287 and 3C 279: both are
// blazars whose optical brightness varies by several magnitudes on timescales of
// days to years, so there is no single "correct" apparent magnitude to check a
// stored figure against, only a range.

// Relative tolerances for fields compared as ratios, and absolute tolerances
// (in magnitudes, in years) for the two compared as differences. Black hole
// masses carry much larger measurement uncertainty than, say, an asteroid's
// orbital elements, so this is deliberately looser than verify-small-bodies.
const TOLERANCE = { massKg: 0.2, distanceFromEarthLy: 0.1, redshift: 0.03 }
const MAGNITUDE_TOLERANCE = 0.5

// Values deliberately kept against a literature figure that disagrees, and why.
const REJECT = {
  "ton_618.massKg": "TON 618's mass has no consensus value; virial CIV estimates range from Shemmer 2004's 4.05e10 Msun to the widely repeated 6.6e10 Msun the dataset carries, and neither supersedes the other",
  "oj_287.massKg": "OJ 287's primary mass depends on which relativistic precession model is fit to the flare timings; Valtonen 2010's ~1.8e10 Msun (kept) and Valtonen 2008's ~1.34e10 Msun both appear in the literature with no settled preference",
  "gaia_bh1.discoveredYear": "the discovery paper (El-Badry et al.) was posted to arXiv in November 2022 and is widely dated to 2022 in press coverage, though MNRAS did not publish it until 2023",
}

const dataset = JSON.parse(fs.readFileSync(DATASET, "utf8"))
const changes = []

const objects = dataset.filter(o => o.category === "black_hole" || o.category === "quasar")

function compareRelative(obj, field, value, reason, source) {
  const current = obj[field]
  if (typeof current !== "number" || !Number.isFinite(value)) return
  const rel = Math.abs(value - current) / Math.max(Math.abs(value), 1e-9)
  if (rel <= (TOLERANCE[field] ?? 0.1)) return
  const rejection = REJECT[`${obj.id}.${field}`]
  if (rejection) { console.error(`skipping ${obj.id}.${field}: ${rejection}`); return }
  changes.push({ id: obj.id, field, from: current, to: Number(value.toPrecision(6)), reason, source })
}

function compareAbsolute(obj, field, value, tolerance, reason, source) {
  const current = obj[field]
  if (typeof current !== "number" || !Number.isFinite(value)) return
  if (Math.abs(value - current) <= tolerance) return
  const rejection = REJECT[`${obj.id}.${field}`]
  if (rejection) { console.error(`skipping ${obj.id}.${field}: ${rejection}`); return }
  changes.push({ id: obj.id, field, from: current, to: value, reason, source })
}

// ---- literature comparison: mass, apparent magnitude, discovery year, and the
// distance of the eight galactic objects (whose redshift is 0 by nature and
// whose distance is therefore checked against a direct measurement instead of
// the cosmology below). ----
for (const obj of objects) {
  const ref = LITERATURE[obj.id]
  if (!ref) { console.error("no literature reference for " + obj.id); continue }
  if (typeof ref.massKg === "number") compareRelative(obj, "massKg", ref.massKg, "published mass", ref.source)
  if (typeof ref.apparentMagnitude === "number") {
    compareAbsolute(obj, "apparentMagnitude", ref.apparentMagnitude, MAGNITUDE_TOLERANCE, "published apparent magnitude", ref.source)
  }
  if (typeof ref.discoveredYear === "number" && obj.discoveredYear !== ref.discoveredYear) {
    const rejection = REJECT[`${obj.id}.discoveredYear`]
    if (rejection) console.error(`skipping ${obj.id}.discoveredYear: ${rejection}`)
    else changes.push({ id: obj.id, field: "discoveredYear", from: obj.discoveredYear, to: ref.discoveredYear, reason: "published discovery year", source: ref.source })
  }
  // A galactic object (no COORDS entry) has its distance checked against the
  // literature figure directly; an extragalactic one is checked against the
  // cosmology derived from its own redshift, in the next section.
  if (!COORDS[obj.id] && typeof ref.distanceFromEarthLy === "number") {
    compareRelative(obj, "distanceFromEarthLy", ref.distanceFromEarthLy, "published distance", ref.source)
  }
}

// ---------------------------------------------------------------------------
// KEY CHECK: for every object with a genuine cosmological redshift, does the
// stated distanceFromEarthLy match what LCDM (H0=70, Om=0.3) predicts from the
// stated redshift, and which distance convention is it using?
// ---------------------------------------------------------------------------
const COSMOLOGY_TOLERANCE = 0.08
const cosmologyRows = []
for (const obj of objects) {
  if (!COORDS[obj.id]) continue
  if (typeof obj.redshift !== "number" || typeof obj.distanceFromEarthLy !== "number") continue
  const statedMly = obj.distanceFromEarthLy / 1e6
  const lt = lightTravelDistanceMly(obj.redshift)
  const cm = comovingDistanceMly(obj.redshift)
  const relToLightTravel = Math.abs(statedMly - lt) / lt
  const relToComoving = Math.abs(statedMly - cm) / cm
  cosmologyRows.push({ id: obj.id, z: obj.redshift, statedMly, lt, cm, relToLightTravel, relToComoving })
}

const usesLightTravel = cosmologyRows.filter(r => r.relToLightTravel < r.relToComoving).length
console.log(
  `cosmology check (LCDM H0=${H0_KM_S_MPC}, Om=${OMEGA_M}): ${usesLightTravel}/${cosmologyRows.length} objects sit closer to ` +
  "the LIGHT-TRAVEL (lookback) distance than the comoving distance for their stated redshift"
)
for (const r of cosmologyRows) {
  console.log(
    `  ${r.id}: z=${r.z}, stated ${r.statedMly.toFixed(1)} Mly, light-travel predicts ${r.lt.toFixed(1)} Mly ` +
    `(${(r.relToLightTravel * 100).toFixed(1)}% off), comoving predicts ${r.cm.toFixed(1)} Mly (${(r.relToComoving * 100).toFixed(1)}% off)`
  )
  // Below z~0.01 (recession velocity ~3000 km/s), a galaxy's peculiar velocity within its
  // cluster is often comparable to its Hubble-flow velocity, so redshift is not a reliable
  // distance proxy. M87 (z=0.00436) sits deep inside the Virgo Cluster infall and its distance
  // is measured directly (Cepheids/SBF), not derived from z; do not override such objects.
  const MIN_COSMOLOGICAL_REDSHIFT = 0.01
  if (r.z < MIN_COSMOLOGICAL_REDSHIFT) {
    console.log(`  skipping ${r.id}.distanceFromEarthLy: z=${r.z} is too low for redshift to be a reliable distance proxy (peculiar velocity dominated)`)
  } else if (r.relToLightTravel > COSMOLOGY_TOLERANCE) {
    const to = Number((lightTravelDistanceMly(r.z) * 1e6).toPrecision(6))
    changes.push({
      id: r.id, field: "distanceFromEarthLy", from: r.statedMly * 1e6, to,
      reason: `LCDM light-travel distance from the stated redshift (z=${r.z})`,
      source: "derived, H0=70 Om=0.3 Ode=0.7",
    })
  }
}

// ---------------------------------------------------------------------------
// Network check: cross-reference the stated redshift against NED, by position.
// NED's catalogued name strings do not line up with common object names closely
// enough to query by name (M87 resolves to neither "M87" nor "MESSIER 087"
// alone), so this queries by J2000 position instead and takes the nearest
// match that carries a redshift.
// ---------------------------------------------------------------------------
async function fetchWithTimeout(url) {
  return fetch(url, { signal: AbortSignal.timeout(10000) })
}

// Absorption-line systems (type "AbLS") sit at the same position as the quasar that
// backlights them but carry the redshift of intervening foreground gas, not the quasar
// itself. Every object verified here is the emitting source, so AbLS matches are excluded
// even when they are nominally closer than the quasar/AGN entry.
const NED_EXCLUDED_TYPES = new Set(["AbLS"])

async function nedRedshiftNear(ra, dec, radiusDeg = 0.03) {
  const q = `SELECT TOP 20 prefname, ra, dec, z, prefphytype FROM NEDTAP.objdir WHERE ` +
    `CONTAINS(POINT('J2000', ra, dec), CIRCLE('J2000', ${ra}, ${dec}, ${radiusDeg})) = 1 AND z IS NOT NULL`
  const url = "https://ned.ipac.caltech.edu/tap/sync?request=doQuery&lang=adql&format=json&query=" + encodeURIComponent(q)
  const body = await cachedFetch(url, { retries: 2, baseDelayMs: 1500, fetchImpl: fetchWithTimeout })
  const json = JSON.parse(body)
  const cosDec = Math.cos((dec * Math.PI) / 180)
  let best = null
  for (const [prefname, rowRa, rowDec, z, prefphytype] of json.data ?? []) {
    if (NED_EXCLUDED_TYPES.has(prefphytype)) continue
    const sep = Math.hypot((rowRa - ra) * cosDec, rowDec - dec)
    if (!best || sep < best.sep) best = { prefname, z, sep }
  }
  return best
}

for (const obj of objects) {
  const coords = COORDS[obj.id]
  if (!coords || typeof obj.redshift !== "number") continue
  try {
    const match = await nedRedshiftNear(coords.ra, coords.dec)
    if (!match) { console.error(`NED: no redshift-bearing object near ${obj.id}`); continue }
    compareAbsolute(
      obj, "redshift", match.z, TOLERANCE.redshift,
      `NED redshift near ${match.prefname} (${(match.sep * 3600).toFixed(1)}″ away)`,
      "NED",
    )
  } catch (err) {
    console.error(`NED: skipping ${obj.id}, ${err.message}`)
  }
}

console.log("")
console.log(renderReport(changes))
if (process.argv.includes("--apply")) console.log("applied " + applyChanges(DATASET, changes))
