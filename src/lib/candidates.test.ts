import { describe, it, expect } from "vitest"
import dataset from "../data/celestialObjects.json"
import type { CelestialObject } from "../types/celestial"
import { getProfileForCategory, getComparableValue } from "./objectProfiles"
import { propertyBracket } from "./formatting"
import { narrowCandidates, MIN_CANDIDATES } from "./candidates"

const objects = dataset as CelestialObject[]
const byName = (name: string) => objects.find(o => o.name === name)!

function narrow(answer: CelestialObject, guesses: CelestialObject[], hintedProperties: string[] = []) {
  return narrowCandidates({
    profile: getProfileForCategory(answer.category),
    guesses,
    answer,
    dataset: objects,
    hintedProperties,
  })
}

describe("narrowCandidates", () => {
  const betelgeuse = byName("Betelgeuse")

  it("offers everything before any clue", () => {
    expect(narrow(betelgeuse, [])).toHaveLength(objects.length)
  })

  it("leaves out objects already guessed", () => {
    const guess = byName("Earth")
    expect(narrow(betelgeuse, [guess]).some(o => o.id === guess.id)).toBe(false)
  })

  it("only offers stars once the category hint says star", () => {
    const result = narrow(betelgeuse, [], ["category"])
    expect(result.length).toBeGreaterThan(MIN_CANDIDATES)
    expect(result.every(o => o.category === "star")).toBe(true)
  })

  it("rules a category out once a guess of it comes back wrong", () => {
    const result = narrow(betelgeuse, [byName("Earth")])
    expect(result.some(o => o.category === "planet")).toBe(false)
    expect(result.some(o => o.category === "star")).toBe(true)
  })

  it("keeps only stars inside the hinted diameter bracket", () => {
    const result = narrow(betelgeuse, [], ["category", "diameterKm"])
    const [low, high] = propertyBracket("diameterKm", betelgeuse.diameterKm)!
    const fitting = result.filter(o => {
      const d = getComparableValue(o, "diameterKm", objects) as number
      return o.category === "star" && d >= low && d <= high
    })
    // Either every result fits, or the list was topped up because too few did.
    expect(fitting.length === result.length || result.length === MIN_CANDIDATES).toBe(true)
  })

  it("always keeps the answer", () => {
    for (const answer of objects.slice(0, 60)) {
      const guesses = objects.filter(o => o.id !== answer.id).slice(0, 6)
      const profile = getProfileForCategory(answer.category).map(e => e.property as string)
      expect(narrow(answer, guesses, profile).some(o => o.id === answer.id)).toBe(true)
    }
  })

  it("never narrows down to a giveaway", () => {
    // Every hint revealed pins the answer down hard, yet the list still holds several objects.
    const profile = getProfileForCategory(betelgeuse.category).map(e => e.property as string)
    const result = narrow(betelgeuse, [byName("Rigel"), byName("Sirius")], profile)
    expect(result.length).toBe(MIN_CANDIDATES)
    expect(result.some(o => o.id === betelgeuse.id)).toBe(true)
  })
})
