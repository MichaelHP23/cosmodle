# Cosmodle Backlog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring every celestial body's data up to a verified standard, prove the dataset has no remaining errors, make every guess picture show its own object, and prepare the game for ads and for new categories of object.

**Architecture:** The dataset (`src/data/celestialObjects.json`, 298 objects) is the product. Most workstreams here are verification pipelines that compare it against authoritative catalogues and emit a diff for review, rather than hand edits. New object categories extend the existing `CelestialCategory` union plus a per-category profile in `objectProfiles.ts`; nothing else in the game needs to know about them.

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind v4, Vitest, Cloudflare Pages Functions + D1. Verification scripts are plain Node ESM under `scripts/`.

**Spec:** This document is both spec and plan.

**Status, 2026-08-22 evening.** Workstreams 1, 2, 3 and 9 are done. Workstream 7 is done as far as it
can go without a decision, see the note in that section. Workstream 4 needed no work. Workstreams 5
and 8 are still blocked on the questions at the foot of this document.

---

## Read this first: three items are not what they look like

**Item 4 (website in footer) is already done.** `src/components/Footer.tsx:7-12` already renders a link to `https://michael-pink.com` with `target="_blank"` and `rel="noopener noreferrer"`. It is the first item in the footer, left of "Global Stats". No work is needed unless you want it to look different — see Workstream 4 for what "different" could mean.

**Item 8 (gitignore `migrations/`) will break your deploys.** `migrations/0001_create_results.sql` and `0002_add_gave_up.sql` are the only definition of the D1 schema. If they leave the repo, a fresh clone cannot provision the database, and `wrangler d1 migrations apply` has nothing to apply. Also note that adding a path to `.gitignore` does **not** untrack files already committed — both files and both `docs/superpowers` files are currently tracked, so this needs `git rm --cached` to take effect. **This item is blocked on your decision.** See Workstream 8.

**Item 7 (completely random) needs a definition.** The daily puzzle is deliberately *not* random at play time: it reads a committed schedule (`src/data/dailySchedule.json`) so that every player gets the same object and so that adding new objects cannot rewrite days people already played. That design is correct and should not be undone. What *is* worth fixing is **category balance** — see Workstream 7 for the measured numbers and three options.

**Your list skips number 6.** Nothing is planned for it. If something was meant to go there, say so.

## Global Constraints

- Comments explain **why**, in full sentences. No em dashes anywhere in code or copy.
- Commits are authored `Michael Pink <mpink2491@gmail.com>` with **no** Claude co-author trailer.
- Object `id` values are permanent keys. `dailySchedule.json` and every player's `localStorage` reference them. **Never rename an id.** Renaming a `name` is fine.
- `dailySchedule.json` is append-only. Never edit or reorder an existing entry.
- Every task ends with `npx tsc --noEmit -p tsconfig.app.json`, `npx tsc --noEmit -p functions/tsconfig.json`, `npx vitest run`, and `npm run build` all passing.
- Verification scripts must **write a diff for human review first** and only apply changes on an explicit `--apply` flag. Never let a script silently rewrite the dataset.
- CDS services (SIMBAD, VizieR) rate-limit aggressively and return `TAP service too busy`. Every fetch needs retry-with-backoff and must cache responses to `scripts/.cache/` so a rerun does not re-hit the network.

---

## Workstream 1: Dataset-wide currency pass

**Goal:** Every object in every category has a verified name, distance, and discovery year, not just stars.

**Current state.** Stars had a currency pass on 2026-08-22: 8 renamed to current IAU names, 12 distances corrected against SIMBAD parallaxes, 3 temperatures corrected. **No other category has been verified this way.** Diameter and mass are unverified for all 86 stars because VizieR was down.

Coverage by category, and the authority for each:

| Category | Count | Name authority | Distance authority | Discovered authority |
|---|---|---|---|---|
| star | 86 | IAU-CSN (WGSN) | SIMBAD parallax | convention, see below |
| constellation | 88 | IAU (fixed, 88) | derived from brightest star | constellation introduction year |
| moon | 33 | IAU WGPSN | derived from parent | JPL/MPC discovery record |
| asteroid | 15 | IAU WGSBN | JPL SBDB `a` | MPC discovery circumstances |
| comet | 7 | IAU WGSBN | JPL SBDB `a` | MPC discovery circumstances |
| exoplanet | 13 | NASA Exoplanet Archive | NASA Exoplanet Archive `sy_dist` | Exoplanet Archive `disc_year` |
| galaxy | 12 | NED / SIMBAD | NED redshift-independent | discovery paper |
| nebula | 11 | SIMBAD | SIMBAD | discovery paper |
| black_hole | 11 | SIMBAD | SIMBAD | discovery paper |
| quasar | 9 | SIMBAD | derived from redshift | discovery paper |
| planet | 8 | fixed | fixed | prehistoric or 1781/1846 |
| dwarf_planet | 5 | IAU | JPL SBDB | MPC |

**The `discoveredYear` honesty problem.** For 85 of 86 stars this column is a *convention I invented*, not a fact: 47 stars carry `150` because Ptolemy catalogued them, 38 carry the year their constellation was introduced, and only Proxima Centauri (1915) has a real discovery year. Naked-eye stars were never discovered. The same will be true of the 88 constellations. This is defensible but it must be **stated in the UI**, not just in a code comment, or the column silently teaches players something false.

**Decision needed before Task 1.4:** either (a) relabel the column "First recorded" for naked-eye objects and add a line to How to Play explaining the convention, or (b) drop `discoveredYear` from the star and constellation profiles entirely and keep it only for telescopic objects where it is a real fact. Recommendation: **(a)** — it keeps a comparison axis that works across all categories, and one sentence of copy fixes the honesty issue.

### Task 1.1: Cacheing fetch helper

**Files:**
- Create: `scripts/lib/fetchCache.mjs`
- Test: `scripts/lib/fetchCache.test.mjs`

**Interfaces:**
- Produces: `cachedFetch(url, {retries=5, baseDelayMs=2000}) -> Promise<string>` — returns response body as text, caches to `scripts/.cache/<sha256(url)>.txt`, retries on non-2xx and on a body containing `TAP service too busy`.

- [x] **Step 1: Write the failing test**

```js
import { describe, it, expect, beforeEach } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { cachedFetch, CACHE_DIR } from "./fetchCache.mjs"

describe("cachedFetch", () => {
  beforeEach(() => { fs.rmSync(CACHE_DIR, { recursive: true, force: true }) })

  it("returns the body and writes it to the cache", async () => {
    let calls = 0
    const fakeFetch = async () => { calls++; return { ok: true, status: 200, text: async () => "hello" } }
    const body = await cachedFetch("https://example.test/a", { fetchImpl: fakeFetch })
    expect(body).toBe("hello")
    expect(calls).toBe(1)
    expect(fs.readdirSync(CACHE_DIR).length).toBe(1)
  })

  it("serves the second call from cache without refetching", async () => {
    let calls = 0
    const fakeFetch = async () => { calls++; return { ok: true, status: 200, text: async () => "hello" } }
    await cachedFetch("https://example.test/a", { fetchImpl: fakeFetch })
    const body = await cachedFetch("https://example.test/a", { fetchImpl: fakeFetch })
    expect(body).toBe("hello")
    expect(calls).toBe(1)
  })

  it("retries when the body reports the TAP service is busy, then succeeds", async () => {
    let calls = 0
    const fakeFetch = async () => {
      calls++
      if (calls < 3) return { ok: true, status: 200, text: async () => "TAP service too busy!" }
      return { ok: true, status: 200, text: async () => "{\"data\":[]}" }
    }
    const body = await cachedFetch("https://example.test/b", { fetchImpl: fakeFetch, baseDelayMs: 1 })
    expect(body).toBe("{\"data\":[]}")
    expect(calls).toBe(3)
  })

  it("throws after exhausting retries", async () => {
    const fakeFetch = async () => ({ ok: false, status: 503, text: async () => "nope" })
    await expect(
      cachedFetch("https://example.test/c", { fetchImpl: fakeFetch, retries: 2, baseDelayMs: 1 })
    ).rejects.toThrow(/503/)
  })
})
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/lib/fetchCache.test.mjs`
Expected: FAIL, "Failed to resolve import ./fetchCache.mjs"

