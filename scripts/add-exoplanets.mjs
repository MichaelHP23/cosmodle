import { readFileSync, writeFileSync } from "fs"

const DATA_PATH = new URL("../src/data/celestialObjects.json", import.meta.url)
const dataset = JSON.parse(readFileSync(DATA_PATH, "utf-8"))

const NEW_OBJECTS = [
  { id: "proxima_centauri_b", name: "Proxima Centauri b", category: "exoplanet", color: "#7a9e7e", parentBodyId: "Proxima Centauri", distanceFromEarthLy: 4.24, diameterKm: 13600, massKg: 6.39e24, temperatureK: 234, orbitalPeriodDays: 11.19, discoveredYear: 2016, difficulty: 3, description: "The closest known exoplanet to Earth, orbiting within the habitable zone of the nearest star to the Sun." },
  { id: "trappist_1e", name: "TRAPPIST-1e", category: "exoplanet", color: "#7a9e7e", parentBodyId: "TRAPPIST-1", distanceFromEarthLy: 40.7, diameterKm: 11700, massKg: 4.6e24, temperatureK: 250, orbitalPeriodDays: 6.10, discoveredYear: 2017, difficulty: 4, description: "Considered the most Earth-like of the seven rocky planets in the TRAPPIST-1 system, likely capable of retaining liquid water." },
  { id: "kepler_452b", name: "Kepler-452b", category: "exoplanet", color: "#7a9e7e", parentBodyId: "Kepler-452", distanceFromEarthLy: 1800, diameterKm: 20000, massKg: 2.99e25, temperatureK: 265, orbitalPeriodDays: 384.8, discoveredYear: 2015, difficulty: 4, description: "Nicknamed 'Earth's cousin,' orbiting a Sun-like star at a similar distance and period as Earth around the Sun." },
  { id: "51_pegasi_b", name: "51 Pegasi b", category: "exoplanet", color: "#7a9e7e", parentBodyId: "51 Pegasi", distanceFromEarthLy: 50.9, diameterKm: 265000, massKg: 8.73e26, temperatureK: 1284, orbitalPeriodDays: 4.23, discoveredYear: 1995, difficulty: 3, description: "The first exoplanet discovered orbiting a Sun-like star, a 'hot Jupiter' whose discovery launched modern exoplanet science." },
  { id: "hd_209458_b", name: "HD 209458 b", category: "exoplanet", color: "#7a9e7e", parentBodyId: "HD 209458", distanceFromEarthLy: 159, diameterKm: 193000, massKg: 1.31e27, temperatureK: 1130, orbitalPeriodDays: 3.52, discoveredYear: 1999, difficulty: 5, description: "Nicknamed 'Osiris,' the first exoplanet observed transiting its star and the first found to have an atmosphere." },
  { id: "kepler_16b", name: "Kepler-16b", category: "exoplanet", color: "#7a9e7e", parentBodyId: "Kepler-16", distanceFromEarthLy: 245, diameterKm: 104600, massKg: 6.26e26, temperatureK: 170, orbitalPeriodDays: 228.8, discoveredYear: 2011, difficulty: 5, description: "A 'circumbinary' planet orbiting two stars at once, evoking Tatooine's twin sunsets from Star Wars." },
  { id: "wasp_12b", name: "WASP-12b", category: "exoplanet", color: "#7a9e7e", parentBodyId: "WASP-12", distanceFromEarthLy: 871, diameterKm: 250000, massKg: 2.66e27, temperatureK: 2516, orbitalPeriodDays: 1.09, discoveredYear: 2008, difficulty: 5, description: "An extreme hot Jupiter orbiting so close to its star that it is slowly being torn apart and consumed." },
  { id: "55_cancri_e", name: "55 Cancri e", category: "exoplanet", color: "#7a9e7e", parentBodyId: "55 Cancri A", distanceFromEarthLy: 41, diameterKm: 24200, massKg: 4.82e25, temperatureK: 2400, orbitalPeriodDays: 0.7365, discoveredYear: 2004, difficulty: 4, description: "A scorching lava world completing an orbit in under 18 hours, theorized to have a carbon-rich interior." },
]

const existingIds = new Set(dataset.map(o => o.id))
const dupes = NEW_OBJECTS.filter(o => existingIds.has(o.id))
if (dupes.length) {
  console.error("Duplicate ids, aborting:", dupes.map(o => o.id))
  process.exit(1)
}

const updated = [...dataset, ...NEW_OBJECTS]
writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2) + "\n")
console.log(`Added ${NEW_OBJECTS.length} exoplanets. Dataset now has ${updated.length} objects.`)
