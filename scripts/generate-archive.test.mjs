import { describe, it, expect } from "vitest"
import {
  generateSite,
  dayNumberFor,
  dateForDayNumber,
  LAUNCH_DATE,
  PUBLISHED_CATEGORIES,
} from "./generate-archive.mjs"
import objects from "../src/data/celestialObjects.json" with { type: "json" }
import schedule from "../src/data/dailySchedule.json" with { type: "json" }

// A day well inside the committed schedule, so there are both real past days to list and real future
// days to keep quiet about.
const TODAY = dateForDayNumber(30, LAUNCH_DATE)
const TODAY_NUMBER = dayNumberFor(TODAY)

const site = generateSite({ objects, schedule, today: TODAY })
const pages = Object.entries(site)
const publishable = objects.filter(o => PUBLISHED_CATEGORIES.has(o.category))
const answerOn = dayNumber => objects.find(o => o.id === schedule[dayNumber - 1])

describe("generateSite", () => {
  it("never labels today's puzzle or any later one", () => {
    for (const [path, contents] of pages) {
      for (let dayNumber = TODAY_NUMBER; dayNumber < schedule.length + 1; dayNumber++) {
        expect(contents, `${path} leaks day ${dayNumber}`).not.toContain(`Cosmodle #${dayNumber}`)
      }
    }
  })

  it("names no unplayed answer in the archive", () => {
    const archive = site["archive/index.html"]
    for (let dayNumber = TODAY_NUMBER; dayNumber <= schedule.length; dayNumber++) {
      const answer = objects.find(o => o.id === schedule[dayNumber - 1])
      // Matched on name rather than id, because two different objects can share one (the moon Hydra
      // and the constellation Hydra), and a name a played day already printed gives nothing away.
      const namedEarlier = schedule
        .slice(0, TODAY_NUMBER - 1)
        .some(id => objects.find(o => o.id === id)?.name === answer.name)
      if (namedEarlier) continue
      expect(archive, `archive leaks day ${dayNumber}`).not.toContain(answer.name)
    }
  })

  it("lists exactly the days that have already been played", () => {
    const archive = site["archive/index.html"]
    const listed = [...archive.matchAll(/<li value="(\d+)"/g)].map(m => Number(m[1]))
    expect(listed.sort((a, b) => a - b)).toEqual(
      Array.from({ length: TODAY_NUMBER - 1 }, (_, i) => i + 1)
    )
  })

  it("never puts a featured label on an answer that has not been played", () => {
    for (let dayNumber = TODAY_NUMBER; dayNumber <= schedule.length; dayNumber++) {
      const page = site[`objects/${answerOn(dayNumber).id}.html`]
      // An unverified answer has no page at all, which is a stronger guarantee than an unlabelled one.
      if (page) expect(page).not.toContain("Featured as Cosmodle")
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

  it("labels a past answer with its day number and date", () => {
    // Day 4 rather than day 1, because day 1's answer is a galaxy and galaxies have no pages yet.
    const answer = answerOn(4)
    expect(site[`objects/${answer.id}.html`]).toContain("Featured as Cosmodle #4 on August 21, 2026")
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

  it("still lists a played day whose answer has no page, without linking to it", () => {
    const archive = site["archive/index.html"]
    expect(archive).toContain(`<li value="1">Cartwheel Galaxy`)
    expect(archive).not.toContain("/objects/cartwheel_galaxy.html")
  })

  it("writes a page for every object plus the standing pages", () => {
    expect(Object.keys(site)).toHaveLength(publishable.length + 6)
    expect(site["sitemap.xml"]).toContain("<loc>https://cosmodle.com/privacy.html</loc>")
    expect(site["robots.txt"]).toContain("Sitemap: https://cosmodle.com/sitemap.xml")
  })
})
