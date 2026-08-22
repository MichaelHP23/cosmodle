import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { cachedFetch } from "./lib/fetchCache.mjs"

// Wikipedia's lead image is often a sky chart, a light curve or the myth the object is named after,
// which is exactly the bug this dataset already suffered, so this script only ever prints proposals.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DATASET = path.join(ROOT, "src/data/celestialObjects.json")

// Where the article title is not simply the object's name, it is given here.
const TITLES = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/imageTitles.json"), "utf8"))

// Run on 2026-08-22: the 84 objects still without a picture are 82 stars, Apophis and Cygnus X-1.
// Every lead image the API proposed for them was a constellation chart or a planetarium screenshot,
// because a star is a point source and no honest photograph of one exists. The generated portrait is
// the better answer for all of them, so nothing was applied.
const dataset = JSON.parse(fs.readFileSync(DATASET, "utf8"))
const missing = dataset.filter(o => !o.imageUrl && o.category !== "constellation")

for (const obj of missing) {
  const title = TITLES[obj.id] ?? obj.name
  const url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title.replace(/ /g, "_"))
  let summary
  try {
    summary = JSON.parse(await cachedFetch(url, { retries: 3, baseDelayMs: 1000 }))
  } catch {
    console.log(`${obj.id}\tNO ARTICLE\t${title}`)
    continue
  }
  const image = summary.originalimage?.source ?? summary.thumbnail?.source
  if (!image) { console.log(`${obj.id}\tNO IMAGE\t${title}`); continue }
  console.log(`${obj.id}\t${decodeURIComponent(image.split("/").pop())}\t${image}`)
}
