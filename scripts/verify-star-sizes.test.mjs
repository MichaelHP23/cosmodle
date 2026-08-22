import { describe, it, expect } from "vitest"
import { predictedMagnitude, bolometricCorrection } from "./verify-star-sizes.mjs"

describe("predictedMagnitude", () => {
  it("reproduces the Sun's apparent magnitude from its own radius, temperature and distance", () => {
    // One solar radius, one solar Teff, one astronomical unit expressed in light years.
    const m = predictedMagnitude({ radiusSolar: 1, teff: 5772, distanceLy: 1.58125e-5 })
    expect(m).toBeCloseTo(-26.7, 0)
  })

  it("reproduces Vega, which is 2.36 solar radii at 9600 K and 25 ly", () => {
    expect(predictedMagnitude({ radiusSolar: 2.36, teff: 9600, distanceLy: 25 })).toBeCloseTo(0.03, 0)
  })

  it("gets dimmer as the star gets further away", () => {
    const near = predictedMagnitude({ radiusSolar: 1, teff: 5772, distanceLy: 10 })
    const far = predictedMagnitude({ radiusSolar: 1, teff: 5772, distanceLy: 100 })
    expect(far).toBeGreaterThan(near)
  })

  it("returns a finite bolometric correction across the whole temperature range in the dataset", () => {
    for (const teff of [3000, 3600, 5000, 5772, 9600, 14000, 24000, 40000]) {
      expect(Number.isFinite(bolometricCorrection(teff))).toBe(true)
    }
  })
})
