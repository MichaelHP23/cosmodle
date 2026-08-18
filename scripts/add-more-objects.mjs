import { readFileSync, writeFileSync } from "fs"

const DATA_PATH = new URL("../src/data/celestialObjects.json", import.meta.url)
const dataset = JSON.parse(readFileSync(DATA_PATH, "utf-8"))

const NEW_OBJECTS = [
  // Black holes
  { id: "ton_618", name: "TON 618", category: "black_hole", color: "#15151f", distanceFromEarthLy: 10400000000, diameterKm: 3.9e11, massKg: 1.313e41, difficulty: 5, description: "One of the most massive black holes ever found, powering a hyperluminous quasar." },
  { id: "oj_287", name: "OJ 287", category: "black_hole", color: "#15151f", distanceFromEarthLy: 3500000000, diameterKm: 1.06e11, massKg: 3.58e40, difficulty: 5, description: "A binary black hole system whose smaller companion punches through the larger one's disk every ~12 years, causing predictable flares." },
  { id: "gro_j1655_40", name: "GRO J1655-40", category: "black_hole", color: "#15151f", distanceFromEarthLy: 11000, diameterKm: 37, massKg: 1.253e31, difficulty: 5, description: "A stellar-mass black hole in a binary system, notable for jets that appeared to move faster than light (an illusion of perspective)." },
  { id: "v404_cygni", name: "V404 Cygni", category: "black_hole", color: "#15151f", distanceFromEarthLy: 7800, diameterKm: 53, massKg: 1.79e31, difficulty: 5, description: "A black hole binary that erupted dramatically in 2015 after 26 years of quiet, briefly becoming one of the brightest X-ray sources in the sky." },

  // Quasars
  { id: "3c273", name: "3C 273", category: "quasar", color: "#7fe0ff", distanceFromEarthLy: 2400000000, massKg: 1.76e39, discoveredYear: 1963, difficulty: 4, description: "The first quasar ever identified and one of the most luminous objects in the observable universe." },
  { id: "3c48", name: "3C 48", category: "quasar", color: "#7fe0ff", distanceFromEarthLy: 4500000000, massKg: 1.989e39, discoveredYear: 1960, difficulty: 5, description: "One of the earliest known quasars, first cataloged as a mysterious radio source before its true nature was understood." },
  { id: "ulas_j1120", name: "ULAS J1120+0641", category: "quasar", color: "#7fe0ff", distanceFromEarthLy: 28850000000, massKg: 3.98e39, discoveredYear: 2011, difficulty: 5, description: "One of the most distant known quasars, seen as it was less than a billion years after the Big Bang." },
  { id: "apm08279", name: "APM 08279+5255", category: "quasar", color: "#7fe0ff", distanceFromEarthLy: 12000000000, massKg: 1.989e40, discoveredYear: 1998, difficulty: 5, description: "An extremely luminous, gravitationally lensed quasar surrounded by a massive reservoir of water vapor." },
  { id: "markarian_231", name: "Markarian 231", category: "quasar", color: "#7fe0ff", distanceFromEarthLy: 581000000, massKg: 9.15e37, discoveredYear: 1969, difficulty: 4, description: "The closest known quasar to Earth, harboring a binary supermassive black hole at its core." },

  // Galaxies
  { id: "triangulum", name: "Triangulum Galaxy", category: "galaxy", color: "#a8c4ff", distanceFromEarthLy: 2730000, diameterKm: 5.68e17, massKg: 9.95e40, difficulty: 3, description: "The third-largest galaxy in the Local Group, a spiral galaxy visible to the naked eye under dark skies." },
  { id: "sombrero_galaxy", name: "Sombrero Galaxy", category: "galaxy", color: "#d9c9a3", distanceFromEarthLy: 31000000, diameterKm: 4.73e17, massKg: 1.59e42, difficulty: 4, description: "A galaxy with a bright nucleus, large central bulge, and a prominent dust lane, resembling a wide-brimmed hat." },
  { id: "large_magellanic_cloud", name: "Large Magellanic Cloud", category: "galaxy", color: "#cddcff", distanceFromEarthLy: 163000, diameterKm: 1.32e17, massKg: 1.989e40, difficulty: 2, description: "A satellite galaxy of the Milky Way visible to the naked eye from the Southern Hemisphere." },
  { id: "centaurus_a", name: "Centaurus A", category: "galaxy", color: "#b8a8ff", distanceFromEarthLy: 13000000, diameterKm: 5.68e17, massKg: 1.989e42, difficulty: 4, description: "A giant elliptical galaxy with an active supermassive black hole launching a jet of particles thousands of light-years long." },

  // Nebulae
  { id: "eagle_nebula", name: "Eagle Nebula", category: "nebula", color: "#d98f5c", distanceFromEarthLy: 7000, diameterKm: 6.62e14, difficulty: 2, description: "Home to the Pillars of Creation, towering columns of gas and dust where new stars are forming." },
  { id: "helix_nebula", name: "Helix Nebula", category: "nebula", color: "#7fd9c8", distanceFromEarthLy: 650, diameterKm: 2.37e13, difficulty: 3, description: "One of the closest planetary nebulae to Earth, nicknamed the 'Eye of God' for its ring-like appearance." },
  { id: "cats_eye_nebula", name: "Cat's Eye Nebula", category: "nebula", color: "#7fd9ff", distanceFromEarthLy: 3300, diameterKm: 2.84e12, difficulty: 4, description: "A planetary nebula with an intricate, layered structure suggesting repeated bursts of material from its dying central star." },

  // Moons
  { id: "nereid", name: "Nereid", category: "moon", color: "#b8b0a8", distanceFromParentKm: 5513400, diameterKm: 340, massKg: 3.1e19, temperatureK: 50, gravityMs2: 0.07, orbitalPeriodDays: 360.13, parentBodyId: "neptune", difficulty: 5, description: "One of the most eccentric orbits of any moon in the solar system, swinging from close to Neptune to far beyond it." },
  { id: "hyperion", name: "Hyperion", category: "moon", color: "#a89478", distanceFromParentKm: 1481000, diameterKm: 270, massKg: 5.6e18, temperatureK: 93, gravityMs2: 0.017, orbitalPeriodDays: 21.28, parentBodyId: "saturn", difficulty: 5, description: "An irregularly shaped, sponge-like moon of Saturn that tumbles chaotically rather than rotating predictably." },
  { id: "amalthea", name: "Amalthea", category: "moon", color: "#b5674a", distanceFromParentKm: 181400, diameterKm: 167, massKg: 2.08e18, temperatureK: 123, gravityMs2: 0.02, orbitalPeriodDays: 0.498, parentBodyId: "jupiter", difficulty: 5, description: "A small, reddish inner moon of Jupiter, likely stained by sulfur particles from Io's volcanic eruptions." },

  // Asteroids / comets
  { id: "pallas", name: "2 Pallas", category: "asteroid", color: "#9a9a9a", distanceFromSunAU: 2.77, diameterKm: 513, massKg: 2.11e20, temperatureK: 164, orbitalPeriodDays: 1686, difficulty: 4, description: "The third-largest object in the asteroid belt, tilted at a steep angle unlike most other large asteroids." },
  { id: "juno_asteroid", name: "3 Juno", category: "asteroid", color: "#8a7a63", distanceFromSunAU: 2.67, diameterKm: 247, massKg: 2.67e19, temperatureK: 163, orbitalPeriodDays: 1594, difficulty: 5, description: "One of the first asteroids discovered, bright enough to occasionally be visible with the naked eye." },
  { id: "chiron", name: "2060 Chiron", category: "comet", color: "#7a8a8a", distanceFromSunAU: 13.7, diameterKm: 218, massKg: 4e18, temperatureK: 75, orbitalPeriodDays: 18500, difficulty: 5, description: "A centaur that orbits between Saturn and Uranus, classified as both an asteroid and a comet due to its occasional cometary activity." },
  { id: "neowise", name: "C/2020 F3 (NEOWISE)", category: "comet", color: "#bcd9e0", distanceFromSunAU: 358, diameterKm: 5, temperatureK: 68, orbitalPeriodDays: 2483000, difficulty: 3, description: "A long-period comet that became the brightest seen from the Northern Hemisphere in over two decades when it passed by in 2020." },

  // Stars
  { id: "rigel", name: "Rigel", category: "star", color: "#cfe0ff", distanceFromEarthLy: 860, diameterKm: 1.03e8, massKg: 4.18e31, temperatureK: 12100, difficulty: 3, description: "A blue supergiant and the brightest star in the constellation Orion, tens of thousands of times more luminous than the Sun." },
  { id: "antares", name: "Antares", category: "star", color: "#ff5c3a", distanceFromEarthLy: 550, diameterKm: 9.46e8, massKg: 2.39e31, temperatureK: 3660, difficulty: 3, description: "A red supergiant so large that, like Betelgeuse, it could engulf the orbit of Mars if placed at the center of the solar system." },
  { id: "polaris", name: "Polaris", category: "star", color: "#eef0ff", distanceFromEarthLy: 433, diameterKm: 5.22e7, massKg: 1.07e31, temperatureK: 6015, difficulty: 4, description: "The current North Star, closely aligned with Earth's axis of rotation, making it appear nearly fixed in the sky." },
  { id: "alpha_centauri_a", name: "Alpha Centauri A", category: "star", color: "#fff2d0", distanceFromEarthLy: 4.37, diameterKm: 1.697e6, massKg: 2.19e30, temperatureK: 5790, difficulty: 4, description: "The brighter member of the nearest star system to the Sun, a yellow star very similar in size and temperature to our own." },

  // Constellations
  { id: "orion", name: "Orion", category: "constellation", color: "#dbe4ff", hemisphere: "both", areaSqDeg: 594, brightestStarMagnitude: 0.13, difficulty: 1, description: "One of the most recognizable constellations, depicting a hunter flanked by two dogs, with a distinctive three-star belt." },
  { id: "ursa_major", name: "Ursa Major", category: "constellation", color: "#dbe4ff", hemisphere: "northern", areaSqDeg: 1280, brightestStarMagnitude: 1.76, difficulty: 1, description: "The third-largest constellation, home to the Big Dipper asterism used for centuries to find true north." },
  { id: "ursa_minor", name: "Ursa Minor", category: "constellation", color: "#dbe4ff", hemisphere: "northern", areaSqDeg: 256, brightestStarMagnitude: 1.97, difficulty: 2, description: "Contains Polaris, the North Star, at the tip of its tail, making it a key reference for celestial navigation." },
  { id: "cassiopeia", name: "Cassiopeia", category: "constellation", color: "#dbe4ff", hemisphere: "northern", areaSqDeg: 598, brightestStarMagnitude: 2.24, difficulty: 2, description: "Named for a vain queen in Greek mythology, easily spotted by its distinctive W or M shape of five bright stars." },
  { id: "leo", name: "Leo", category: "constellation", color: "#dbe4ff", hemisphere: "northern", areaSqDeg: 947, brightestStarMagnitude: 1.35, difficulty: 3, description: "A zodiac constellation resembling a crouching lion, with a curved 'sickle' of stars marking its head and mane." },
  { id: "scorpius", name: "Scorpius", category: "constellation", color: "#dbe4ff", hemisphere: "southern", areaSqDeg: 497, brightestStarMagnitude: 0.96, difficulty: 3, description: "A zodiac constellation whose curving tail of stars traces the shape of a scorpion across the southern summer sky." },
  { id: "crux", name: "Crux", category: "constellation", color: "#dbe4ff", hemisphere: "southern", areaSqDeg: 68, brightestStarMagnitude: 0.76, difficulty: 3, description: "The smallest of all 88 official constellations, known as the Southern Cross and featured on several national flags." },
  { id: "cygnus", name: "Cygnus", category: "constellation", color: "#dbe4ff", hemisphere: "northern", areaSqDeg: 804, brightestStarMagnitude: 1.25, difficulty: 3, description: "Depicts a swan flying along the Milky Way, its brightest stars forming the well-known Northern Cross asterism." },
  { id: "andromeda_constellation", name: "Andromeda (constellation)", category: "constellation", color: "#dbe4ff", hemisphere: "northern", areaSqDeg: 722, brightestStarMagnitude: 2.06, difficulty: 4, description: "Named for a mythological princess, this constellation is best known as the location of the Andromeda Galaxy." },
  { id: "sagittarius_constellation", name: "Sagittarius (constellation)", category: "constellation", color: "#dbe4ff", hemisphere: "southern", areaSqDeg: 867, brightestStarMagnitude: 1.79, difficulty: 3, description: "A zodiac constellation shaped like a teapot, pointing toward the center of the Milky Way galaxy." },
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
