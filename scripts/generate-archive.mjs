import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

// The game itself is a single-page app with no router, so search engines and the AdSense crawler see
// one empty shell. These pages are written straight into dist/ after vite build to give both of them
// something real to read, without dragging a router or a prerenderer into the app.

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

// The domain the game shares itself under (see Share.tsx), so canonicals and the sitemap agree with
// the links players actually pass around.
export const ORIGIN = "https://cosmodle.com"
export const CONTACT_EMAIL = "mpink2491@gmail.com"

// The day the game launched, which the about page states. Mirrors src/lib/dailyObject.ts.
export const LAUNCH_DATE = new Date(2026, 7, 18)

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" })

function formatDate(date) {
  return DATE_FORMAT.format(date)
}

// Ported from src/lib/formatting.ts rather than imported, because this script is plain Node ESM and
// cannot read TypeScript. Keep the two in step if the units there change.
function group(v) {
  return v.toLocaleString("en-US", { maximumFractionDigits: 20 })
}

const PREHISTORIC_YEAR = -3000

function capitalizeWords(s) {
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

export function formatPropertyValue(property, value) {
  if (property === "discoveredYear" && value === PREHISTORIC_YEAR) return "Prehistoric"
  if (value === undefined || value === null) return "—"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (property === "distanceFromSunAU") return `${value.toFixed(2)} AU`
  if (property === "distanceFromEarthLy") return `${group(Number(value.toPrecision(3)))} ly`
  if (property === "distanceFromParentKm" || property === "diameterKm") return `${group(Math.round(value))} km`
  if (property === "temperatureK") return `${group(Math.round(value - 273.15))}°C`
  if (property === "orbitalPeriodDays") return `${group(Math.round(value))} days`
  if (property === "rotationPeriodHours") return `${group(Number(value.toPrecision(4)))} hours`
  if (property === "massKg") {
    const exponent = Math.floor(Math.log10(Math.abs(value)))
    return `${(value / Math.pow(10, exponent)).toFixed(2)} × 10^${exponent} kg`
  }
  if (property === "gravityMs2") {
    if (value !== 0 && Math.abs(value) < 0.01) return `${value.toExponential(2)} m/s²`
    return `${group(Number(value.toPrecision(3)))} m/s²`
  }
  if (property === "areaSqDeg") return `${group(value)} sq°`
  if (property === "brightestStarMagnitude") return `mag ${value}`
  if (property === "category" || property === "parentBodyId" || property === "hemisphere") {
    return capitalizeWords(String(value))
  }
  return String(value)
}

// Row order for the fact table, and the human label for each field. Anything populated but missing
// here still renders, under a label derived from its key.
const PROPERTY_LABELS = [
  ["category", "Type"],
  ["galaxyType", "Galaxy type"],
  ["nebulaType", "Nebula type"],
  ["blackHoleType", "Black hole type"],
  ["clusterType", "Cluster type"],
  ["eventType", "Event type"],
  ["parentBodyId", "Orbits"],
  ["distanceFromSunAU", "Distance from the Sun"],
  ["distanceFromParentKm", "Distance from parent body"],
  ["distanceFromEarthLy", "Distance from Earth"],
  ["diameterKm", "Diameter"],
  ["massKg", "Mass"],
  ["gravityMs2", "Surface gravity"],
  ["temperatureK", "Temperature"],
  ["moons", "Moons"],
  ["rings", "Rings"],
  ["orbitalPeriodDays", "Orbital period"],
  ["rotationPeriodHours", "Rotation period"],
  ["apparentMagnitude", "Apparent magnitude"],
  ["redshift", "Redshift"],
  ["areaSqDeg", "Area of sky"],
  ["brightestStarId", "Brightest star"],
  ["brightestStarMagnitude", "Brightest star magnitude"],
  ["hemisphere", "Hemisphere"],
  ["isZodiac", "Zodiac constellation"],
  ["composition", "Composition"],
  ["atmosphere", "Atmosphere"],
  ["discoveredYear", "Discovered"],
]

// id, name and description carry the page around the table, colour is a rendering token for the
// in-game portrait rather than a fact about the object, and imageUrl is deliberately unused.
const SKIPPED_PROPERTIES = new Set(["id", "name", "description", "imageUrl", "color", "difficulty"])

// Only categories whose figures have been checked against a catalogue get a public page, because a
// generated page states its numbers as fact to a search engine and to anyone who reads it. Planets
// are here on their own authority; the rest are covered by the verify scripts:
// dwarf planets, asteroids and comets by `npm run verify:small-bodies`, exoplanets by
// `npm run verify:exoplanets`, stars by `npm run verify:star-sizes`. Moons, galaxies, nebulae,
// black holes, quasars, constellations, star clusters and transients are still unverified. Add a
// category here once a verify script covers it, and the pages, index and sitemap follow.
export const PUBLISHED_CATEGORIES = new Set([
  "planet",
  "dwarf_planet",
  "asteroid",
  "comet",
  "star",
  "exoplanet",
])

// ponytail: no <img> tags anywhere in these pages. Most imageUrl values are hotlinked Wikimedia
// thumbnails, and publishing them would mean hosting the files ourselves plus rendering each one's
// author, licence and source link from the Commons API. That is a separate job from getting text
// indexed, so the pages ship without pictures.

const CATEGORY_PLURALS = {
  planet: "Planets",
  dwarf_planet: "Dwarf planets",
  moon: "Moons",
  asteroid: "Asteroids",
  comet: "Comets",
  star: "Stars",
  galaxy: "Galaxies",
  black_hole: "Black holes",
  nebula: "Nebulae",
  quasar: "Quasars",
  constellation: "Constellations",
  exoplanet: "Exoplanets",
  star_cluster: "Star clusters",
  transient: "Transient events",
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

const STYLE = `:root{color-scheme:light}
*{box-sizing:border-box}
body{margin:0;background:#fff8e7;color:#1a1a1a;line-height:1.6;
font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.wrap{max-width:52rem;margin:0 auto;padding:1.5rem 1rem 3rem}
h1{font-size:1.9rem;line-height:1.2;margin:0 0 .25rem}
h2{font-size:1.2rem;margin:2rem 0 .5rem;border-bottom:1px solid #e0e0e0;padding-bottom:.25rem}
h3{font-size:1rem;margin:1.5rem 0 .25rem}
p{margin:.75rem 0}
a{color:#1a1a1a}
a:hover{color:#00998a}
.muted{color:#4d4d4d}
.lede{color:#4d4d4d;margin:0 0 1rem}
.play{display:inline-block;margin:1rem 0;padding:.5rem 1rem;border:1px solid #4d4d4d;
border-radius:.375rem;text-decoration:none;font-weight:600}
.play:hover{border-color:#00998a}
table{width:100%;border-collapse:collapse;margin:1rem 0;font-size:.95rem}
th,td{text-align:left;padding:.5rem .6rem;border-bottom:1px solid #e0e0e0;
vertical-align:top;overflow-wrap:anywhere}
th{width:45%;font-weight:600;color:#4d4d4d}
ul.list{list-style:none;padding:0;margin:.5rem 0;columns:14rem 3;column-gap:1.5rem}
ul.list li{break-inside:avoid;padding:.15rem 0}
ol.days{padding-left:1.25rem;margin:.5rem 0}
ol.days li{padding:.15rem 0}
footer{margin-top:3rem;border-top:1px solid #4d4d4d;padding-top:1rem;
font-size:.875rem;color:#4d4d4d}
footer a{margin-right:1rem;display:inline-block}`

const NAV = [
  ["/", "Play"],
  ["/objects/", "All objects"],
  ["/about.html", "About"],
  ["/privacy.html", "Privacy"],
]

function page({ path, title, description, body }) {
  const nav = NAV.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${ORIGIN}${path}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<style>${STYLE}</style>
</head>
<body>
<div class="wrap">
${body}
<footer><nav>${nav}</nav></footer>
</div>
</body>
</html>
`
}

function truncate(s, max) {
  if (s.length <= max) return s
  return `${s.slice(0, max - 1).trimEnd()}…`
}

export function renderObjectPage(object, { byId, published }) {
  const categoryName = capitalizeWords(object.category)
  const rows = []
  const ordered = PROPERTY_LABELS.filter(([key]) => object[key] !== undefined && object[key] !== null)
  const extra = Object.keys(object)
    .filter(key => !SKIPPED_PROPERTIES.has(key) && !PROPERTY_LABELS.some(([k]) => k === key))
    .map(key => [key, capitalizeWords(key)])

  for (const [key, label] of [...ordered, ...extra]) {
    const related = (key === "parentBodyId" || key === "brightestStarId") && byId.get(object[key])
    // A related object that has no page of its own is still worth naming, but linking to it would
    // be a dead link, so it degrades to plain text rather than disappearing.
    const value = related
      ? published.has(related.id)
        ? `<a href="/objects/${encodeURIComponent(related.id)}.html">${escapeHtml(related.name)}</a>`
        : escapeHtml(related.name)
      : escapeHtml(formatPropertyValue(key, object[key]))
    rows.push(`<tr><th scope="row">${escapeHtml(label)}</th><td>${value}</td></tr>`)
  }

  const description = object.description
    ? `${object.name}: ${object.description}`
    : `${object.name} is a ${categoryName.toLowerCase()} featured in Cosmodle, the daily astronomy guessing game.`

  const body = `<h1>${escapeHtml(object.name)}</h1>
<p class="lede">${escapeHtml(categoryName)}</p>
${object.description ? `<p>${escapeHtml(object.description)}</p>` : ""}
<h2>Facts</h2>
<table><tbody>
${rows.join("\n")}
</tbody></table>
<a class="play" href="/">Play today's Cosmodle</a>`

  return page({
    path: `/objects/${encodeURIComponent(object.id)}.html`,
    title: `${object.name} — ${categoryName} facts | Cosmodle`,
    description: truncate(description, 155),
    body,
  })
}

function renderObjectIndex(objects) {
  const byCategory = new Map()
  for (const object of objects) {
    if (!byCategory.has(object.category)) byCategory.set(object.category, [])
    byCategory.get(object.category).push(object)
  }

  const sections = [...byCategory.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([category, members]) => {
      const items = [...members]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(o => `<li><a href="/objects/${encodeURIComponent(o.id)}.html">${escapeHtml(o.name)}</a></li>`)
        .join("")
      const heading = CATEGORY_PLURALS[category] ?? capitalizeWords(category)
      return `<h2>${escapeHtml(heading)} <span class="muted">(${members.length})</span></h2>\n<ul class="list">${items}</ul>`
    })
    .join("\n")

  return page({
    path: "/objects/",
    title: "Objects in Cosmodle | Planets, stars, exoplanets and small bodies",
    description: `Facts on ${objects.length} of the celestial objects that can appear in Cosmodle: planets, dwarf planets, asteroids, comets, stars and exoplanets.`,
    body: `<h1>Objects in Cosmodle</h1>
<p class="lede">Fact pages for ${objects.length} of the celestial objects that can turn up as a guess or an answer, grouped by type. More are added as their figures are checked against a catalogue.</p>
${sections}`,
  })
}

function renderAbout() {
  return page({
    path: "/about.html",
    title: "About Cosmodle",
    description: "What Cosmodle is, how the daily celestial object is chosen, and where its astronomical data comes from.",
    body: `<h1>About Cosmodle</h1>
<p>Cosmodle is a daily guessing game about space. Every day there is one mystery celestial object,
and you have seven guesses to find it. Each guess is compared against the answer across properties
such as distance, diameter, mass, temperature, orbital period and number of moons, and you are told
whether the answer's value is higher or lower than your guess. Narrow it down from there.</p>
<p>There is no account and no login. A daily puzzle, a practice mode with unlimited random rounds,
and an archive of past puzzles are all playable straight from the home page.</p>

<h2>How the daily object is chosen</h2>
<p>The answer for each day is fixed in advance in a committed schedule rather than derived from the
size of the dataset. That matters: deriving it would mean that adding a new object silently changed
the answer to a day someone had already played, and graded their saved guesses against something
else. The schedule is append-only, so a day that has been played can never be rewritten.</p>
<p>Day 1 was ${escapeHtml(formatDate(LAUNCH_DATE))}. The puzzle rolls over at your own local midnight
rather than at UTC midnight.</p>

<h2>Where the data comes from</h2>
<p>Every figure in the object pages is drawn from published astronomical sources and rounded for
readability:</p>
<ul>
<li><strong>Wikipedia and Wikimedia Commons</strong> for descriptions and general reference values.</li>
<li><strong>NASA and JPL</strong>, including the JPL Small-Body Database and the NASA Exoplanet
Archive, for orbital elements, planetary and small-body parameters and exoplanet measurements.</li>
<li><strong>SIMBAD</strong>, operated by the Centre de Données astronomiques de Strasbourg, for
stellar positions, magnitudes and identifiers.</li>
</ul>
<p>Astronomical values are frequently revised, and different catalogues disagree. If you spot
something that looks wrong, please say so.</p>

<h2>Contact</h2>
<p>Cosmodle is made by Michael Pink. Corrections, bug reports and suggestions go to
<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
<a class="play" href="/">Play today's Cosmodle</a>`,
  })
}

function renderPrivacy() {
  return page({
    path: "/privacy.html",
    title: "Privacy policy | Cosmodle",
    description: "How Cosmodle handles game data stored in your browser, the anonymous player id behind its statistics, and third-party advertising cookies.",
    body: `<h1>Privacy policy</h1>
<p class="lede">Last updated ${escapeHtml(formatDate(new Date()))}.</p>
<p>Cosmodle has no accounts, no logins and no sign-up. It never asks for your name, your email
address or any other detail that identifies you. What it does store is described in full below.</p>

<h2>Data stored in your browser</h2>
<p>Cosmodle keeps the following in your browser's <code>localStorage</code>. It stays on your device,
and clearing your browser's site data removes all of it.</p>
<ul>
<li><strong>Game state</strong> (<code>celestial:daily:&lt;date&gt;</code>) — the guesses you have
made on a puzzle, the hints you have revealed and whether you have finished, so that reloading the
page does not lose your progress.</li>
<li><strong>Local statistics</strong> (<code>celestial:statistics</code>) — your games played, win
percentage, current streak and guess distribution.</li>
<li><strong>Player id</strong> (<code>celestial:playerId</code>) — a random identifier, described in
the next section.</li>
<li><strong>Consent record</strong> (<code>cosmodle:consent</code>) — whether you granted or denied
consent for advertising cookies, so that you are not asked again on every visit. It stores only the
word "granted" or "denied". If no valid record is present, Cosmodle treats it as no consent given.</li>
</ul>

<h2>The anonymous player id</h2>
<p>The first time you play, your browser generates a random UUID using its own
<code>crypto.randomUUID()</code> and stores it as your player id. It is not derived from your device,
your network, your browser fingerprint or anything else about you. It exists purely so that your
statistics survive a cleared cache or follow you to another device.</p>
<p>When you finish a daily puzzle, that id is sent to Cosmodle's own API together with the puzzle's
day number, whether you won, how many guesses you used, how many hints you used and whether you gave
up. Nothing else is sent. Those rows are stored in a Cloudflare D1 database and are used for two
things: returning your own statistics, and computing the aggregate numbers shown in Global Stats,
such as total players, how many people played today, the overall win rate and the distribution of
guess counts. The aggregates are never broken down to a single player.</p>
<p>Because there is no account, the player id is the only handle on that data. If you want your rows
deleted, email the address at the bottom of this page with your player id and they will be removed.</p>

<h2>Hosting and server logs</h2>
<p>Cosmodle is hosted on Cloudflare Pages. Like any web host, Cloudflare processes standard request
data such as IP addresses in order to serve the site and protect it from abuse. That is handled by
Cloudflare under its own privacy terms and is not combined with your player id by Cosmodle.</p>

<h2>Advertising</h2>
<p>Cosmodle carries advertising supplied by Google AdSense. Google and its partners use cookies and
similar technologies to serve and measure ads, and in some configurations to personalise the ads you
see based on your prior visits to this and other websites.</p>
<p>You can opt out of personalised advertising at any time through Google's own controls at
<a href="https://www.google.com/settings/ads" rel="nofollow noopener" target="_blank">https://www.google.com/settings/ads</a>.
More options are available at
<a href="https://www.aboutads.info/choices/" rel="nofollow noopener" target="_blank">www.aboutads.info/choices</a>.
Google's own explanation of how it uses data from sites that use its services is at
<a href="https://policies.google.com/technologies/partner-sites" rel="nofollow noopener" target="_blank">policies.google.com/technologies/partner-sites</a>.</p>
<p>Third-party advertising cookies are set by Google and its partners, not by Cosmodle, and Cosmodle
has no access to their contents.</p>

<h2>Consent in the EEA, the UK and Switzerland</h2>
<p>If you are in the European Economic Area, the United Kingdom or Switzerland, consent for
advertising cookies and personalised advertising is collected through a Google-certified Consent
Management Platform before any advertising cookie is set. Your choice is recorded by that CMP and,
in the form described above, in your browser's <code>localStorage</code>. You can change or withdraw
it at any time from the consent controls on the site, and withdrawing it stops personalised
advertising from that point on.</p>

<h2>Children</h2>
<p>Cosmodle is not directed at children under 13 and does not knowingly collect information from
them. Since it collects no personal information from anyone, there is nothing to remove, but if you
believe a child's data has reached us, please get in touch.</p>

<h2>Changes to this policy</h2>
<p>If this policy changes, the revised version will be posted on this page with an updated date at
the top. Continuing to play after a change means accepting the revised policy.</p>

<h2>Contact</h2>
<p>Questions about privacy, or requests to delete data tied to a player id, go to
<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
<a class="play" href="/">Play today's Cosmodle</a>`,
  })
}

function renderSitemap(paths) {
  const urls = paths.map(path => `  <url><loc>${ORIGIN}${path}</loc></url>`).join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

/**
 * Builds every static page as a map of dist-relative path to file contents, so the spoiler rule can
 * be tested against the real output without touching the filesystem.
 */
// No page here says which object belongs to which day. The in-app archive asks players to solve
// past puzzles, and an index of past answers would hand them every one, so these pages are reference
// material about the objects and say nothing about the schedule at all.
export function generateSite({ objects }) {
  const byId = new Map(objects.map(o => [o.id, o]))
  const publishable = objects.filter(o => PUBLISHED_CATEGORIES.has(o.category))
  const published = new Set(publishable.map(o => o.id))

  const files = {}
  for (const object of publishable) {
    files[`objects/${object.id}.html`] = renderObjectPage(object, { byId, published })
  }
  files["objects/index.html"] = renderObjectIndex(publishable)
  files["about.html"] = renderAbout()
  files["privacy.html"] = renderPrivacy()

  const sitemapPaths = [
    "/",
    "/objects/",
    "/about.html",
    "/privacy.html",
    ...publishable.map(o => `/objects/${encodeURIComponent(o.id)}.html`),
  ]
  files["sitemap.xml"] = renderSitemap(sitemapPaths)
  files["robots.txt"] = `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`

  // AdSense reports unsold inventory as "earnings at risk" until the publisher is declared here, and
  // the file has to name a real publisher id, so it is written only once one is configured.
  const adsClient = process.env.VITE_ADSENSE_CLIENT?.trim() ?? ""
  if (/^ca-pub-\d{16}$/.test(adsClient)) {
    files["ads.txt"] = `google.com, ${adsClient.slice(3)}, DIRECT, f08c47fec0942fa0\n`
  }

  return files
}

function main() {
  const objects = JSON.parse(readFileSync(join(ROOT, "src/data/celestialObjects.json"), "utf8"))
  const files = generateSite({ objects })

  for (const [relative, contents] of Object.entries(files)) {
    const target = join(ROOT, "dist", relative)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, contents)
  }

  const pages = Object.keys(files).length
  console.log(`generate-archive: wrote ${pages} files to dist/ (${pages - 5} object pages)`)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) main()
