import { describe, it, expect } from "vitest"
import { generateSite, PUBLISHED_CATEGORIES } from "./generate-archive.mjs"
import objects from "../src/data/celestialObjects.json" with { type: "json" }

const site = generateSite({ objects })
const pages = Object.entries(site)
const publishable = objects.filter(o => PUBLISHED_CATEGORIES.has(o.category))

describe("generateSite", () => {
  it("ties no object to a puzzle day", () => {
    // The in-app archive asks players to solve past days. Naming the day an object was the answer
    // would solve those for them, whether it appeared on the object's own page or in an index.
    for (const [path, contents] of pages) {
      expect(contents, `${path} names a puzzle day`).not.toMatch(/Cosmodle #\d/)
    }
    expect(Object.keys(site).some(path => path.includes("archive"))).toBe(false)
  })

  it("publishes a page only for a category whose figures have been verified", () => {
    const paths = Object.keys(site)
    for (const object of objects) {
      const has = paths.includes(`objects/${object.id}.html`)
      expect(has, `${object.id} (${object.category})`).toBe(PUBLISHED_CATEGORIES.has(object.category))
    }
  })

  it("renders an object's name, description and formatted facts", () => {
    const page = site["objects/mercury.html"]
    const mercury = objects.find(o => o.id === "mercury")
    expect(page).toContain("<h1>Mercury</h1>")
    expect(page).toContain(mercury.description)
    expect(page).toContain("4,879 km")
    expect(page).not.toContain("<img")
  })

  // Cloudflare Pages 308s /page.html to /page, so a .html address is always one redirect away from
  // the real one. Publishing it in a canonical, a link or the sitemap is what makes Search Console
  // file these pages under "Page with redirect" instead of indexing them.
  it("never publishes an address that redirects", () => {
    const html = pages.filter(([path]) => path.endsWith(".html"))
    for (const [path, contents] of html) {
      const addresses = [...contents.matchAll(/(?:href|<loc>)="?([^"<>]+)/g)].map(m => m[1])
      const withExtension = addresses.filter(a => /\.html(?:$|[?#])/.test(a))
      expect(withExtension, `${path} links to a redirecting address`).toEqual([])
    }
    expect(site["sitemap.xml"]).not.toContain(".html")
    expect(site["objects/mercury.html"]).toContain('<link rel="canonical" href="https://cosmodle.com/objects/mercury">')
  })

  // Google calls a large set of near-identical short pages scaled content abuse whether or not a
  // machine wrote them, and one borrowed sentence per object was exactly that. The context section
  // is derived from the object's own figures, so the floor is per-page rather than a template check.
  it("gives every object page enough of its own prose to stand as a page", () => {
    const thin = []
    for (const [path, contents] of pages) {
      if (!path.startsWith("objects/") || path === "objects/index.html") continue
      const words = contents
        .replace(/<style[\s\S]*?<\/style>/g, "")
        .replace(/<[^>]+>/g, " ")
        .trim()
        .split(/\s+/).length
      if (words < 90) thin.push(`${path} (${words} words)`)
    }
    expect(thin).toEqual([])
  })

  it("states nothing in the context section that the object's own figures do not support", () => {
    const mercury = site["objects/mercury.html"]
    expect(mercury).toContain("<h2>Mercury in context</h2>")
    // 4,879 / 12,742 = 0.383, and sunlight crosses 0.39 AU in a shade over three minutes.
    expect(mercury).toContain("38 percent of the diameter of Earth")
    expect(mercury).toContain("sunlight takes 3 minutes to reach it")
    // A comet is eleven orders of magnitude lighter than Earth, which no multiple renders readably.
    expect(site["objects/halley.html"]).toContain("less than a thousandth of the mass of Earth")
  })

  it("writes a page per publishable object plus the standing pages", () => {
    expect(Object.keys(site)).toHaveLength(publishable.length + 5)
    expect(site["sitemap.xml"]).toContain("<loc>https://cosmodle.com/privacy</loc>")
    expect(site["robots.txt"]).toContain("Sitemap: https://cosmodle.com/sitemap.xml")
  })
})
