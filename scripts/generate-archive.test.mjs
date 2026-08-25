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
    expect(site["sitemap.xml"]).not.toContain("/objects/cartwheel_galaxy.html")
    expect(site["objects/index.html"]).not.toContain("Cartwheel Galaxy")
  })

  it("renders an object's name, description and formatted facts", () => {
    const page = site["objects/mercury.html"]
    const mercury = objects.find(o => o.id === "mercury")
    expect(page).toContain("<h1>Mercury</h1>")
    expect(page).toContain(mercury.description)
    expect(page).toContain("4,879 km")
    expect(page).not.toContain("<img")
  })

  it("writes a page per publishable object plus the standing pages", () => {
    expect(Object.keys(site)).toHaveLength(publishable.length + 5)
    expect(site["sitemap.xml"]).toContain("<loc>https://cosmodle.com/privacy.html</loc>")
    expect(site["robots.txt"]).toContain("Sitemap: https://cosmodle.com/sitemap.xml")
  })
})
