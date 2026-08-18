// One-off script: fetch verified Wikipedia thumbnail URLs for the dataset.
// Run: node scripts/fetch-images.mjs
import { readFileSync, writeFileSync } from "fs"

const DATA_PATH = new URL("../src/data/celestialObjects.json", import.meta.url)
const dataset = JSON.parse(readFileSync(DATA_PATH, "utf-8"))

// Wikipedia page title overrides where the object's display name doesn't
// match the article title exactly.
const TITLE_OVERRIDE = {
  sun: "Sun",
  moon: "Moon",
  sirius: "Sirius",
  halley: "Halley's Comet",
  hale_bopp: "Comet Hale–Bopp",
  sagittarius_a_star: "Sagittarius A*",
  m87_star: "Messier 87",
  cygnus_x1: "Cygnus X-1",
  milky_way: "Milky Way",
  andromeda: "Andromeda Galaxy",
  whirlpool_galaxy: "Whirlpool Galaxy",
  orion_nebula: "Orion Nebula",
  crab_nebula: "Crab Nebula",
  ring_nebula: "Ring Nebula",
  proxima_centauri: "Proxima Centauri",
  mercury: "Mercury (planet)",
  ceres: "Ceres (dwarf planet)",
  eris: "Eris (dwarf planet)",
  io: "Io (moon)",
  europa: "Europa (moon)",
  ganymede: "Ganymede (moon)",
  callisto: "Callisto (moon)",
  titan: "Titan (moon)",
  triton: "Triton (moon)",
  titania: "Titania (moon)",
  rhea: "Rhea (moon)",
  iapetus: "Iapetus (moon)",
  phobos: "Phobos (moon)",
  deimos: "Deimos (moon)",
  dione: "Dione (moon)",
  tethys: "Tethys (moon)",
  miranda: "Miranda (moon)",
  ariel: "Ariel (moon)",
  vesta: "4 Vesta",
  itokawa: "25143 Itokawa",
  psyche: "16 Psyche",
  ida: "243 Ida",
  nereid: "Nereid (moon)",
  hyperion: "Hyperion (moon)",
  amalthea: "Amalthea (moon)",
  pallas: "2 Pallas",
  juno_asteroid: "3 Juno",
  chiron: "2060 Chiron",
  neowise: "C/2020 F3 (NEOWISE)",
  alpha_centauri_a: "Alpha Centauri A",
  cassiopeia: "Cassiopeia (constellation)",
  leo: "Leo (constellation)",
  cygnus: "Cygnus (constellation)",
  orion: "Orion (constellation)",
  aquarius: "Aquarius (constellation)",
  aquila: "Aquila (constellation)",
  ara: "Ara (constellation)",
  aries: "Aries (constellation)",
  carina: "Carina (constellation)",
  cepheus: "Cepheus (constellation)",
  cetus: "Cetus (constellation)",
  draco: "Draco (constellation)",
  eridanus: "Eridanus (constellation)",
  gemini: "Gemini (constellation)",
  grus: "Grus (constellation)",
  horologium: "Horologium (constellation)",
  hydra: "Hydra (constellation)",
  libra: "Libra (constellation)",
  mensa: "Mensa (constellation)",
  norma: "Norma (constellation)",
  pavo: "Pavo (constellation)",
  phoenix: "Phoenix (constellation)",
  pisces: "Pisces (constellation)",
  taurus: "Taurus (constellation)",
  vela: "Vela (constellation)",
  virgo: "Virgo (constellation)",
}

const UA = "CelestialGame/1.0 (contact: mpink2491@gmail.com)"

async function fetchThumbnail(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  const res = await fetch(url, { headers: { "User-Agent": UA } })
  if (!res.ok) return null
  const json = await res.json()
  return json.thumbnail?.source ?? null
}

const results = []
for (const obj of dataset) {
  const title = TITLE_OVERRIDE[obj.id] ?? obj.name
  const imageUrl = await fetchThumbnail(title)
  results.push({ id: obj.id, name: obj.name, title, imageUrl })
  console.log(imageUrl ? "OK  " : "MISS", obj.id, "->", title)
}

const updated = dataset.map(obj => {
  const found = results.find(r => r.id === obj.id)
  return found?.imageUrl ? { ...obj, imageUrl: found.imageUrl } : obj
})

writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2) + "\n")

const missing = results.filter(r => !r.imageUrl)
console.log(`\n${results.length - missing.length}/${results.length} images found`)
if (missing.length) {
  console.log("MISSING:", missing.map(m => `${m.id} (tried "${m.title}")`).join(", "))
}
