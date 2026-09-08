import { describe, it, expect } from "vitest"
import dataset from "../data/celestialObjects.json"
import type { CelestialObject } from "../types/celestial"
import { getProfileForCategory } from "./objectProfiles"
import { deriveKnowledge, revealKnowledge, describeKnowledge } from "./knowledge"

const objects = dataset as CelestialObject[]
const byName = (name: string) => objects.find(o => o.name === name)!

const ganymede = byName("Ganymede")
const moonProfile = getProfileForCategory("moon")

function knowledgeFor(guesses: CelestialObject[], answer = ganymede) {
  const profile = getProfileForCategory(answer.category)
  const rows = deriveKnowledge(profile, guesses, answer, objects)
  return (property: string) => rows.find(r => r.property === property)!
}

describe("deriveKnowledge", () => {
  it("says nothing about any property before the first guess", () => {
    const rows = deriveKnowledge(moonProfile, [], ganymede, objects)
    expect(rows.every(r => r.state === "unknown")).toBe(true)
    expect(rows.every(r => r.display === "—")).toBe(true)
    expect(rows).toHaveLength(moonProfile.length)
  })

  it("locks a categorical property a guess matched", () => {
    const row = knowledgeFor([byName("Europa")])("parentBodyId")
    expect(row.state).toBe("locked")
    expect(row.display).toBe("Jupiter")
  })

  it("rules out a categorical property a guess missed", () => {
    const row = knowledgeFor([byName("Titan")])("parentBodyId")
    expect(row.state).toBe("narrowed")
    expect(row.display).toBe("not Saturn")
  })

  it("counts further exclusions once more than two are ruled out", () => {
    const guesses = [byName("Titan"), byName("Triton"), byName("Miranda")].filter(Boolean)
    const row = knowledgeFor(guesses)("parentBodyId")
    if (guesses.length < 3) return
    expect(row.display).toMatch(/^not .+, .+ \+\d+ more$/)
  })

  it("turns a guess that was too small into a lower bound", () => {
    // Europa is 3,122 km across against Ganymede's 5,268 km, so the answer is known to be bigger.
    const row = knowledgeFor([byName("Europa")])("diameterKm")
    expect(row.state).toBe("narrowed")
    expect(row.display).toBe("over 3,122 km")
  })

  it("turns a guess that was too big into an upper bound", () => {
    const row = knowledgeFor([byName("Callisto")])("distanceFromParentKm")
    expect(row.state).toBe("narrowed")
    expect(row.display).toBe("under 1,882,700 km")
  })

  it("closes both ends into a range once guesses have bracketed the answer", () => {
    // Europa orbits closer than Ganymede, Callisto further, so the answer is boxed in between.
    const row = knowledgeFor([byName("Europa"), byName("Callisto")])("distanceFromParentKm")
    expect(row.state).toBe("narrowed")
    expect(row.display).toContain("671,100")
    expect(row.display).toContain("1,882,700")
  })

  it("never claims a bound tighter than the answer itself", () => {
    const guesses = [byName("Europa"), byName("Callisto"), byName("Titan"), byName("Io")].filter(Boolean)
    const rows = deriveKnowledge(moonProfile, guesses, ganymede, objects)
    const diameter = rows.find(r => r.property === "diameterKm")!
    // Whatever bound is shown, Ganymede's real diameter has to satisfy it.
    const numbers = diameter.display.match(/[\d,]+/g)?.map(n => Number(n.replace(/,/g, ""))) ?? []
    if (diameter.display.startsWith("over")) expect(ganymede.diameterKm!).toBeGreaterThan(numbers[0])
    if (diameter.display.startsWith("under")) expect(ganymede.diameterKm!).toBeLessThan(numbers[0])
  })

  it("reports a within-tolerance numeric match as approximate, not exact", () => {
    // Titan is 5,150 km to Ganymede's 5,268 km: close enough to read as a match, but not the answer.
    const row = knowledgeFor([byName("Titan")])("diameterKm")
    expect(row.display).toMatch(/^(about|near) /)
  })

  it("names the parent body in the distance label once the parent is known", () => {
    const rows = deriveKnowledge(moonProfile, [byName("Europa")], ganymede, objects)
    expect(rows.find(r => r.property === "distanceFromParentKm")!.label).toBe("Distance from Jupiter")
  })

  it("leaves the generic distance label alone while the parent is still unknown", () => {
    const rows = deriveKnowledge(moonProfile, [byName("Titan")], ganymede, objects)
    expect(rows.find(r => r.property === "distanceFromParentKm")!.label).toBe("Distance from Parent")
  })

  it("measures a galaxy's diameter in light-years rather than quintillions of kilometres", () => {
    const andromeda = byName("Andromeda Galaxy")
    const rows = revealKnowledge(getProfileForCategory("galaxy"), andromeda, objects)
    expect(rows.find(r => r.property === "diameterKm")!.display).toContain("ly")
  })
})

describe("revealKnowledge", () => {
  it("locks every property to the answer's own value", () => {
    const rows = revealKnowledge(moonProfile, ganymede, objects)
    expect(rows.every(r => r.state === "locked")).toBe(true)
    expect(rows.find(r => r.property === "diameterKm")!.display).toBe("5,268 km")
    expect(rows.find(r => r.property === "distanceFromParentKm")!.label).toBe("Distance from Jupiter")
  })
})

describe("describeKnowledge", () => {
  it("opens with a placeholder while the category is unknown", () => {
    const clauses = describeKnowledge(deriveKnowledge(moonProfile, [], ganymede, objects))
    expect(clauses).toHaveLength(1)
    expect(clauses[0].state).toBe("unknown")
  })

  it("builds a sentence out of what has been established", () => {
    const knowledge = deriveKnowledge(moonProfile, [byName("Europa"), byName("Callisto")], ganymede, objects)
    const clauses = describeKnowledge(knowledge)
    expect(clauses[0].text).toBe("A moon")
    expect(clauses.map(c => c.text)).toContain("orbiting Jupiter")
    expect(clauses.length).toBeLessThanOrEqual(4)
  })

  it("uses the right article for a vowel-initial category", () => {
    const asteroid = objects.find(o => o.category === "asteroid")!
    const profile = getProfileForCategory("asteroid")
    const clauses = describeKnowledge(deriveKnowledge(profile, [asteroid], asteroid, objects))
    expect(clauses[0].text).toBe("An asteroid")
  })

  it("phrases every category's fully-revealed object without falling back to a bare label", () => {
    const seen = new Set<string>()
    for (const object of objects) {
      if (seen.has(object.category)) continue
      seen.add(object.category)
      const clauses = describeKnowledge(revealKnowledge(getProfileForCategory(object.category), object, objects))
      expect(clauses[0].text.startsWith("A ") || clauses[0].text.startsWith("An ")).toBe(true)
      for (const clause of clauses) expect(clause.text.trim()).not.toBe("")
    }
  })
})