- [x] **Step 3: Write minimal implementation**

```js
import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const CACHE_DIR = path.join(HERE, "..", ".cache")

// CDS returns HTTP 200 with a busy message in the body rather than a 503, so the retry has to look
// at the payload and not just the status code.
const BUSY = "TAP service too busy"

const sleep = ms => new Promise(r => setTimeout(r, ms))

export async function cachedFetch(url, opts = {}) {
  const { retries = 5, baseDelayMs = 2000, fetchImpl = fetch } = opts
  const key = crypto.createHash("sha256").update(url).digest("hex")
  const file = path.join(CACHE_DIR, key + ".txt")
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8")

  let lastError = "unknown"
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetchImpl(url)
    const body = res.ok ? await res.text() : null
    if (body !== null && !body.includes(BUSY)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true })
      fs.writeFileSync(file, body)
      return body
    }
    lastError = res.ok ? "service busy" : "HTTP " + res.status
    // Exponential backoff, because hammering a congested service makes it worse for everyone.
    if (attempt < retries - 1) await sleep(baseDelayMs * 2 ** attempt)
  }
  throw new Error("cachedFetch failed for " + url + ": " + lastError)
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run scripts/lib/fetchCache.test.mjs`
Expected: PASS, 4 tests

- [x] **Step 5: Add the cache to .gitignore and commit**

```bash
printf '\n# Cached catalogue responses used by the dataset verification scripts\nscripts/.cache/\n' >> .gitignore
git add scripts/lib/fetchCache.mjs scripts/lib/fetchCache.test.mjs .gitignore
git commit -m "feat: add a caching, backing-off fetch helper for catalogue queries"
```

### Task 1.2: Report-then-apply harness

**Files:**
- Create: `scripts/lib/datasetDiff.mjs`
- Test: `scripts/lib/datasetDiff.test.mjs`

**Interfaces:**
- Consumes: nothing from Task 1.1.
- Produces:
  - `proposeChange(list, {id, field, from, to, reason, source})` — pushes onto `list`.
  - `renderReport(list) -> string` — a human-readable table.
  - `applyChanges(datasetPath, list) -> number` — writes them, returns the count applied.

- [x] **Step 1: Write the failing test**

```js
import { describe, it, expect } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { proposeChange, renderReport, applyChanges } from "./datasetDiff.mjs"

describe("datasetDiff", () => {
  it("renders a report naming the field, both values, and the source", () => {
    const list = []
    proposeChange(list, { id: "vega", field: "distanceFromEarthLy", from: 25, to: 25.04, reason: "parallax", source: "SIMBAD" })
    const report = renderReport(list)
    expect(report).toContain("vega")
    expect(report).toContain("distanceFromEarthLy")
    expect(report).toContain("25")
    expect(report).toContain("25.04")
    expect(report).toContain("SIMBAD")
  })

  it("says so plainly when nothing needs changing", () => {
    expect(renderReport([])).toContain("no changes")
  })

  it("applies changes to the dataset file and returns the count", () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ds-")), "d.json")
    fs.writeFileSync(file, JSON.stringify([{ id: "vega", distanceFromEarthLy: 25 }]))
    const list = []
    proposeChange(list, { id: "vega", field: "distanceFromEarthLy", from: 25, to: 25.04, reason: "parallax", source: "SIMBAD" })
    expect(applyChanges(file, list)).toBe(1)
    expect(JSON.parse(fs.readFileSync(file, "utf8"))[0].distanceFromEarthLy).toBe(25.04)
  })

  it("refuses to apply a change whose current value no longer matches", () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ds-")), "d.json")
    fs.writeFileSync(file, JSON.stringify([{ id: "vega", distanceFromEarthLy: 99 }]))
    const list = []
    proposeChange(list, { id: "vega", field: "distanceFromEarthLy", from: 25, to: 25.04, reason: "parallax", source: "SIMBAD" })
    expect(() => applyChanges(file, list)).toThrow(/vega/)
  })
})
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/lib/datasetDiff.test.mjs`
Expected: FAIL, module not found

- [x] **Step 3: Write minimal implementation**

```js
import fs from "node:fs"

export function proposeChange(list, change) {
  list.push(change)
  return list
}

export function renderReport(list) {
  if (list.length === 0) return "no changes proposed"
  const lines = list.map(
    c => `${c.id}.${c.field}: ${c.from} -> ${c.to}  (${c.reason}; source: ${c.source})`
  )
  return lines.join("\n") + `\n\n${list.length} change(s) proposed`
}

// The staleness guard matters because a report may be reviewed hours after it was generated, and
// applying a change whose starting value has since moved would silently clobber the newer value.
export function applyChanges(datasetPath, list) {
  const data = JSON.parse(fs.readFileSync(datasetPath, "utf8"))
  for (const c of list) {
    const obj = data.find(o => o.id === c.id)
    if (!obj) throw new Error("applyChanges: no object with id " + c.id)
    if (obj[c.field] !== c.from) {
      throw new Error(
        `applyChanges: ${c.id}.${c.field} is ${obj[c.field]}, expected ${c.from}; regenerate the report`
      )
    }
  }
  for (const c of list) data.find(o => o.id === c.id)[c.field] = c.to
  fs.writeFileSync(datasetPath, JSON.stringify(data, null, 2) + "\n")
  return list.length
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run scripts/lib/datasetDiff.test.mjs`
Expected: PASS, 4 tests

- [x] **Step 5: Commit**

```bash
git add scripts/lib/datasetDiff.mjs scripts/lib/datasetDiff.test.mjs
git commit -m "feat: add a report-then-apply harness for dataset verification"
```

### Task 1.3: Verify small bodies against JPL SBDB

**Files:**
- Create: `scripts/verify-small-bodies.mjs`
- Modify: `package.json` (add `"verify:small-bodies"` script)

JPL's Small-Body Database has no rate limit worth worrying about and returns clean JSON:
`https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=<designation>&phys-par=1&discovery=1`

It gives semi-major axis `a` (AU), diameter, rotation period, absolute magnitude, and the discovery circumstances including year. That covers `distanceFromSunAU`, `diameterKm`, `rotationPeriodHours` and `discoveredYear` for all 15 asteroids, 7 comets and 5 dwarf planets in one pass.

- [x] **Step 1: Write the script**

