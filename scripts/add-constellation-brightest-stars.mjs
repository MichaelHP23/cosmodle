// One-off script: add the brightest star of 34 more constellations as real objects, and link
// each constellation to it. Run: node scripts/add-constellation-brightest-stars.mjs
//
// A constellation is a patch of sky, so it reports distance, mass, size and temperature by
// standing in its brightest star (see getComparableValue). That only works for constellations
// whose brightest star is in the dataset. Every star below carries its published distance,
// magnitude, effective temperature, mass and radius.
//
// Radii and masses are in solar units, which is how they are published; the script converts.
// The script refuses to write if a star's magnitude disagrees with the constellation's own
// recorded brightestStarMagnitude by more than 0.35, which is the check that catches a star
// paired to the wrong constellation.
import { readFileSync, writeFileSync } from "fs"

const DATA_PATH = new URL("../src/data/celestialObjects.json", import.meta.url)
const MAG_TOLERANCE = 0.35
const SOLAR_DIAMETER_KM = 1392680
const SOLAR_MASS_KG = 1.989e30

// constellation, id, name, apparent magnitude (V), distance (ly), effective temperature (K),
// radius (R_sun), mass (M_sun), description.
const STARS = [
  ["aquarius", "sadalsuud", "Sadalsuud", 2.87, 540, 5608, 47.88, 6.4, "A yellow supergiant and the brightest star in Aquarius, whose name means luckiest of the lucky."],
  ["ara", "beta_arae", "Beta Arae", 2.85, 650, 4197, 142, 8.21, "An orange supergiant and the brightest star in Ara, over a hundred times the radius of the Sun."],
  ["caelum", "alpha_caeli", "Alpha Caeli", 4.45, 65.7, 6991, 1.3, 1.48, "A white main-sequence star with a red dwarf companion, and the brightest star in the faint constellation Caelum."],
  ["cancer", "tarf", "Tarf", 3.53, 290, 4092, 47.2, 1.7, "An orange giant and the brightest star in Cancer, orbited by a confirmed giant planet."],
  ["canes_venatici", "cor_caroli", "Cor Caroli", 2.89, 115, 11600, 2.49, 2.97, "The brightest star in Canes Venatici, a chemically peculiar star with one of the strongest magnetic fields known among main-sequence stars."],
  ["capricornus", "deneb_algedi", "Deneb Algedi", 2.81, 38.7, 7301, 1.91, 2.0, "An eclipsing binary and the brightest star in Capricornus, whose name means the tail of the goat."],
  ["chamaeleon", "alpha_chamaeleontis", "Alpha Chamaeleontis", 4.06, 63.5, 6580, 2.11, 1.42, "A white subgiant and the brightest star in the small southern constellation Chamaeleon."],
  ["circinus", "alpha_circini", "Alpha Circini", 3.19, 54, 7500, 1.97, 1.7, "The brightest star in Circinus and the brightest of the rapidly oscillating Ap stars, pulsating every seven minutes."],
  ["columba", "phact", "Phact", 2.65, 261, 12963, 5.8, 4.5, "A blue-white star and the brightest in Columba, spinning fast enough to throw off a disc of gas."],
  ["coma_berenices", "beta_comae_berenices", "Beta Comae Berenices", 4.26, 29.9, 5936, 1.106, 1.15, "A close solar analogue and the brightest star in Coma Berenices, slightly larger and hotter than the Sun."],
  ["corvus", "gienah", "Gienah", 2.59, 154, 12000, 4.0, 4.2, "A blue-white giant and the brightest star in Corvus, marking the wing of the crow."],
  ["crater", "delta_crateris", "Delta Crateris", 3.56, 195, 4408, 22.44, 1.56, "An orange giant and the brightest star in Crater, despite carrying a delta rather than an alpha designation."],
  ["equuleus", "kitalpha", "Kitalpha", 3.92, 190, 5100, 9.2, 2.3, "The brightest star in Equuleus, the second-smallest constellation, and a spectroscopic binary of a yellow giant and a white companion."],
  ["fornax", "dalim", "Dalim", 3.85, 46, 6240, 1.9, 1.33, "A yellow-white subgiant with a white dwarf companion, and the brightest star in Fornax."],
  ["hercules", "kornephoros", "Kornephoros", 2.78, 139, 4887, 17, 2.9, "A yellow giant and the brightest star in Hercules, its name meaning club-bearer."],
  ["hydrus", "beta_hydri", "Beta Hydri", 2.8, 24.33, 5872, 1.809, 1.08, "The brightest star in Hydrus and one of the closest bright stars to the Sun, an older and more evolved version of it."],
  ["indus", "alpha_indi", "Alpha Indi", 3.11, 98, 4893, 12, 2.0, "An orange giant and the brightest star in Indus, sometimes called the Persian."],
  ["lacerta", "alpha_lacertae", "Alpha Lacertae", 3.77, 102.6, 9050, 2.14, 2.19, "A white main-sequence star and the brightest in Lacerta, a faint zigzag of stars between Cygnus and Andromeda."],
  ["leo_minor", "praecipua", "Praecipua", 3.83, 98, 4670, 8.22, 1.69, "An orange giant and the brightest star in Leo Minor, whose name means the chief one."],
  ["lepus", "arneb", "Arneb", 2.58, 2200, 6850, 129, 13.9, "A yellow-white supergiant and the brightest star in Lepus, nearing the end of its life and likely to end as a supernova."],
  ["libra", "zubeneschamali", "Zubeneschamali", 2.61, 185, 12300, 4.9, 3.5, "The brightest star in Libra, once the northern claw of the scorpion, and often reported as looking faintly green."],
  ["lynx", "alpha_lyncis", "Alpha Lyncis", 3.14, 203, 3882, 54.5, 2.0, "A red giant and the brightest star in Lynx, a constellation said to need the eyes of a lynx to see."],
  ["mensa", "alpha_mensae", "Alpha Mensae", 5.09, 33.1, 5569, 0.96, 0.96, "A near twin of the Sun and the brightest star in Mensa, the faintest of all 88 constellations."],
  ["musca", "alpha_muscae", "Alpha Muscae", 2.69, 315, 21400, 4.8, 8.8, "A hot blue-white star and the brightest in Musca, pulsating slightly as a Beta Cephei variable."],
  ["octans", "nu_octantis", "Nu Octantis", 3.73, 63.3, 4860, 5.9, 1.6, "An orange giant and the brightest star in Octans, the constellation containing the south celestial pole."],
  ["pisces", "alpherg", "Alpherg", 3.62, 350, 4930, 26, 3.78, "A yellow giant and the brightest star in Pisces, a zodiac constellation with no star brighter than third magnitude."],
  ["pyxis", "alpha_pyxidis", "Alpha Pyxidis", 3.67, 880, 24300, 6.3, 10.7, "A hot blue giant and the brightest star in Pyxis, tens of thousands of times more luminous than the Sun."],
  ["reticulum", "alpha_reticuli", "Alpha Reticuli", 3.33, 163, 5196, 12.8, 3.11, "A yellow giant and the brightest star in Reticulum, a small southern constellation named for a telescope eyepiece grid."],
  ["sculptor", "alpha_sculptoris", "Alpha Sculptoris", 4.3, 780, 13600, 7.52, 5.01, "A blue-white giant and the brightest star in Sculptor, the constellation containing the south galactic pole."],
  ["scutum", "alpha_scuti", "Alpha Scuti", 3.85, 199, 4315, 20, 1.33, "An orange giant and the brightest star in Scutum, a small constellation set against a dense Milky Way star cloud."],
  ["serpens", "unukalhai", "Unukalhai", 2.63, 74, 4498, 12, 1.66, "An orange giant and the brightest star in Serpens, the only constellation split into two separate halves."],
  ["sextans", "alpha_sextantis", "Alpha Sextantis", 4.49, 280, 9984, 3.0, 2.57, "A white giant and the brightest star in Sextans, sitting almost exactly on the celestial equator."],
  ["telescopium", "alpha_telescopii", "Alpha Telescopii", 3.51, 278, 16700, 3.3, 5.2, "A blue-white subgiant and the brightest star in Telescopium."],
  ["tucana", "alpha_tucanae", "Alpha Tucanae", 2.86, 199, 4300, 37, 2.5, "An orange giant binary and the brightest star in Tucana, the constellation that hosts the Small Magellanic Cloud."],
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
console.log(`Added ${STARS.length} stars. Dataset is now ${dataset.length} objects.`)
console.log(`Constellations linked to a brightest star: ${linked}/${constellations.length}.`)
