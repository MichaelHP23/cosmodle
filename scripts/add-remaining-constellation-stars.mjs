// One-off script: link the constellations left unlinked by add-constellation-brightest-stars.mjs,
// adding each one's brightest star as a real object.
// Run: node scripts/add-remaining-constellation-stars.mjs
//
// The earlier batch stopped at the stars whose published mass and radius I could source
// confidently. These are the rest, each looked up against its Wikipedia infobox and cross-checked
// against a second source. A star object has to carry both mass and diameter (STAR_PROFILE
// requires them), so a star whose sources do not give both is still left out.
//
// Radii and masses are in solar units, which is how they are published; the script converts.
// It refuses to write if a star's magnitude disagrees with the constellation's own recorded
// brightestStarMagnitude by more than 0.35, which catches a star paired to the wrong constellation.
import { readFileSync, writeFileSync } from "fs"

const DATA_PATH = new URL("../src/data/celestialObjects.json", import.meta.url)
const MAG_TOLERANCE = 0.35
const SOLAR_DIAMETER_KM = 1392680
const SOLAR_MASS_KG = 1.989e30

// constellation, id, name, apparent magnitude (V), distance (ly), effective temperature (K),
// radius (R_sun), mass (M_sun), description.
//
// Where the brightest star is a close binary the naked-eye magnitude is the combined system value,
// which is what the constellation records, while the mass, radius and temperature belong to the
// primary component. That is noted per star below.
const STARS = [
  ["antlia", "alpha_antliae", "Alpha Antliae", 4.25, 366, 4070, 41, 2.2, "An orange giant and the brightest star in Antlia, suspected of varying slowly as it nears the end of its life."],
  ["apus", "alpha_apodis", "Paradys", 3.83, 498, 4090, 59.51, 4.46, "An orange giant and the brightest star in Apus, some sixty times the radius of the Sun."],
  // Two faint visual companions, unbound line-of-sight stars; the figures are the supergiant's own.
  ["camelopardalis", "beta_camelopardalis", "Beta Camelopardalis", 4.03, 840, 5300, 58, 6.5, "A yellow supergiant and the brightest star in Camelopardalis, a large but famously dim northern constellation."],
  ["corona_australis", "alpha_coronae_australis", "Meridiana", 4.09, 125, 9916, 2.21, 2.57, "A white main-sequence star and the only named star in Corona Australis."],
  // Close spectroscopic binary: magnitude 3.27 is the combined system, mass/radius/temperature are
  // component A, the B-type giant primary (3.5 +/- 0.3 R_sun, 3.33 +/- 0.10 M_sun).
  ["dorado", "alpha_doradus", "Alpha Doradus", 3.27, 169, 11588, 3.5, 3.33, "A blue-white binary and the brightest star in Dorado, whose primary is a giant three and a half times the radius of the Sun."],
  ["horologium", "alpha_horologii", "Alpha Horologii", 3.85, 117.6, 4695, 9.931, 1.409, "An orange giant and the brightest star in Horologium, swollen to nearly ten times the diameter of the Sun."],
  ["microscopium", "gamma_microscopii", "Gamma Microscopii", 4.68, 223, 5227, 9.49, 2.8, "A yellow giant and the brightest star in Microscopium, long since evolved off the main sequence."],
  ["norma", "gamma2_normae", "Gamma2 Normae", 4.02, 138.4, 4763, 10.35, 2.06, "An orange giant and the brightest star in Norma, a helium-fusing red clump star about ten times the radius of the Sun."],
  // Astrometric binary, unresolved to the eye: magnitude is the combined system, the rest is component A.
  ["pictor", "alpha_pictoris", "Alpha Pictoris", 3.27, 97, 7451, 3.55, 1.6, "A fast-spinning white star and the brightest in Pictor, orbited by a companion every three and a half years."],
  // Double-lined spectroscopic binary, unresolved to the eye: magnitude 3.00 is the combined system,
  // mass/radius/temperature are component A (component B is 8759 K, 2.44 R_sun, 1.37 M_sun).
  ["triangulum_constellation", "beta_trianguli", "Alaybasan", 3.0, 141, 7683, 4.38, 3.52, "A white giant and the brightest star in Triangulum, locked in a 31-day orbit with a smaller companion."],
  // Wide visual binary, resolvable at 14 arcsec: the constellation's recorded 3.61 is the combined pair,
  // while this record is Gamma2 Volantis itself, the brighter component, at its own magnitude of 3.78.
  ["volans", "gamma2_volantis", "Gamma2 Volantis", 3.78, 133.2, 4892, 10.2, 2.15, "An orange giant and the brighter half of the wide double star that marks Volans."],
  ["vulpecula", "alpha_vulpeculae", "Anser", 4.4, 291, 3967, 41.48, 0.97, "A red giant and the brightest star in Vulpecula, forming a chance line-of-sight pair with the unrelated 8 Vulpeculae."],
]