```js
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { cachedFetch } from "./lib/fetchCache.mjs"
import { proposeChange, renderReport, applyChanges } from "./lib/datasetDiff.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DATASET = path.join(ROOT, "src/data/celestialObjects.json")

// SBDB wants the designation a body is catalogued under, which is not always the display name.
const LOOKUP = {
  vesta: "4", pallas: "2", juno_asteroid: "3", hygiea: "10", interamnia: "704",
  eunomia: "15", davida: "511", lutetia: "21", psyche: "16", ida: "243",
  eros: "433", bennu: "101955", ryugu: "162173", apophis: "99942", itokawa: "25143",
  halley: "1P", encke: "2P", swift_tuttle: "109P", hyakutake: "C/1996 B2",
  hale_bopp: "C/1995 O1", neowise: "C/2020 F3", chiron: "95P",
  ceres: "1", pluto: "134340", eris: "136199", haumea: "136108", makemake: "136472",
}

const TOLERANCE = { distanceFromSunAU: 0.02, diameterKm: 0.05, rotationPeriodHours: 0.02 }

const dataset = JSON.parse(fs.readFileSync(DATASET, "utf8"))
const changes = []

for (const [id, sstr] of Object.entries(LOOKUP)) {
  const obj = dataset.find(o => o.id === id)
  if (!obj) { console.error("no such object: " + id); continue }
  const url = `https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=${encodeURIComponent(sstr)}&phys-par=1&discovery=1`
  const json = JSON.parse(await cachedFetch(url))

  const a = Number(json.orbit?.elements?.find(e => e.name === "a")?.value)
  if (Number.isFinite(a)) compare(obj, "distanceFromSunAU", a, "SBDB orbit element a")

  const phys = Object.fromEntries((json.phys_par ?? []).map(p => [p.name, Number(p.value)]))
  if (Number.isFinite(phys.diameter)) compare(obj, "diameterKm", phys.diameter, "SBDB phys_par diameter")
  if (Number.isFinite(phys.rot_per)) compare(obj, "rotationPeriodHours", phys.rot_per, "SBDB phys_par rot_per")

  const year = Number(String(json.discovery?.date ?? "").slice(0, 4))
  if (Number.isFinite(year) && year > 1500 && obj.discoveredYear !== year) {
    proposeChange(changes, { id, field: "discoveredYear", from: obj.discoveredYear, to: year, reason: "SBDB discovery date", source: "JPL SBDB" })
  }
}

function compare(obj, field, value, reason) {
  const current = obj[field]
  if (typeof current !== "number") return
  const rel = Math.abs(value - current) / Math.max(Math.abs(value), 1e-9)
  if (rel <= (TOLERANCE[field] ?? 0.05)) return
  proposeChange(changes, { id: obj.id, field, from: current, to: Number(value.toPrecision(6)), reason, source: "JPL SBDB" })
}

console.log(renderReport(changes))
if (process.argv.includes("--apply")) console.log("applied " + applyChanges(DATASET, changes))
```

- [x] **Step 2: Register the npm script**

In `package.json` `"scripts"`, add:

```json
"verify:small-bodies": "node scripts/verify-small-bodies.mjs"
```

- [x] **Step 3: Run the report and read it**

Run: `npm run verify:small-bodies`
Expected: a list of proposed changes, or "no changes proposed". **Read every line before applying.** SBDB diameters for comets are nucleus diameters and can legitimately differ from a published figure; reject anything you cannot justify.

- [x] **Step 4: Apply and verify**

Run: `npm run verify:small-bodies -- --apply && npx vitest run && npm run build`
Expected: all pass

- [x] **Step 5: Commit**

```bash
git add scripts/verify-small-bodies.mjs package.json src/data/celestialObjects.json
git commit -m "feat: verify asteroid, comet and dwarf planet data against JPL SBDB"
```

### Task 1.4: Verify exoplanets against the NASA Exoplanet Archive

**Files:**
- Create: `scripts/verify-exoplanets.mjs`
- Modify: `package.json`

The archive has a TAP endpoint that is far more reliable than CDS:
`https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=<ADQL>&format=json`

The `pscomppars` table carries one composite row per planet with `pl_rade`, `pl_bmasse`, `pl_orbper`, `pl_eqt`, `sy_dist` (parsecs) and `disc_year` — every field the exoplanet profile shows.

- [x] **Step 1: Write the script**

```js
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { cachedFetch } from "./lib/fetchCache.mjs"
import { proposeChange, renderReport, applyChanges } from "./lib/datasetDiff.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DATASET = path.join(ROOT, "src/data/celestialObjects.json")

const NAMES = {
  proxima_centauri_b: "Proxima Cen b", trappist_1e: "TRAPPIST-1 e", kepler_452b: "Kepler-452 b",
  "51_pegasi_b": "51 Peg b", hd_209458_b: "HD 209458 b", kepler_16b: "Kepler-16 b",
  wasp_12b: "WASP-12 b", "55_cancri_e": "55 Cnc e", kepler_186f: "Kepler-186 f",
  gj1214b: "GJ 1214 b", hr8799b: "HR 8799 b", gliese667cc: "GJ 667 C c", toi700d: "TOI-700 d",
}

const EARTH_RADIUS_KM = 6371
const EARTH_MASS_KG = 5.972e24
const LY_PER_PC = 3.2615638

const dataset = JSON.parse(fs.readFileSync(DATASET, "utf8"))
const changes = []
const quoted = Object.values(NAMES).map(n => `'${n.replace(/'/g, "''")}'`).join(",")
const adql = `select pl_name,pl_rade,pl_bmasse,pl_orbper,pl_eqt,sy_dist,disc_year from pscomppars where pl_name in (${quoted})`
const url = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?format=json&query=" + encodeURIComponent(adql)
const rows = JSON.parse(await cachedFetch(url))
const byName = new Map(rows.map(r => [r.pl_name, r]))

for (const [id, plName] of Object.entries(NAMES)) {
  const obj = dataset.find(o => o.id === id)
  const row = byName.get(plName)
  if (!obj || !row) { console.error("unmatched: " + id + " / " + plName); continue }
  compare(obj, "diameterKm", row.pl_rade * 2 * EARTH_RADIUS_KM, "pl_rade")
  compare(obj, "massKg", row.pl_bmasse * EARTH_MASS_KG, "pl_bmasse")
  compare(obj, "orbitalPeriodDays", row.pl_orbper, "pl_orbper")
  compare(obj, "temperatureK", row.pl_eqt, "pl_eqt")
  compare(obj, "distanceFromEarthLy", row.sy_dist * LY_PER_PC, "sy_dist")
  if (row.disc_year && obj.discoveredYear !== row.disc_year) {
    proposeChange(changes, { id, field: "discoveredYear", from: obj.discoveredYear, to: row.disc_year, reason: "disc_year", source: "NASA Exoplanet Archive" })
  }
}

function compare(obj, field, value, reason) {
  if (!Number.isFinite(value) || typeof obj[field] !== "number") return
  const rel = Math.abs(value - obj[field]) / Math.max(Math.abs(value), 1e-9)
  if (rel <= 0.05) return
  proposeChange(changes, { id: obj.id, field, from: obj[field], to: Number(value.toPrecision(6)), reason, source: "NASA Exoplanet Archive" })
}

