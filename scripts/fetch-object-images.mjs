import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { cachedFetch } from "./lib/fetchCache.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DATASET = path.join(ROOT, "src/data/celestialObjects.json")

// Wikipedia's own thumbnail endpoint, at the width the portrait renders at. The API hands these back
// on the thumb.wikimedia.org host, but every URL already in the dataset uses upload.wikimedia.org —
// the same file, and keeping one host means one origin to trust and one to preconnect to.
const THUMB_SIZE = 330
const API_HOST = "https://en.wikipedia.org/w/api.php"
const CANONICAL_IMAGE_HOST = "https://upload.wikimedia.org"

// An object named after a person or a god will happily return a picture of that person or god. Every
// one of these words appeared in a real wrong image in this dataset, and the same list is asserted in
// celestialObjects.test.ts — a candidate matching any of them is dropped rather than written.
const BANNED = [
  "deity", "god", "mytholog", "statue", "vase", "lekythos", "herm", "painting",
  "fresco", "sculpture", "logo", "software", "bird", "collage", "plumage",
  "tumor", "tumour", "mesothelioma", "crater_aerial", "emblem", "alciato", "farnese",
]

// The banned list only catches the wrong images already seen. This is the other half: the article's
// own one-line description has to say the page is the kind of object we asked for, so a page about
// anything else is skipped instead of guessed at.
const EXPECTED = {
  star_cluster: ["cluster", "globular", "asterism"],
  // A gravitational-wave detection describes itself as a signal or a merger, never as a "transient".
  transient: [
    "supernova", "gamma-ray burst", "gamma ray burst", "nova", "transient", "remnant", "burst",
    "gravitational", "kilonova", "merger",
  ],
  star: ["star", "supergiant", "giant", "dwarf", "binary", "sun"],
  asteroid: ["asteroid", "minor planet", "near-earth", "planetoid", "trojan"],
  comet: ["comet"],
  moon: ["moon", "satellite"],
  // Exoplanet descriptions name the class rather than the word: "Super-Earth orbiting LHS 1140",
  // "Sub-Neptune orbiting the red dwarf K2-18". Requiring "planet" threw those away.
  exoplanet: ["exoplanet", "planet", "super-earth", "sub-neptune", "hot jupiter", "orbiting", "world"],
  black_hole: ["black hole", "x-ray binary", "binary"],
  galaxy: ["galaxy"],
  nebula: ["nebula", "remnant"],
  quasar: ["quasar", "galaxy", "blazar"],
  planet: ["planet"],
  dwarf_planet: ["planet"],
}

// Most star articles lead with a chart of the constellation the star sits in, which is a picture of
// the sky rather than of the object. celestialObjects.test.ts already forbids these for stars and
// black holes, so they are rejected here rather than written and caught later.
const SKY_CHART_PATTERN = /constellation_map|_IAU\.svg/i
const CHART_FORBIDDEN_CATEGORIES = ["star", "black_hole"]

// Where the dataset's name is not the article title. Asteroids are the dangerous case: "Apophis" on
// its own is the Egyptian deity, and the minor-planet designation is what disambiguates it.
const PAGE_OVERRIDES = {
  apophis: "99942 Apophis",
  bennu: "101955 Bennu",
  ryugu: "162173 Ryugu",
  itokawa: "25143 Itokawa",
  eros: "433 Eros",
  psyche: "16 Psyche",
  hygiea: "10 Hygiea",
  davida: "511 Davida",
  interamnia: "704 Interamnia",
  europa_asteroid: "52 Europa",
  hyades: "Hyades (star cluster)",
  m13: "Messier 13",
  m7: "Messier 7",
  m67: "Messier 67",
  m22: "Messier 22",
  m15: "Messier 15",
  m4: "Messier 4",
  m5: "Messier 5",
  m92: "Messier 92",
  pandora: "Pandora (moon)",
  prometheus: "Prometheus (moon)",
  atlas: "Atlas (moon)",
  pan: "Pan (moon)",
  daphnis: "Daphnis (moon)",
  helene: "Helene (moon)",
  calypso: "Calypso (moon)",
  telesto: "Telesto (moon)",
  janus: "Janus (moon)",
  epimetheus: "Epimetheus (moon)",
  larissa: "Larissa (moon)",
  galatea: "Galatea (moon)",
  despina: "Despina (moon)",
  thalassa: "Thalassa (moon)",
  naiad: "Naiad (moon)",
  proteus: "Proteus (moon)",
  nereid: "Nereid (moon)",
  phoebe: "Phoebe (moon)",
  bianca: "Bianca (moon)",
  cressida: "Cressida (moon)",
  desdemona: "Desdemona (moon)",
  juliet: "Juliet (moon)",
  portia: "Portia (moon)",
  rosalind: "Rosalind (moon)",
  belinda: "Belinda (moon)",
  puck: "Puck (moon)",
  perdita: "Perdita (moon)",
  mab: "Mab (moon)",
  cupid: "Cupid (moon)",
  francisco: "Francisco (moon)",
  caliban: "Caliban (moon)",
  sycorax: "Sycorax (moon)",
  vega: "Vega",
  polaris: "Polaris",
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

function apiUrl(title) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    redirects: "1",
    prop: "pageimages|description",
    piprop: "thumbnail",
    pithumbsize: String(THUMB_SIZE),
    titles: title,
  })
  return `${API_HOST}?${params}`
}