// Matches the palette the existing stars use, so a new star is not visibly a different species.
function colorForTemperature(k) {
  if (k >= 20000) return "#aabfff"
  if (k >= 10000) return "#cad7ff"
  if (k >= 7500) return "#f4f6ff"
  if (k >= 6000) return "#fff8f0"
  if (k >= 5000) return "#fff2d0"
  if (k >= 4000) return "#ffd2a1"
  return "#ffb680"
}

const dataset = JSON.parse(readFileSync(DATA_PATH, "utf-8"))
const byId = new Map(dataset.map(o => [o.id, o]))
const problems = []

for (const [constellationId, id, , mag] of STARS) {
  const constellation = byId.get(constellationId)
  if (!constellation) problems.push(`${id}: no constellation "${constellationId}" in the dataset`)
  else if (constellation.category !== "constellation") problems.push(`${id}: "${constellationId}" is not a constellation`)
  else if (constellation.brightestStarId) problems.push(`${id}: ${constellationId} is already linked to ${constellation.brightestStarId}`)
  else if (Math.abs(constellation.brightestStarMagnitude - mag) > MAG_TOLERANCE) {
    problems.push(`${id}: magnitude ${mag} does not match ${constellationId}'s recorded brightest star magnitude ${constellation.brightestStarMagnitude}`)
  }
  if (byId.has(id)) problems.push(`${id}: id already exists in the dataset`)
}

if (problems.length) {
  console.error("Refusing to write:\n" + problems.map(p => "  " + p).join("\n"))
  process.exit(1)
}

for (const [constellationId, id, name, mag, ly, tempK, radiusSolar, massSolar, description] of STARS) {
  const constellation = byId.get(constellationId)
  constellation.brightestStarId = id
  dataset.push({
    id,
    name,
    category: "star",
    hemisphere: constellation.hemisphere,
    apparentMagnitude: mag,
    redshift: 0,
    color: colorForTemperature(tempK),
    distanceFromEarthLy: ly,
    diameterKm: Number((radiusSolar * SOLAR_DIAMETER_KM).toPrecision(6)),
    massKg: Number((massSolar * SOLAR_MASS_KG).toPrecision(4)),
    temperatureK: tempK,
    difficulty: 5,
    description,
    discoveredYear: -3000, // visible to the naked eye, so known to antiquity rather than discovered
  })
}

writeFileSync(DATA_PATH, JSON.stringify(dataset, null, 2) + "\n")

const constellations = dataset.filter(o => o.category === "constellation")
const linked = constellations.filter(o => o.brightestStarId).length
const unlinked = constellations.filter(o => !o.brightestStarId).map(o => o.name)
console.log(`Added ${STARS.length} stars. Dataset is now ${dataset.length} objects.`)
console.log(`Constellations linked to a brightest star: ${linked}/${constellations.length}.`)
if (unlinked.length) console.log(`Still unlinked: ${unlinked.join(", ")}`)