console.log(renderReport(changes))
if (process.argv.includes("--apply")) console.log("applied " + applyChanges(DATASET, changes))
```

- [x] **Step 2: Register the npm script**

```json
"verify:exoplanets": "node scripts/verify-exoplanets.mjs"
```

- [x] **Step 3: Run the report and read it**

Run: `npm run verify:exoplanets`
Expected: proposed changes listed. Note `pl_eqt` is often null; nulls are skipped by the `Number.isFinite` guard.

- [x] **Step 4: Apply and verify**

Run: `npm run verify:exoplanets -- --apply && npx vitest run && npm run build`

- [x] **Step 5: Commit**

```bash
git add scripts/verify-exoplanets.mjs package.json src/data/celestialObjects.json
git commit -m "feat: verify exoplanet data against the NASA Exoplanet Archive"
```

### Task 1.5: Finish the star pass (diameter and mass)

**Files:**
- Create: `scripts/verify-star-sizes.mjs`
- Modify: `package.json`

This is the item left unfinished on 2026-08-22. Two independent checks, because neither alone is conclusive:

1. **Catalogue cross-check** against TIC v8 (`IV/38/tic`) via VizieR, keyed on HIP number. Note VizieR rejects `SELECT HIP, Rad, Mass` with "ambiguous column name" because of case-insensitive collisions with `e_Rad`/`E_Rad`; use `SELECT *` and index the columns client-side from the returned `metadata` array.
2. **Physical closure**, which needs no network at all. Stefan-Boltzmann gives luminosity from radius and temperature; with the verified distance that predicts an apparent magnitude, which must match the stored one. A radius wrong by 2x shows up as a ~1.5 magnitude discrepancy, far above the ~0.3 mag uncertainty of the bolometric correction.

```js
// Torres (2010) bolometric correction, a polynomial in log10(Teff).
export function bolometricCorrection(teff) {
  const x = Math.log10(teff)
  const poly = c => c.reduce((sum, k, i) => sum + k * x ** i, 0)
  if (x < 3.7) return poly([-19053.7291496456, 15514.4866764412, -4212.78819301717, 381.476328422343])
  if (x < 3.9) return poly([-37051.0203809015, 38567.2629965804, -15065.1486316025, 2617.24637119416, -170.623810323864])
  return poly([-118115.450538963, 137145.973583929, -63623.3812100225, 14741.2923562646, -1705.87278406872, 78.8731721804990])
}

// Predicted apparent V magnitude from radius, temperature and distance.
export function predictedMagnitude({ radiusSolar, teff, distanceLy }) {
  const luminositySolar = radiusSolar ** 2 * (teff / 5772) ** 4
  const bolometricAbsolute = 4.74 - 2.5 * Math.log10(luminositySolar)
  const visualAbsolute = bolometricAbsolute - bolometricCorrection(teff)
  const distanceParsecs = distanceLy / 3.2615638
  return visualAbsolute + 5 * Math.log10(distanceParsecs) - 5
}
```

- [x] **Step 1: Write the failing test**

Create `scripts/verify-star-sizes.test.mjs`:

```js
import { describe, it, expect } from "vitest"
import { predictedMagnitude, bolometricCorrection } from "./verify-star-sizes.mjs"

describe("predictedMagnitude", () => {
  it("reproduces the Sun's apparent magnitude from its own radius, temperature and distance", () => {
    // One solar radius, one solar Teff, one astronomical unit expressed in light years.
    const m = predictedMagnitude({ radiusSolar: 1, teff: 5772, distanceLy: 1.58125e-5 })
    expect(m).toBeCloseTo(-26.7, 0)
  })

  it("reproduces Vega, which is 2.36 solar radii at 9600 K and 25 ly", () => {
    expect(predictedMagnitude({ radiusSolar: 2.36, teff: 9600, distanceLy: 25 })).toBeCloseTo(0.03, 0)
  })

  it("gets dimmer as the star gets further away", () => {
    const near = predictedMagnitude({ radiusSolar: 1, teff: 5772, distanceLy: 10 })
    const far = predictedMagnitude({ radiusSolar: 1, teff: 5772, distanceLy: 100 })
    expect(far).toBeGreaterThan(near)
  })

  it("returns a finite bolometric correction across the whole temperature range in the dataset", () => {
    for (const teff of [3000, 3600, 5000, 5772, 9600, 14000, 24000, 40000]) {
      expect(Number.isFinite(bolometricCorrection(teff))).toBe(true)
    }
  })
})
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/verify-star-sizes.test.mjs`
Expected: FAIL, module not found

- [x] **Step 3: Implement the module and the report**

Export `bolometricCorrection` and `predictedMagnitude` exactly as written above, then add the report body: for each star compute `radiusSolar = diameterKm / 1391000`, call `predictedMagnitude`, and flag any star where `|predicted - apparentMagnitude| > 0.75`. Guard the whole report body behind `if (import.meta.url === pathToFileURL(process.argv[1]).href)` so importing the module in a test does not run the report.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run scripts/verify-star-sizes.test.mjs`
Expected: PASS, 4 tests

- [x] **Step 5: Run the report and triage**

Run: `npm run verify:star-sizes`

Expect genuine outliers for stars with strong interstellar extinction (Naos, Arneb, Deneb sit behind dust that makes them look fainter than predicted) and for the coolest supergiants where the bolometric correction is largest. **Do not blind-apply.** Cross-check each flagged star against TIC before changing it.

- [x] **Step 6: Commit**

```bash
git add scripts/verify-star-sizes.mjs scripts/verify-star-sizes.test.mjs package.json
git commit -m "feat: check star radii by closing luminosity against observed magnitude"
```

### Task 1.6: Make the Discovered convention honest in the UI

Depends on the decision recorded above. Assuming option (a):

**Files:**
- Modify: `src/lib/objectProfiles.ts` (the `discoveredYear` label in `STAR_PROFILE` and `CONSTELLATION_PROFILE`)
- Modify: `src/components/HowToPlayModal.tsx`

- [x] **Step 1: Relabel the column for naked-eye categories**

In `STAR_PROFILE` and `CONSTELLATION_PROFILE` only, change `label: "Discovered"` to `label: "First Recorded"`. Leave galaxy, nebula, black hole, quasar and exoplanet profiles as "Discovered", because for those it is a real discovery.

- [x] **Step 2: Add the explanation to How to Play**

Insert a new panel after the Hints panel:

```tsx
<div className="mb-4 rounded-lg border border-[#e0e0e0] bg-[#fff8e7] p-3 text-sm text-[#4d4d4d]">
  <div className="mb-2 text-sm font-bold uppercase tracking-wide text-[#4d4d4d]">Dates</div>
  <p>
    Telescopic objects show the year they were discovered. Stars and constellations you can see with
    the naked eye were never discovered, so they show the earliest catalogue that records them
    instead: AD 150 for anything in Ptolemy's Almagest, otherwise the year their constellation was
    introduced. A few objects, like the Sun and the naked-eye planets, have no first record at all
    and simply read Prehistoric.
  </p>
</div>
```

- [x] **Step 3: Verify and commit**

```bash
npx tsc --noEmit -p tsconfig.app.json && npx vitest run && npm run build
git add src/lib/objectProfiles.ts src/components/HowToPlayModal.tsx
git commit -m "feat: say plainly that naked-eye dates are first records, not discoveries"
```

---

## Workstream 2: Full dataset audit

**Goal:** A test that fails if any object in the dataset is internally inconsistent, so errors cannot creep back in.

**Current state.** `src/data/celestialObjects.test.ts` already enforces id uniqueness, profile completeness, the 88 constellations, and that every constellation's brightest star exists and has a matching magnitude. It does **not** check physics.

The 2026-08-22 pass found these by hand; each becomes a permanent test so it can never regress:

