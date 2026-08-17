import { describe, it, expect } from "vitest"
import { getProfileForCategory } from "./objectProfiles"

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
})