export function isBannedImage(url) {
  const decoded = decodeURIComponent(url).toLowerCase()
  return BANNED.some(word => decoded.includes(word))
}

export function describesCategory(description, category) {
  const expected = EXPECTED[category]
  if (!expected) return true
  if (!description) return false
  const text = description.toLowerCase()
  return expected.some(word => text.includes(word))
}

export function canonicalizeImageUrl(url) {
  return url.replace(/^https:\/\/[a-z]+\.wikimedia\.org/, CANONICAL_IMAGE_HOST)
}

function pageTitleFor(object) {
  return PAGE_OVERRIDES[object.id] ?? object.name
}

async function findImage(object) {
  const title = pageTitleFor(object)
  const body = await cachedFetch(apiUrl(title))
  const page = JSON.parse(body)?.query?.pages?.[0]
  if (!page || page.missing) return { status: "no article", title }

  const thumbnail = page.thumbnail?.source
  if (!thumbnail) return { status: "article has no image", title }
  if (!describesCategory(page.description, object.category)) {
    return { status: `wrong subject ("${page.description ?? "no description"}")`, title }
  }

  const url = canonicalizeImageUrl(thumbnail)
  if (isBannedImage(url)) return { status: "image rejected by banned-word list", title }
  if (CHART_FORBIDDEN_CATEGORIES.includes(object.category) && SKY_CHART_PATTERN.test(url)) {
    return { status: "sky chart, not the object", title }
  }

  return { status: "ok", title, url }
}

async function main() {
  const apply = process.argv.includes("--apply")
  const only = process.argv.find(a => a.startsWith("--category="))?.split("=")[1]

  const dataset = JSON.parse(fs.readFileSync(DATASET, "utf8"))
  const missing = dataset.filter(o => !o.imageUrl && (!only || o.category === only))
  console.log(`${missing.length} objects without an image${only ? ` in ${only}` : ""}\n`)

  const found = []
  const skipped = []
  for (const object of missing) {
    let result
    try {
      result = await findImage(object)
    } catch (error) {
      result = { status: `fetch failed: ${error.message}` }
    }
    if (result.status === "ok") {
      found.push({ object, url: result.url })
      console.log(`  ok      ${object.id} (${object.category}) -> ${result.url.split("/").pop().split("?")[0]}`)
    } else {
      skipped.push({ object, reason: result.status })
      console.log(`  skip    ${object.id} (${object.category}): ${result.status}`)
    }
    await sleep(120)
  }

  console.log(`\n${found.length} images found, ${skipped.length} skipped`)
  if (skipped.length > 0) {
    const byReason = {}
    for (const s of skipped) byReason[s.reason] = (byReason[s.reason] ?? 0) + 1
    console.log("\nreasons:")
    for (const [reason, count] of Object.entries(byReason).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${count.toString().padStart(3)}  ${reason}`)
    }
  }

  if (!apply) {
    console.log("\nnothing written; re-run with --apply to write these into the dataset")
    return
  }

  for (const { object, url } of found) {
    dataset.find(o => o.id === object.id).imageUrl = url
  }
  fs.writeFileSync(DATASET, JSON.stringify(dataset, null, 2) + "\n")
  console.log(`\nwrote ${found.length} imageUrl values into ${path.relative(ROOT, DATASET)}`)
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(error)
    process.exit(1)
  })
}