| Error found | Rule that would have caught it |
|---|---|
| Cygnus X-1 event horizon 700x too large | Schwarzschild diameter must match mass to within 5% for black holes |
| Hale-Bopp mass implying 115 g/cm3 | small-body density must be 0.1 to 9 g/cm3 |
| Four comets sharing Halley's 68 K | temperature must be within 40% of the equilibrium temperature at semi-major axis |
| Quasar distance not monotonic in redshift | sorting quasars by redshift must also sort them by distance |
| Bennu at 100 K, Vesta at 85 K | same equilibrium temperature rule |

### Task 2.1: Physical consistency tests

**Files:**
- Modify: `src/data/celestialObjects.test.ts`

**Interfaces:**
- Consumes: `dataset` and `getComparableValue` already imported by that file.

- [x] **Step 1: Write the failing tests**

```ts
const SCHWARZSCHILD_KM_PER_KG = 2.9706e-30
const G = 6.674e-11

describe("physical consistency", () => {
  it("gives every black hole an event horizon that matches its mass", () => {
    const wrong = (dataset as CelestialObject[])
      .filter(o => o.category === "black_hole" && o.massKg && o.diameterKm)
      .map(o => ({ id: o.id, expected: SCHWARZSCHILD_KM_PER_KG * o.massKg!, actual: o.diameterKm! }))
      .filter(x => Math.abs(x.actual - x.expected) / x.expected > 0.05)
    expect(wrong).toEqual([])
  })

  it("keeps every solid body at a physically possible density", () => {
    const wrong = (dataset as CelestialObject[])
      .filter(o => ["planet", "dwarf_planet", "moon", "asteroid", "comet"].includes(o.category))
      .filter(o => o.massKg && o.diameterKm)
      .map(o => {
        const radiusCm = (o.diameterKm! * 1e5) / 2
        return { id: o.id, density: (o.massKg! * 1000) / ((4 / 3) * Math.PI * radiusCm ** 3) }
      })
      .filter(x => x.density < 0.1 || x.density > 9)
    expect(wrong).toEqual([])
  })

  it("keeps sun-orbiting bodies near their equilibrium temperature", () => {
    const wrong = (dataset as CelestialObject[])
      .filter(o => ["asteroid", "comet"].includes(o.category))
      .filter(o => o.distanceFromSunAU && o.temperatureK)
      .map(o => ({ id: o.id, stated: o.temperatureK!, equilibrium: 278.6 / Math.sqrt(o.distanceFromSunAU!) }))
      .filter(x => Math.abs(x.stated - x.equilibrium) / x.equilibrium > 0.4)
    expect(wrong).toEqual([])
  })

  it("orders quasars by distance the same way redshift orders them", () => {
    const quasars = (dataset as CelestialObject[])
      .filter(o => o.category === "quasar" && o.redshift != null && o.distanceFromEarthLy != null)
      .sort((a, b) => a.redshift! - b.redshift!)
    const distances = quasars.map(q => q.distanceFromEarthLy!)
    const sorted = [...distances].sort((a, b) => a - b)
    expect(distances).toEqual(sorted)
  })

  it("keeps stated surface gravity consistent with mass and radius", () => {
    const wrong = (dataset as CelestialObject[])
      .filter(o => o.massKg && o.diameterKm && o.gravityMs2)
      .filter(o => !["saturn", "haumea"].includes(o.id)) // strongly oblate, published g uses equatorial radius
      .map(o => {
        const r = (o.diameterKm! * 1000) / 2
        return { id: o.id, stated: o.gravityMs2!, derived: (G * o.massKg!) / (r * r) }
      })
      .filter(x => Math.abs(x.stated - x.derived) / x.derived > 0.3)
    expect(wrong).toEqual([])
  })

  it("orders orbital periods the way semi-major axis does, per Kepler's third law", () => {
    const wrong = (dataset as CelestialObject[])
      .filter(o => ["asteroid", "comet", "dwarf_planet", "planet"].includes(o.category))
      .filter(o => o.distanceFromSunAU && o.orbitalPeriodDays)
      .map(o => ({
        id: o.id,
        stated: o.orbitalPeriodDays!,
        kepler: Math.pow(o.distanceFromSunAU!, 1.5) * 365.25,
      }))
      .filter(x => Math.abs(x.stated - x.kepler) / x.kepler > 0.05)
    expect(wrong).toEqual([])
  })
})
```

- [x] **Step 2: Run the tests**

Run: `npx vitest run src/data/celestialObjects.test.ts`
Expected: **may legitimately fail.** Every failure is either a real dataset error to fix or a documented exception to add to the filter, exactly like `saturn` and `haumea` above. Fix the data first; only add an exception when you can write down why the physics genuinely does not apply.

- [x] **Step 3: Commit**

```bash
git add src/data/celestialObjects.test.ts src/data/celestialObjects.json
git commit -m "test: fail the build when dataset values contradict physics"
```

### Task 2.2: Cross-category comparison audit

**Files:**
- Modify: `src/data/celestialObjects.test.ts`

Because a guess of any object is compared against an answer of any category, `getComparableValue` invents derived values. A test should assert that no comparison ever produces a value that is absurd for its field.

- [x] **Step 1: Write the failing test**

```ts
it("never derives a nonsensical value for any guess against any answer", () => {
  const objects = dataset as CelestialObject[]
  const problems: string[] = []
  const BOUNDS: Record<string, [number, number]> = {
    distanceFromEarthLy: [0, 1e11],
    diameterKm: [0, 1e19],
    massKg: [1e10, 1e45],
    temperatureK: [0, 1e6],
    gravityMs2: [0, 1e14],
    orbitalPeriodDays: [0, 1e9],
  }
  for (const obj of objects) {
    for (const [field, [lo, hi]] of Object.entries(BOUNDS)) {
      const v = getComparableValue(obj, field, objects)
      if (typeof v !== "number") continue
      if (!Number.isFinite(v) || v < lo || v > hi) problems.push(`${obj.id}.${field} = ${v}`)
    }
  }
  expect(problems).toEqual([])
})
```

- [x] **Step 2: Run, fix, commit**

Run: `npx vitest run src/data/celestialObjects.test.ts`

```bash
git add src/data/celestialObjects.test.ts
git commit -m "test: bound every derived comparison value"
```

---

## Workstream 3: Every picture shows its own object

**Goal:** No object ever shows a picture of something else.

**Current state after 2026-08-22.** All 88 constellations use their IAU chart. Seven bodies were given real spacecraft imagery. 80 objects had their `imageUrl` removed and fall back to the generated portrait. The bug class was images of *the thing an object is named after*: Cancer showed a tumour, Bennu the Egyptian bird, Charon a Greek vase, Peacock a peacock, Dalim a software company's logo.

**Still unresolved:** 80 objects have no picture at all and rely on the generated portrait. For moons, asteroids and dwarf planets, a real photograph exists for most and would be much better than a coloured circle.

### Task 3.1: A test that catches the naming-collision bug class

**Files:**
- Modify: `src/data/celestialObjects.test.ts`

- [x] **Step 1: Write the failing test**

