import { describe, it, expect } from "vitest"
import { getObjectColor } from "./objectVisuals"
import type { CelestialObject } from "../types/celestial"

describe("getObjectColor", () => {
  it("uses the object's own color when set", () => {
    const mars = { id: "mars", name: "Mars", category: "planet", color: "#c1440e" } as CelestialObject
    expect(getObjectColor(mars)).toBe("#c1440e")
  })

  it("falls back to a category default when color is missing", () => {
    const unknownMoon = { id: "x", name: "X", category: "moon" } as CelestialObject
    expect(getObjectColor(unknownMoon)).toBe("#9a9a9a")
  })

  it("has a distinct default per category", () => {
    const star = { id: "s", name: "S", category: "star" } as CelestialObject
    const blackHole = { id: "b", name: "B", category: "black_hole" } as CelestialObject
    expect(getObjectColor(star)).not.toBe(getObjectColor(blackHole))
  })
})
