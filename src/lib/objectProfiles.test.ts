import { describe, it, expect } from "vitest"
import { getProfileForCategory, getSearchHint } from "./objectProfiles"
import type { CelestialObject } from "../types/celestial"

describe("getProfileForCategory", () => {
  it("returns the planet profile with distanceFromSunAU labeled 'Distance from Sun'", () => {
    const profile = getProfileForCategory("planet")
    const distance = profile.find(p => p.property === "distanceFromSunAU")
    expect(distance?.label).toBe("Distance from Sun")
  })
  it("returns the moon profile with distanceFromParentKm labeled 'Distance from Parent'", () => {
    const profile = getProfileForCategory("moon")
    const distance = profile.find(p => p.property === "distanceFromParentKm")
    expect(distance?.label).toBe("Distance from Parent")
  })
  it("moon profile does not include rings", () => {
    const profile = getProfileForCategory("moon")
    expect(profile.find(p => p.property === "rings")).toBeUndefined()
  })
  it("asteroid profile includes orbitalPeriodDays and excludes gravity", () => {
    const profile = getProfileForCategory("asteroid")
    expect(profile.find(p => p.property === "orbitalPeriodDays")).toBeDefined()
    expect(profile.find(p => p.property === "gravityMs2")).toBeUndefined()
  })
  it("comet profile is the same shape as asteroid", () => {
    expect(getProfileForCategory("comet")).toEqual(getProfileForCategory("asteroid"))
  })
  it("star profile uses distanceFromEarthLy, not distanceFromSunAU", () => {
    const profile = getProfileForCategory("star")
    expect(profile.find(p => p.property === "distanceFromEarthLy")?.label).toBe("Distance from Earth")
    expect(profile.find(p => p.property === "distanceFromSunAU")).toBeUndefined()
  })
  it("black hole profile has its own event-horizon-labeled diameter, distinct from galaxy profile", () => {
    const blackHole = getProfileForCategory("black_hole")
    const galaxy = getProfileForCategory("galaxy")
    expect(blackHole.find(p => p.property === "diameterKm")?.label).toBe("Event Horizon Diameter")
    expect(blackHole).not.toEqual(galaxy)
  })
  it("nebula profile excludes mass", () => {
    const profile = getProfileForCategory("nebula")
    expect(profile.find(p => p.property === "massKg")).toBeUndefined()
  })
  it("quasar profile uses distanceFromEarthLy and central black hole mass", () => {
    const profile = getProfileForCategory("quasar")
    expect(profile.find(p => p.property === "distanceFromEarthLy")).toBeDefined()
    expect(profile.find(p => p.property === "massKg")?.label).toBe("Central Black Hole Mass")
  })
  it("constellation profile uses hemisphere/area/brightest-star instead of distance or mass", () => {
    const profile = getProfileForCategory("constellation")
    expect(profile.find(p => p.property === "hemisphere")).toBeDefined()
    expect(profile.find(p => p.property === "areaSqDeg")).toBeDefined()
    expect(profile.find(p => p.property === "brightestStarMagnitude")).toBeDefined()
    expect(profile.find(p => p.property === "distanceFromEarthLy")).toBeUndefined()
    expect(profile.find(p => p.property === "massKg")).toBeUndefined()
  })
  it("exoplanet profile uses parentBodyId labeled 'Host Star' and distanceFromEarthLy, not distanceFromSunAU", () => {
    const profile = getProfileForCategory("exoplanet")
    expect(profile.find(p => p.property === "parentBodyId")?.label).toBe("Host Star")
    expect(profile.find(p => p.property === "distanceFromEarthLy")).toBeDefined()
    expect(profile.find(p => p.property === "distanceFromSunAU")).toBeUndefined()
  })
})

describe("getSearchHint", () => {
  it("builds a compact stat line from the object's own profile", () => {
    const mars: CelestialObject = { id: "mars", name: "Mars", category: "planet", distanceFromSunAU: 1.52, temperatureK: 210 }
    expect(getSearchHint(mars)).toBe("planet · 1.52 AU · -63°C")
  })

  it("skips missing values instead of showing an em dash", () => {
    const sparse: CelestialObject = { id: "x", name: "X", category: "star", distanceFromEarthLy: 4.25 }
    expect(getSearchHint(sparse)).toBe("star · 4.25 ly")
  })

  it("uses the parent body and distance for moons", () => {
    const europa: CelestialObject = { id: "europa", name: "Europa", category: "moon", parentBodyId: "jupiter", distanceFromParentKm: 671100 }
    expect(getSearchHint(europa)).toBe("moon · Jupiter · 671,100 km")
  })
})