```ts
it("never points an object at a picture of the thing it is named after", () => {
  // Every one of these words appeared in a real wrong image in this dataset.
  const BANNED = [
    "deity", "god", "mytholog", "statue", "vase", "lekythos", "herm", "painting",
    "fresco", "sculpture", "logo", "software", "bird", "collage", "plumage",
    "tumor", "tumour", "mesothelioma", "crater_aerial", "emblem", "alciato", "farnese",
  ]
  const problems = (dataset as CelestialObject[])
    .filter(o => o.imageUrl)
    .filter(o => BANNED.some(w => decodeURIComponent(o.imageUrl!).toLowerCase().includes(w)))
    .map(o => `${o.id}: ${decodeURIComponent(o.imageUrl!)}`)
  expect(problems).toEqual([])
})

it("gives every constellation its IAU chart and nothing else", () => {
  const problems = (dataset as CelestialObject[])
    .filter(o => o.category === "constellation")
    .filter(o => !/_IAU\.svg/i.test(o.imageUrl ?? ""))
    .map(o => o.id)
  expect(problems).toEqual([])
})

it("never gives a star or black hole a sky chart in place of the object", () => {
  const problems = (dataset as CelestialObject[])
    .filter(o => ["star", "black_hole"].includes(o.category))
    .filter(o => /constellation_map|_IAU\.svg/i.test(o.imageUrl ?? ""))
    .map(o => o.id)
  expect(problems).toEqual([])
})
```

- [x] **Step 2: Run, then commit**

Run: `npx vitest run src/data/celestialObjects.test.ts`
Expected: PASS, since the 2026-08-22 pass already cleared all three

```bash
git add src/data/celestialObjects.test.ts
git commit -m "test: reject images of the thing an object is named after"
```

### Task 3.2: Backfill real imagery where it exists

**Done, and the answer was to change nothing.** `scripts/audit-images.mjs` ran over the 84 objects with
no picture: 82 stars, Apophis and Cygnus X-1. Every lead image the API offered was a constellation chart
or a planetarium screenshot, because a star is a point source and no honest photograph of one exists.
The generated portrait stays.

**Files:**
- Create: `scripts/audit-images.mjs`
- Modify: `src/data/celestialObjects.json`

Use the Wikipedia REST summary API, which returns the article's lead image and is not rate-limited the way CDS is:
`https://en.wikipedia.org/api/rest_v1/page/summary/<title>`

- [x] **Step 1: Write the audit script**

For every object with no `imageUrl`, fetch its article summary via `cachedFetch`, and print a table of `id`, proposed URL, and the filename. **Do not auto-apply.** The whole point of this workstream is that the lead image is often wrong, which is how the bug arose in the first place.

- [x] **Step 2: Review each proposal by eye**

Open each proposed URL. Reject anything that is a sky chart, a diagram, a light curve, a person, or an artwork. Accept only a photograph or a rendering of the object itself.

- [x] **Step 3: Verify every accepted URL returns HTTP 200**

```bash
curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" --retry 4 --retry-delay 2 --retry-all-errors -A cosmodle "<url>"
```

- [x] **Step 4: Apply, verify, commit**

```bash
npx vitest run && npm run build
git add scripts/audit-images.mjs src/data/celestialObjects.json
git commit -m "feat: give bodies with a real photograph their own picture"
```

---

## Workstream 4: Footer link (already done)

**No work required.** `src/components/Footer.tsx:7-12` already links `michael-pink.com`.

If what you actually want is for it to be more prominent, the options are:
- Make it the only footer item and move Global Stats into the header next to the help button.
- Add "built by Michael Pink" as label text before the link.
- Give it the teal accent permanently rather than only on hover.

**Say which, if any.** Otherwise skip this workstream entirely.

---

## Workstream 5: Ads readiness

**Blocked: needs a decision from you.** Nothing here can be planned to step level until you answer:

1. **Which network?** AdSense is the default for a site this size. Alternatives are Ezoic and Mediavine, which have traffic minimums (Mediavine wants 50k sessions/month) that Cosmodle probably does not meet yet.
2. **Where do ads go?** A leaderboard above the header, a rectangle under the guess table, and an interstitial in the result modal are the three plausible slots. The result modal is worth the most and annoys players the most.
3. **Do paying-attention players get an ad-free option?** If yes, that is a whole separate authentication and payments workstream, not this one.

**What can be done now regardless of the answer** is the part that is hard to retrofit:

### Task 5.1: Consent and privacy groundwork

Ad networks in the EU and UK require a certified Consent Management Platform before serving personalised ads. This is legally required, not optional, and it must exist before the first ad tag loads.

**Files:**
- Create: `src/components/ConsentBanner.tsx`
- Create: `src/lib/consent.ts`
- Create: `src/lib/consent.test.ts`
- Modify: `src/components/GameBoard.tsx`

**Interfaces:**
- Produces:
  - `getConsent(): "granted" | "denied" | "unset"`
  - `setConsent(value: "granted" | "denied"): void`
  - `<ConsentBanner onDecision={(v) => void} />`

Note the existing privacy posture this must not break: `getOrCreatePlayerId()` already stores a random UUID in `localStorage` and posts it to your own D1. That is first-party and does not itself need consent, but the banner copy must describe it accurately.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach } from "vitest"
import { getConsent, setConsent } from "./consent"

