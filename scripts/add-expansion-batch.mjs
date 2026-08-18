import { readFileSync, writeFileSync } from "fs"

const DATA_PATH = new URL("../src/data/celestialObjects.json", import.meta.url)
const dataset = JSON.parse(readFileSync(DATA_PATH, "utf-8"))

const NEW_OBJECTS = [
  // Moons
  { id: "himalia", name: "Himalia", category: "moon", color: "#8a7f6e", distanceFromParentKm: 11460000, diameterKm: 140, massKg: 4.2e18, temperatureK: 124, gravityMs2: 0.062, orbitalPeriodDays: 250.23, parentBodyId: "jupiter", difficulty: 5, description: "The largest of Jupiter's irregular moons, likely a captured asteroid orbiting far beyond the main Galilean moons." },
  { id: "janus", name: "Janus", category: "moon", color: "#c9c9c9", distanceFromParentKm: 151460, diameterKm: 179, massKg: 1.9e18, temperatureK: 78, gravityMs2: 0.013, orbitalPeriodDays: 0.694, parentBodyId: "saturn", difficulty: 5, description: "Shares nearly the same orbit as the moon Epimetheus, the two swapping positions every four years without colliding." },
  { id: "epimetheus", name: "Epimetheus", category: "moon", color: "#bfbfbf", distanceFromParentKm: 151410, diameterKm: 116, massKg: 5.3e17, temperatureK: 78, gravityMs2: 0.007, orbitalPeriodDays: 0.694, parentBodyId: "saturn", difficulty: 5, description: "Co-orbital with Janus in one of the most unusual orbital relationships in the solar system." },
  { id: "pan", name: "Pan", category: "moon", color: "#a89a7a", distanceFromParentKm: 133580, diameterKm: 28.6, massKg: 4.95e15, temperatureK: 78, gravityMs2: 0.001, orbitalPeriodDays: 0.575, parentBodyId: "saturn", difficulty: 5, description: "A tiny, walnut-shaped moon that orbits within a gap in Saturn's rings, sweeping the gap clear of debris." },
  { id: "puck", name: "Puck", category: "moon", color: "#8f8f8f", distanceFromParentKm: 86010, diameterKm: 162, massKg: 1.91e18, temperatureK: 64, gravityMs2: 0.019, orbitalPeriodDays: 0.762, parentBodyId: "uranus", difficulty: 5, description: "The largest of Uranus's inner moons, named after the mischievous sprite from Shakespeare's A Midsummer Night's Dream." },
  { id: "proteus", name: "Proteus", category: "moon", color: "#7a8a8f", distanceFromParentKm: 117647, diameterKm: 420, massKg: 4.4e19, temperatureK: 51, gravityMs2: 0.07, orbitalPeriodDays: 1.122, parentBodyId: "neptune", difficulty: 5, description: "One of the darkest objects in the solar system, so close to Neptune that it is difficult to observe from Earth." },
  { id: "larissa", name: "Larissa", category: "moon", color: "#7a7a8a", distanceFromParentKm: 73548, diameterKm: 194, massKg: 4.2e18, temperatureK: 51, gravityMs2: 0.019, orbitalPeriodDays: 0.555, parentBodyId: "neptune", difficulty: 5, description: "An irregularly shaped inner moon of Neptune, discovered during a stellar occultation before being confirmed by Voyager 2." },
  { id: "nix", name: "Nix", category: "moon", color: "#c4b8a8", distanceFromParentKm: 48690, diameterKm: 42, massKg: 4.5e16, temperatureK: 44, gravityMs2: 0.003, orbitalPeriodDays: 24.85, parentBodyId: "pluto", difficulty: 5, description: "One of Pluto's small outer moons, tumbling chaotically due to the complex gravity of the Pluto-Charon binary system." },
  { id: "hydra_moon", name: "Hydra", category: "moon", color: "#d0c8bc", distanceFromParentKm: 64720, diameterKm: 51, massKg: 4.8e16, temperatureK: 44, gravityMs2: 0.003, orbitalPeriodDays: 38.2, parentBodyId: "pluto", difficulty: 5, description: "The outermost of Pluto's known moons, named after the many-headed serpent of Greek mythology." },

  // Asteroids
  { id: "hygiea", name: "10 Hygiea", category: "asteroid", color: "#8a8a8a", distanceFromSunAU: 3.14, diameterKm: 434, massKg: 8.74e19, temperatureK: 164, orbitalPeriodDays: 2031, difficulty: 5, description: "The fourth-largest object in the asteroid belt, round enough that it has been considered for dwarf planet status." },
  { id: "interamnia", name: "704 Interamnia", category: "asteroid", color: "#7a7a72", distanceFromSunAU: 3.06, diameterKm: 332, massKg: 3.5e19, temperatureK: 164, orbitalPeriodDays: 1955, difficulty: 5, description: "One of the largest main-belt asteroids not yet visited by any spacecraft, named after the Latin name for Teramo, Italy." },
  { id: "eunomia", name: "15 Eunomia", category: "asteroid", color: "#8f7f63", distanceFromSunAU: 2.64, diameterKm: 268, massKg: 3.12e19, temperatureK: 170, orbitalPeriodDays: 1569, difficulty: 5, description: "The largest asteroid of the stony S-type, and the most massive asteroid without a spacecraft visit as of its discovery era." },
  { id: "davida", name: "511 Davida", category: "asteroid", color: "#6e6e66", distanceFromSunAU: 3.16, diameterKm: 289, massKg: 2.98e19, temperatureK: 164, orbitalPeriodDays: 2052, difficulty: 5, description: "One of the largest main-belt asteroids, irregularly shaped and dark in color." },
  { id: "lutetia", name: "21 Lutetia", category: "asteroid", color: "#9a9a9a", distanceFromSunAU: 2.43, diameterKm: 98, massKg: 1.7e18, temperatureK: 170, orbitalPeriodDays: 1390, difficulty: 5, description: "A heavily cratered metallic asteroid visited by the Rosetta spacecraft on its way to comet 67P." },

  // Comets
  { id: "encke", name: "Comet Encke", category: "comet", color: "#bcd9e0", distanceFromSunAU: 2.22, diameterKm: 4.8, massKg: 2.9e13, temperatureK: 200, orbitalPeriodDays: 1204, difficulty: 4, description: "Has the shortest orbital period of any known comet, returning past the Sun once every 3.3 years." },
  { id: "swift_tuttle", name: "Comet Swift-Tuttle", category: "comet", color: "#a8ccd9", distanceFromSunAU: 26.09, diameterKm: 26, massKg: 1.98e17, temperatureK: 68, orbitalPeriodDays: 47758, difficulty: 3, description: "The parent body of the annual Perseid meteor shower, with a nucleus larger than the object believed to have ended the dinosaurs." },
  { id: "hyakutake", name: "Comet Hyakutake", category: "comet", color: "#cbe8ee", distanceFromSunAU: 1700, diameterKm: 4.6, massKg: 8.8e12, temperatureK: 68, orbitalPeriodDays: 25567500, difficulty: 3, description: "Passed unusually close to Earth in 1996, appearing as one of the brightest comets in decades with an exceptionally long visible tail." },

  // Stars
  { id: "deneb", name: "Deneb", category: "star", color: "#dfe8ff", distanceFromEarthLy: 2615, diameterKm: 2.82e8, massKg: 3.78e31, temperatureK: 8525, difficulty: 3, description: "One of the most luminous stars known, a blue-white supergiant marking the tail of the constellation Cygnus." },
  { id: "capella", name: "Capella", category: "star", color: "#fff0c8", distanceFromEarthLy: 42.9, diameterKm: 1.697e7, massKg: 4.97e30, temperatureK: 4970, difficulty: 3, description: "Actually a system of four stars appearing as one bright point, the brightest star in the constellation Auriga." },
  { id: "arcturus", name: "Arcturus", category: "star", color: "#ffcf8f", distanceFromEarthLy: 36.7, diameterKm: 3.65e7, massKg: 2.15e30, temperatureK: 4286, difficulty: 3, description: "The brightest star in the northern celestial hemisphere, an aging orange giant nearing the end of its life." },
  { id: "aldebaran", name: "Aldebaran", category: "star", color: "#ffb680", distanceFromEarthLy: 65.3, diameterKm: 6.274e7, massKg: 2.31e30, temperatureK: 3900, difficulty: 3, description: "A red giant marking the eye of the bull in Taurus, though it only appears aligned with the more distant Hyades cluster." },
  { id: "spica", name: "Spica", category: "star", color: "#c8d9ff", distanceFromEarthLy: 250, diameterKm: 1.039e7, massKg: 2.27e31, temperatureK: 22300, difficulty: 4, description: "A close binary of hot blue giant stars so near each other that their mutual gravity distorts them into egg shapes." },
  { id: "fomalhaut", name: "Fomalhaut", category: "star", color: "#eaf2ff", distanceFromEarthLy: 25.1, diameterKm: 2.563e6, massKg: 3.82e30, temperatureK: 8590, difficulty: 3, description: "Surrounded by a debris disk that once hosted a directly imaged exoplanet candidate, since found likely to be a dust cloud." },
  { id: "altair", name: "Altair", category: "star", color: "#eef2ff", distanceFromEarthLy: 16.7, diameterKm: 2.365e6, massKg: 3.70e30, temperatureK: 7670, difficulty: 3, description: "Spins so rapidly that it is flattened into an oblate shape, completing a full rotation in under 9 hours." },
  { id: "achernar", name: "Achernar", category: "star", color: "#d8e6ff", distanceFromEarthLy: 139, diameterKm: 1.113e7, massKg: 1.33e31, temperatureK: 14000, difficulty: 4, description: "One of the least spherical stars known, flattened by extremely fast rotation into a shape wider at its equator than its poles." },

  // Black holes
  { id: "a0620_00", name: "A0620-00", category: "black_hole", color: "#15151f", distanceFromEarthLy: 3500, diameterKm: 39, massKg: 1.31e31, difficulty: 5, description: "One of the closest known stellar-mass black holes to Earth, discovered via an X-ray nova outburst in 1975." },
  { id: "grs1915", name: "GRS 1915+105", category: "black_hole", color: "#15151f", distanceFromEarthLy: 36000, diameterKm: 73, massKg: 2.47e31, difficulty: 5, description: "One of the most massive stellar black holes known in our galaxy, famous for launching relativistic jets nicknamed a 'microquasar.'" },
  { id: "ngc4889_black_hole", name: "NGC 4889 Black Hole", category: "black_hole", color: "#15151f", distanceFromEarthLy: 308000000, diameterKm: 1.24e11, massKg: 4.18e40, difficulty: 5, description: "One of the most massive black holes ever measured, sitting at the center of a giant elliptical galaxy in the Coma Cluster." },
  { id: "phoenix_a", name: "Phoenix A", category: "black_hole", color: "#15151f", distanceFromEarthLy: 5700000000, diameterKm: 1.18e11, massKg: 3.98e40, difficulty: 5, description: "An extraordinarily massive black hole at the heart of the Phoenix Cluster, forming stars at a rate unusual for its host galaxy type." },

  // Quasars
  { id: "3c279", name: "3C 279", category: "quasar", color: "#7fe0ff", distanceFromEarthLy: 5400000000, massKg: 9.9e38, discoveredYear: 1965, difficulty: 5, description: "A highly variable blazar whose brightness can change dramatically within days, among the most studied quasars in the sky." },
  { id: "pds456", name: "PDS 456", category: "quasar", color: "#7fe0ff", distanceFromEarthLy: 2000000000, massKg: 1.989e39, discoveredYear: 1987, difficulty: 5, description: "One of the most luminous quasars in the nearby universe, driving powerful winds that blow gas out of its host galaxy." },
  { id: "j0313_1806", name: "J0313-1806", category: "quasar", color: "#7fe0ff", distanceFromEarthLy: 13030000000, massKg: 3.18e39, discoveredYear: 2021, difficulty: 5, description: "One of the most distant quasars ever found, observed as it existed when the universe was less than 700 million years old." },
  { id: "pks2126_158", name: "PKS 2126-158", category: "quasar", color: "#7fe0ff", distanceFromEarthLy: 9100000000, massKg: 1.989e40, discoveredYear: 1979, difficulty: 5, description: "One of the most luminous quasars known, radiating energy equivalent to trillions of Suns." },

  // Galaxies
  { id: "bodes_galaxy", name: "Bode's Galaxy", category: "galaxy", color: "#c9d4ff", distanceFromEarthLy: 11800000, diameterKm: 9.08e17, massKg: 1.99e41, difficulty: 3, description: "A grand-design spiral galaxy with well-defined arms, a favorite target for amateur astronomers due to its brightness." },
  { id: "cigar_galaxy", name: "Cigar Galaxy", category: "galaxy", color: "#ffd4a8", distanceFromEarthLy: 12000000, diameterKm: 3.78e17, massKg: 6e40, difficulty: 3, description: "A starburst galaxy producing new stars at a rate ten times faster than the Milky Way, likely triggered by a close pass with its neighbor." },
  { id: "pinwheel_galaxy", name: "Pinwheel Galaxy", category: "galaxy", color: "#bcd4ff", distanceFromEarthLy: 21000000, diameterKm: 1.7e18, massKg: 2e41, difficulty: 3, description: "A large, face-on spiral galaxy with asymmetric arms shaped by gravitational interactions with several companion galaxies." },
  { id: "cartwheel_galaxy", name: "Cartwheel Galaxy", category: "galaxy", color: "#ffb8c8", distanceFromEarthLy: 500000000, diameterKm: 1.42e18, massKg: 2e41, difficulty: 4, description: "Its distinctive ring shape was formed by a smaller galaxy passing directly through its center, triggering a ripple of star formation." },
  { id: "small_magellanic_cloud", name: "Small Magellanic Cloud", category: "galaxy", color: "#d8e0ff", distanceFromEarthLy: 200000, diameterKm: 6.62e16, massKg: 7e39, difficulty: 2, description: "A dwarf galaxy visible to the naked eye from the Southern Hemisphere, gravitationally linked to its larger neighbor, the LMC." },

  // Nebulae
  { id: "lagoon_nebula", name: "Lagoon Nebula", category: "nebula", color: "#ff9ec8", distanceFromEarthLy: 4100, diameterKm: 1.04e15, difficulty: 2, description: "A vast stellar nursery visible to the naked eye, containing a young star cluster embedded within its glowing gas." },
  { id: "trifid_nebula", name: "Trifid Nebula", category: "nebula", color: "#d98fd9", distanceFromEarthLy: 5200, diameterKm: 3.5e14, difficulty: 3, description: "Named for the dark dust lanes that appear to split its glowing gas into three lobes." },
  { id: "rosette_nebula", name: "Rosette Nebula", category: "nebula", color: "#ff7f9e", distanceFromEarthLy: 5200, diameterKm: 1.23e15, difficulty: 3, description: "A rose-shaped ring of glowing gas surrounding a young cluster of stars whose radiation carved out its central cavity." },
  { id: "tarantula_nebula", name: "Tarantula Nebula", category: "nebula", color: "#ff9fbf", distanceFromEarthLy: 161000, diameterKm: 9.6e15, difficulty: 3, description: "The most active star-forming region known in the nearby universe, located within the Large Magellanic Cloud." },
  { id: "veil_nebula", name: "Veil Nebula", category: "nebula", color: "#8fd9d0", distanceFromEarthLy: 2100, diameterKm: 1.04e15, difficulty: 3, description: "The delicate, glowing remains of a massive star that exploded as a supernova roughly 10,000 years ago." },

  // Exoplanets
  { id: "kepler_186f", name: "Kepler-186f", category: "exoplanet", color: "#7a9e7e", parentBodyId: "Kepler-186", distanceFromEarthLy: 582, diameterKm: 14144, massKg: 8.6e24, temperatureK: 188, orbitalPeriodDays: 129.9, discoveredYear: 2014, difficulty: 4, description: "The first Earth-sized planet found within the habitable zone of another star, orbiting a cool red dwarf." },
  { id: "gj1214b", name: "GJ 1214 b", category: "exoplanet", color: "#7a9e7e", parentBodyId: "Gliese 1214", distanceFromEarthLy: 48, diameterKm: 33512, massKg: 3.91e25, temperatureK: 553, orbitalPeriodDays: 1.58, discoveredYear: 2009, difficulty: 4, description: "A 'mini-Neptune' thought to be a water world, with a thick steamy atmosphere shrouding its surface." },
  { id: "hr8799b", name: "HR 8799 b", category: "exoplanet", color: "#7a9e7e", parentBodyId: "HR 8799", distanceFromEarthLy: 133, diameterKm: 168000, massKg: 1.14e28, temperatureK: 870, orbitalPeriodDays: 175000, discoveredYear: 2008, difficulty: 5, description: "One of the first exoplanets ever directly photographed, part of a system with four giant planets imaged in orbit around their star." },
  { id: "gliese667cc", name: "Gliese 667 Cc", category: "exoplanet", color: "#7a9e7e", parentBodyId: "Gliese 667 C", distanceFromEarthLy: 23.6, diameterKm: 16000, massKg: 2.27e25, temperatureK: 277, orbitalPeriodDays: 28.14, discoveredYear: 2011, difficulty: 4, description: "Orbits within the habitable zone of one star in a triple-star system, one of the most Earth-like exoplanets known at its discovery." },
  { id: "toi700d", name: "TOI-700 d", category: "exoplanet", color: "#7a9e7e", parentBodyId: "TOI-700", distanceFromEarthLy: 101.4, diameterKm: 15200, massKg: 1.0e25, temperatureK: 268, orbitalPeriodDays: 37.4, discoveredYear: 2020, difficulty: 4, description: "The first Earth-sized habitable-zone planet discovered by NASA's TESS mission." },
]

const existingIds = new Set(dataset.map(o => o.id))
const dupes = NEW_OBJECTS.filter(o => existingIds.has(o.id))
if (dupes.length) {
  console.error("Duplicate ids, aborting:", dupes.map(o => o.id))
  process.exit(1)
}

const updated = [...dataset, ...NEW_OBJECTS]
writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2) + "\n")
console.log(`Added ${NEW_OBJECTS.length} objects. Dataset now has ${updated.length} objects.`)
