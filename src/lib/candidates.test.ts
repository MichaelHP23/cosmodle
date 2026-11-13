import { describe, it, expect } from "vitest"
import dataset from "../data/celestialObjects.json"
import type { CelestialObject } from "../types/celestial"
import { getProfileForCategory, getComparableValue } from "./objectProfiles"
import { propertyBracket } from "./formatting"
import { narrowCandidates, minimumCandidates, MIN_CANDIDATES } from "./candidates"

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

  it("fills a short list with the objects that come closest to fitting", () => {
    // Earth's free temperature hint fits almost nothing else, so the rest are near misses.
    const earth = byName("Earth")
    const result = narrowCandidates({
      profile: getProfileForCategory(earth.category),
      guesses: [],
      answer: earth,
      dataset: objects,
      hintedProperties: ["temperatureK"],
      minCandidates: 20,
    })
    expect(result).toHaveLength(20)
    expect(result.some(o => o.id === "earth")).toBe(true)
    // Nothing wildly hotter, like a star, is used as filler while near-Earth temperatures are left.
    expect(result.some(o => o.category === "star")).toBe(false)
  })
})

describe("narrowCandidates type rule", () => {
  it("never pads a known type with objects of another type", () => {
    // Category plus every other hint leaves almost nothing, yet the fillers are still all stars.
    for (const name of ["Betelgeuse", "Mars", "Ganymede", "Andromeda Galaxy"]) {
      const answer = objects.find(o => o.name === name)
      if (!answer) continue
      const profile = getProfileForCategory(answer.category)
      const result = narrowCandidates({
        profile,
        guesses: [],
        answer,
        dataset: objects,
        hintedProperties: profile.map(e => e.property as string),
        minCandidates: 30,
      })
      expect(result.every(o => o.category === answer.category)).toBe(true)
    }
  })

  it("never pads with a type a guess has ruled out", () => {
    const answer = objects.find(o => o.name === "Earth")!
    const result = narrowCandidates({
      profile: getProfileForCategory(answer.category),
      guesses: [objects.find(o => o.name === "Moon")!],
      answer,
      dataset: objects,
      hintedProperties: ["temperatureK"],
      minCandidates: 30,
    })
    expect(result.some(o => o.category === "moon")).toBe(false)
  })
})

describe("minimumCandidates", () => {
  it("keeps the list long early and lets it shrink as guesses run out", () => {
    expect(minimumCandidates(15)).toBe(30)
    expect(minimumCandidates(5)).toBe(10)
    expect(minimumCandidates(1)).toBe(MIN_CANDIDATES)
  })
})