describe("consent", () => {
  beforeEach(() => localStorage.clear())

  it("starts unset so nothing is assumed on a first visit", () => {
    expect(getConsent()).toBe("unset")
  })

  it("remembers a granted decision across reloads", () => {
    setConsent("granted")
    expect(getConsent()).toBe("granted")
  })

  it("remembers a denied decision, which must never silently decay to granted", () => {
    setConsent("denied")
    expect(getConsent()).toBe("denied")
  })

  it("treats a corrupted stored value as unset rather than trusting it", () => {
    localStorage.setItem("cosmodle:consent", "{{{")
    expect(getConsent()).toBe("unset")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/consent.test.ts`
Expected: FAIL, module not found

- [ ] **Step 3: Implement**

```ts
export type Consent = "granted" | "denied" | "unset"

const KEY = "cosmodle:consent"

// An unreadable or unrecognised value means we have no valid record of a decision, and the only safe
// reading of that is that the player has not made one. Never fall back to granted.
export function getConsent(): Consent {
  const raw = localStorage.getItem(KEY)
  return raw === "granted" || raw === "denied" ? raw : "unset"
}

export function setConsent(value: "granted" | "denied"): void {
  localStorage.setItem(KEY, value)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/consent.test.ts`
Expected: PASS, 4 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/consent.ts src/lib/consent.test.ts
git commit -m "feat: record an explicit advertising consent decision"
```

### Task 5.2: A slot component that reserves its space

The single most damaging thing ads do to a game like this is shift the layout when they load. Reserve the height up front.

**Files:**
- Create: `src/components/AdSlot.tsx`

- [ ] **Step 1: Implement the placeholder-first slot**

```tsx
// The height is reserved before anything loads, because an ad that pushes the guess table down as
// the player is reading it is worse than no ad at all. When consent is absent or the slot is
// disabled this still renders the reserved box, so the layout is identical either way.
export function AdSlot({ id, height = 90 }: { id: string; height?: number }) {
  return (
    <div
      id={id}
      style={{ minHeight: height }}
      className="mx-auto flex w-full max-w-[728px] items-center justify-center"
      aria-hidden="true"
    />
  )
}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit -p tsconfig.app.json && npm run build
git add src/components/AdSlot.tsx
git commit -m "feat: add an ad slot that reserves its height before loading"
```

---

## Workstream 7: Randomness and variety

**Goal:** The daily rotation feels varied.

**Measured current state.** The schedule is 94 days long, uses 94 distinct objects, and repeats nothing. Selection is already fair in the sense of drawing from least-used objects. The problem is proportional representation:

| Category | Share of dataset | Share of schedule |
|---|---|---|
| constellation | 88/298 = 30% | 31/94 = 33% |
| star | 86/298 = 29% | 19/94 = 20% |
| moon | 33/298 = 11% | 13/94 = 14% |
| everything else | 30% | 33% |

So roughly **one day in three is a constellation**, because constellations are a third of the dataset. Constellations are also the hardest category to tell apart, since 88 of them share the same six columns and most differ only by sky area and brightest-star magnitude.

**Do not make the daily puzzle actually random at play time.** It must stay a committed schedule so every player gets the same object and so adding objects never rewrites a played day. `pickRandomObject` for practice mode is already `Math.random` and is fine.

Three options, in increasing order of effort:

- **(a) Cap consecutive same-category days.** Smallest change: in `extendSchedule`, reject a candidate whose category matches the previous day's. Keeps proportions but removes clustering.
- **(b) Weight by category, not by object.** Pick a category first (weighted so no category exceeds ~15% of days), then the least-used object within it. Constellations drop to about 1 day in 7.
- **(c) Difficulty curve.** Use the existing unused `difficulty` field (1-5, already populated) to make weekends harder and Mondays easier.

**Recommendation: (b), with (a) as a free side effect.** It directly addresses "too many constellations" which is what the complaint most likely is.

**What was built, and what was not.** Option (a) is in: `extendSchedule` now takes full objects and
refuses to place yesterday's category again whenever the no-repeat pool leaves it any alternative.
Option (b) is **not** in, because it contradicts an invariant the schedule already promises and a test
already enforces: no object repeats until every other object has had a turn. Category quotas only work
by cycling small categories faster than large ones, so the eight planets would come round every 50-odd
days while some constellations waited 300. Choosing (b) means deleting that guarantee. That is a real
trade and it is yours to make.

### Task 7.1: Category-weighted scheduling

**Files:**
- Modify: `scripts/extend-schedule.mjs`
- Modify: `src/lib/dailySchedule.test.ts`

**Interfaces:**
- Consumes: `extendSchedule(existing, datasetIds, targetLength)` as it exists today.
- Produces: `extendSchedule(existing, dataset, targetLength)` — **note the signature change**, it now needs full objects rather than ids so it can read `category`.

- [x] **Step 1: Write the failing test**

```js
import { describe, it, expect } from "vitest"
import { extendSchedule } from "../../scripts/extend-schedule.mjs"

const dataset = [
  ...Array.from({ length: 88 }, (_, i) => ({ id: `con-${i}`, category: "constellation" })),
  ...Array.from({ length: 20 }, (_, i) => ({ id: `star-${i}`, category: "star" })),
  ...Array.from({ length: 20 }, (_, i) => ({ id: `moon-${i}`, category: "moon" })),
]

describe("extendSchedule category weighting", () => {
  it("never places the same category on two consecutive days", () => {
    const s = extendSchedule([], dataset, 60)
    const catOf = id => dataset.find(o => o.id === id).category
    for (let i = 1; i < s.length; i++) expect(catOf(s[i])).not.toBe(catOf(s[i - 1]))
  })

  it("keeps any one category under a fifth of the schedule despite it being most of the dataset", () => {
    const s = extendSchedule([], dataset, 100)
    const catOf = id => dataset.find(o => o.id === id).category
    const counts = {}
    for (const id of s) counts[catOf(id)] = (counts[catOf(id)] ?? 0) + 1
    expect(Math.max(...Object.values(counts)) / s.length).toBeLessThan(0.2)
  })

  it("still never rewrites a day that already exists", () => {
    const existing = ["con-0", "star-0", "moon-0"]
    const s = extendSchedule(existing, dataset, 40)
    expect(s.slice(0, 3)).toEqual(existing)
  })

  it("still never repeats an object", () => {
    const s = extendSchedule([], dataset, 100)
    expect(new Set(s).size).toBe(s.length)
  })
})
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/dailySchedule.test.ts`
Expected: FAIL, the consecutive-category and proportion assertions

- [x] **Step 3: Implement category weighting**

Rewrite the selection loop so each new day picks the category with the lowest `used / quota` ratio (where quota caps any category at 15% of days), excludes the previous day's category, then takes the least-used unused object within that category, breaking ties with the existing seeded RNG so output stays deterministic.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/dailySchedule.test.ts`
Expected: PASS

- [x] **Step 5: Extend the real schedule and verify no existing day moved**

```bash
node -e "console.log(JSON.stringify(require('./src/data/dailySchedule.json').slice(0,94)))" > /tmp/before.json
npm run schedule
node -e "const a=require('/tmp/before.json'),b=require('./src/data/dailySchedule.json').slice(0,94);if(JSON.stringify(a)!==JSON.stringify(b))throw new Error('existing days changed');console.log('first 94 days unchanged')"
npx vitest run && npm run build
```

- [x] **Step 6: Commit**

```bash
git add scripts/extend-schedule.mjs src/lib/dailySchedule.test.ts src/data/dailySchedule.json
git commit -m "feat: weight the daily schedule by category so constellations stop dominating"
```

---

## Workstream 8: gitignore (blocked, needs your decision)

**Do not run this workstream as written.** Ignoring `migrations/` removes the only definition of your D1 schema from the repo. A fresh clone could not provision the database, and `wrangler d1 migrations apply` would have nothing to apply. You just needed `0002_add_gave_up.sql` to deploy the give-up feature; if it had been ignored, that feature would be permanently broken for anyone else who cloned the repo.

Also note: adding a path to `.gitignore` does not untrack files already committed. `migrations/0001`, `migrations/0002`, and both `docs/superpowers` files are all tracked right now, so this needs an explicit `git rm --cached`.

**What I recommend instead:**

| Path | Recommendation | Why |
|---|---|---|
| `docs/superpowers/` | **Ignore and untrack.** Safe. | Working notes, no runtime or deploy dependency. |
| `migrations/` | **Keep tracked.** | The schema definition. Losing it breaks deploys and onboarding. |
| `scripts/.cache/` | **Ignore.** Added in Task 1.1. | Regenerable network cache. |

### Task 8.1: Ignore working notes only

- [ ] **Step 1: Add the ignore rules**

```bash
printf '\n# Working notes, not part of the build\ndocs/superpowers/\n' >> .gitignore
```

- [ ] **Step 2: Untrack the already-committed notes without deleting them from disk**

```bash
git rm -r --cached docs/superpowers
git status --short
```

Expected: the two doc files show as `D`, and `.gitignore` as `M`. **The files remain on your disk.**

- [ ] **Step 3: Confirm migrations are still tracked**

```bash
git ls-files migrations
```

Expected: both `.sql` files still listed. If they are not, stop and undo.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: keep working notes out of the repo"
```

**If you genuinely want `migrations/` ignored too**, say so explicitly and I will add it, but record the consequence in the README first so the next person knows the schema lives somewhere else.

---

## Workstream 9: New categories of object

**Goal:** Support star clusters, and one-off transient events like the BOAT.

**The BOAT is not a body.** "Brightest Of All Time" is GRB 221009A, a gamma-ray burst detected 2022-10-09 at redshift 0.151. It is an *event*, not an object: it has no diameter, no mass, and no surface temperature. The existing profile system handles this cleanly because each category defines its own columns, but the comparison rules in `getComparableValue` assume every object is a body, and will need an explicit rule for events.

Proposed additions to `CelestialCategory`:

| New category | Examples | Profile columns |
|---|---|---|
| `star_cluster` | Pleiades, Hyades, Omega Centauri, M13 | Type, Distance from Earth, Diameter, Estimated Mass, Cluster Type (open/globular), Apparent Magnitude, Discovered |
| `transient` | GRB 221009A, SN 1987A, GW150914 | Type, Distance from Earth, Redshift, Peak Apparent Magnitude, Event Type, Discovered |

### Task 9.1: Add the star cluster category

**Files:**
- Modify: `src/types/celestial.ts`
- Modify: `src/lib/objectProfiles.ts`
- Modify: `src/data/celestialObjects.json`
- Modify: `src/data/celestialObjects.test.ts`

**Interfaces:**
- Produces: `clusterType?: "Open" | "Globular"` on `CelestialObject`; `STAR_CLUSTER_PROFILE` registered in `PROFILES_BY_CATEGORY`.

- [x] **Step 1: Write the failing test**

```ts
it("gives every star cluster the columns its profile promises", () => {
  const clusters = (dataset as CelestialObject[]).filter(o => o.category === "star_cluster")
  expect(clusters.length).toBeGreaterThan(0)
  for (const c of clusters) {
    expect(c.clusterType === "Open" || c.clusterType === "Globular").toBe(true)
    expect(typeof c.distanceFromEarthLy).toBe("number")
    expect(typeof c.apparentMagnitude).toBe("number")
  }
})
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/celestialObjects.test.ts`
Expected: FAIL, `clusters.length` is 0

- [x] **Step 3: Extend the type**

In `src/types/celestial.ts`, add `| "star_cluster"` to `CelestialCategory` and add `clusterType?: "Open" | "Globular"` to `CelestialObject`.

- [x] **Step 4: Add the profile**

```ts
const STAR_CLUSTER_PROFILE: ProfileEntry[] = [
  { property: "category", label: "Type", kind: "exact" },
  { property: "distanceFromEarthLy", label: "Distance from Earth", kind: "numeric" },
  { property: "diameterKm", label: "Diameter", kind: "numeric" },
  { property: "massKg", label: "Estimated Mass", kind: "numeric" },
  { property: "clusterType", label: "Cluster Type", kind: "exact" },
  { property: "apparentMagnitude", label: "Apparent Magnitude", kind: "numeric" },
  { property: "discoveredYear", label: "Discovered", kind: "numeric" },
]
```

Register it in `PROFILES_BY_CATEGORY`, add `"star_cluster"` to `MILKY_WAY_CATEGORIES` so its redshift derives as 0, and add a `getCategoryColor` entry (suggest `#ffe9a8`).

- [x] **Step 5: Add the first six clusters**

Pleiades (M45), Hyades, Omega Centauri, M13 Hercules Cluster, Double Cluster (NGC 869), 47 Tucanae. Source distance, magnitude and diameter from SIMBAD; source discovery year from the discovery paper, and use `150` for Pleiades and Hyades since both are in the Almagest.

- [x] **Step 6: Run test to verify it passes**

Run: `npx vitest run && npm run build`

- [x] **Step 7: Commit**

```bash
git add src/types/celestial.ts src/lib/objectProfiles.ts src/lib/objectVisuals.ts src/data/celestialObjects.json src/data/celestialObjects.test.ts
git commit -m "feat: add star clusters as a category"
```

### Task 9.2: Add the transient category

**Files:** same set as 9.1, plus `src/lib/objectProfiles.ts` `getComparableValue`.

- [x] **Step 1: Write the failing test**

```ts
it("never derives a size, mass or temperature for an event that has none", () => {
  const objects = dataset as CelestialObject[]
  for (const t of objects.filter(o => o.category === "transient")) {
    for (const field of ["diameterKm", "massKg", "temperatureK", "gravityMs2"]) {
      expect(getComparableValue(t, field, objects)).toBeUndefined()
    }
  }
})

it("still lets a transient compare on distance and redshift", () => {
  const objects = dataset as CelestialObject[]
  for (const t of objects.filter(o => o.category === "transient")) {
    expect(typeof getComparableValue(t, "distanceFromEarthLy", objects)).toBe("number")
    expect(typeof getComparableValue(t, "redshift", objects)).toBe("number")
  }
})
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/celestialObjects.test.ts`

- [x] **Step 3: Add the category and the guard**

Add `| "transient"` to `CelestialCategory` and `eventType?: string`. At the very top of `getComparableValue`, before any derivation:

```ts
// A transient is an event, not a body. It genuinely has no diameter, mass, gravity or surface
// temperature, so those must stay blank rather than being derived into a misleading number.
const BODILESS_FIELDS = ["diameterKm", "massKg", "temperatureK", "gravityMs2", "moons", "rings"]
if (object.category === "transient" && BODILESS_FIELDS.includes(property)) return undefined
```

- [x] **Step 4: Add GRB 221009A and SN 1987A**

GRB 221009A: redshift 0.151, light-travel distance about 1.9 billion ly, peak apparent magnitude about 12 in the optical afterglow, `eventType: "Gamma-Ray Burst"`, `discoveredYear: 2022`. SN 1987A: in the Large Magellanic Cloud at 168,000 ly, peak apparent magnitude 2.9, `eventType: "Supernova"`, `discoveredYear: 1987`.

- [x] **Step 5: Run test to verify it passes**

Run: `npx vitest run && npm run build`

- [x] **Step 6: Commit**

```bash
git add src/types/celestial.ts src/lib/objectProfiles.ts src/data/celestialObjects.json src/data/celestialObjects.test.ts
git commit -m "feat: add transient events, starting with GRB 221009A and SN 1987A"
```

### Task 9.3: Rebalance the schedule for the new categories

New objects are `used: 0`, so the least-used rule in `extendSchedule` will surface them almost immediately. Combined with the category weighting from Workstream 7, they land at a sensible rate automatically.

- [x] **Step 1: Extend and verify no played day moved**

```bash
npm run schedule
npx vitest run
git add src/data/dailySchedule.json
git commit -m "chore: extend the daily schedule over the new categories"
```

---

## Suggested order

Workstreams are independent apart from where noted. Recommended sequence:

1. **Workstream 8** first, it is one commit and unblocks a clean tree.
2. **Workstream 2**, because the audit tests will catch mistakes made by everything after it.
3. **Workstream 1** Tasks 1.1 and 1.2, since every later verification task depends on both helpers.
4. **Workstream 1** Tasks 1.3 to 1.6.
5. **Workstream 3**, which reuses the fetch cache from 1.1.
6. **Workstream 7**, independent, do it whenever.
7. **Workstream 9**, last of the data work, so the new objects arrive already covered by the audit tests.
8. **Workstream 5** only once you have answered the three questions.

## Open questions blocking work

1. **Ads:** which network, which slots, and is there an ad-free option? Workstream 5 cannot be finished without this.
2. **`migrations/` in gitignore:** confirm you want the schema out of the repo, knowing it breaks fresh clones and deploys. Default is to keep it tracked.
3. **Randomness:** confirm option (b), category weighting, is what you meant by "completely random".
4. **Discovered column:** confirm option (a), relabel to "First Recorded" for naked-eye objects and explain it in How to Play.
5. **Footer:** is there anything actually wrong with the existing link, or is that item already satisfied?
6. **Your list has no item 6.** Was something meant to be there?
