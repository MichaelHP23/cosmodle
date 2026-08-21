import { describe, it, expect } from "vitest"
import { getProfileForCategory, getSearchHint, getComparableValue } from "./objectProfiles"
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

describe("getComparableValue", () => {
  it("converts distanceFromSunAU to ly when distanceFromEarthLy is asked for", () => {
    const pluto: CelestialObject = { id: "pluto", name: "Pluto", category: "dwarf_planet", distanceFromSunAU: 39.48 }
    expect(getComparableValue(pluto, "distanceFromEarthLy")).toBeCloseTo(39.48 / 63241.077, 10)
  })

  it("converts distanceFromEarthLy to AU when distanceFromSunAU is asked for", () => {
    const quasar: CelestialObject = { id: "3c48", name: "3C 48", category: "quasar", distanceFromEarthLy: 4_500_000_000 }
    expect(getComparableValue(quasar, "distanceFromSunAU")).toBeCloseTo(4_500_000_000 * 63241.077, 0)
  })

  it("prefers the object's own value over conversion", () => {
    const star: CelestialObject = { id: "sun", name: "Sun", category: "star", distanceFromEarthLy: 0.0000158 }
    expect(getComparableValue(star, "distanceFromEarthLy")).toBe(0.0000158)
  })

  it("returns undefined when there is no direct or convertible value", () => {
    const constellation: CelestialObject = { id: "orion", name: "Orion", category: "constellation" }
    expect(getComparableValue(constellation, "distanceFromEarthLy")).toBeUndefined()
  })

  it("falls back to a moon's parent body's distance when a dataset is provided", () => {
    const jupiter: CelestialObject = { id: "jupiter", name: "Jupiter", category: "planet", distanceFromSunAU: 5.2 }
    const europa: CelestialObject = { id: "europa", name: "Europa", category: "moon", parentBodyId: "jupiter", distanceFromParentKm: 671100 }
    const dataset = [jupiter, europa]
    expect(getComparableValue(europa, "distanceFromEarthLy", dataset)).toBeCloseTo(5.2 / 63241.077, 10)
  })

  it("does not resolve a moon's parent distance without a dataset", () => {
    const europa: CelestialObject = { id: "europa", name: "Europa", category: "moon", parentBodyId: "jupiter", distanceFromParentKm: 671100 }
    expect(getComparableValue(europa, "distanceFromEarthLy")).toBeUndefined()
  })

  it("derives surface gravity from mass and diameter, matching the published value", () => {
    const earth: CelestialObject = { id: "earth", name: "Earth", category: "planet", massKg: 5.972e24, diameterKm: 12742 }
    // published 9.81 m/s^2
    expect(getComparableValue({ ...earth, gravityMs2: undefined }, "gravityMs2")).toBeCloseTo(9.81, 1)
  })

  it("derives a quasar's diameter as its event horizon, and a gravity from it", () => {
    const quasar: CelestialObject = { id: "q", name: "Q", category: "quasar", massKg: 1.3e40 }
    // M87*-scale mass -> ~3.9e10 km event horizon, matching the dataset's black-hole diameters
    expect(getComparableValue(quasar, "diameterKm") as number).toBeCloseTo(3.86e10, -9)
    expect(getComparableValue(quasar, "gravityMs2")).toBeGreaterThan(0)
  })

  it("treats a constellation's brightest star as its apparent magnitude and vice versa", () => {
    const orion: CelestialObject = { id: "orion", name: "Orion", category: "constellation", brightestStarMagnitude: 0.13 }
    const sirius: CelestialObject = { id: "sirius", name: "Sirius", category: "star", apparentMagnitude: -1.46 }
    expect(getComparableValue(orion, "apparentMagnitude")).toBe(0.13)
    expect(getComparableValue(sirius, "brightestStarMagnitude")).toBe(-1.46)
  })

  it("gives Milky Way objects zero redshift and non-constellations zero sky area and no zodiac", () => {
    const star: CelestialObject = { id: "s", name: "S", category: "star" }
    expect(getComparableValue(star, "redshift")).toBe(0)
    expect(getComparableValue(star, "areaSqDeg")).toBe(0)
    expect(getComparableValue(star, "isZodiac")).toBe(false)
  })

  it("puts solar-system bodies in both hemispheres and derives their parent and orbital radius", () => {
    const vesta: CelestialObject = { id: "vesta", name: "Vesta", category: "asteroid", distanceFromSunAU: 2.36 }
    expect(getComparableValue(vesta, "hemisphere")).toBe("both")
    expect(getComparableValue(vesta, "parentBodyId")).toBe("sun")
    expect(getComparableValue(vesta, "distanceFromParentKm") as number).toBeCloseTo(2.36 * 1.495978707e8, -3)
  })

  it("derives a tidally locked moon's rotation period from its orbit", () => {
    const titan: CelestialObject = { id: "titan", name: "Titan", category: "moon", orbitalPeriodDays: 15.95 }
    expect(getComparableValue(titan, "rotationPeriodHours")).toBeCloseTo(15.95 * 24, 5)
  })

  it("reports a constellation's physical properties through its brightest star", () => {
    const rigel: CelestialObject = { id: "rigel", name: "Rigel", category: "star", distanceFromEarthLy: 860, massKg: 4.18e31, temperatureK: 12100 }
    const orion: CelestialObject = { id: "orion", name: "Orion", category: "constellation", brightestStarId: "rigel", brightestStarMagnitude: 0.13 }
    const data = [rigel, orion]
    expect(getComparableValue(orion, "distanceFromEarthLy", data)).toBe(860)
    expect(getComparableValue(orion, "massKg", data)).toBe(4.18e31)
    expect(getComparableValue(orion, "temperatureK", data)).toBe(12100)
  })

  it("leaves a constellation blank when its brightest star is not in the dataset", () => {
    const phoenix: CelestialObject = { id: "phoenix", name: "Phoenix", category: "constellation", brightestStarMagnitude: 2.38 }
    expect(getComparableValue(phoenix, "massKg", [phoenix])).toBeUndefined()
    expect(getComparableValue(phoenix, "distanceFromEarthLy", [phoenix])).toBeUndefined()
    // its own recorded magnitude still resolves
    expect(getComparableValue(phoenix, "apparentMagnitude", [phoenix])).toBe(2.38)
  })

  it("leaves genuinely inapplicable properties undefined rather than inventing them", () => {
    const jupiter: CelestialObject = { id: "jupiter", name: "Jupiter", category: "planet", massKg: 1.9e27, diameterKm: 139820 }
    const orion: CelestialObject = { id: "orion", name: "Orion", category: "constellation" }
    const bh: CelestialObject = { id: "bh", name: "BH", category: "black_hole", massKg: 1e31, diameterKm: 30 }
    expect(getComparableValue(jupiter, "galaxyType")).toBeUndefined()
    expect(getComparableValue(jupiter, "nebulaType")).toBeUndefined()
    expect(getComparableValue(orion, "massKg")).toBeUndefined()
    expect(getComparableValue(bh, "apparentMagnitude")).toBeUndefined()
  })
})
