import { describe, it, expect } from "vitest"
import { formatAU, formatKm, formatKelvinAsCelsius, formatDays, formatHours, formatMassKg, formatGravity, formatLightYears, formatPropertyValue, formatPropertyRange, formatAreaSqDeg, formatMagnitude } from "./formatting"

describe("formatting", () => {
  it("formats AU with 2 decimals", () => {
    expect(formatAU(1.523)).toBe("1.52 AU")
  })
  it("formats km with thousands separators", () => {
    expect(formatKm(384400)).toBe("384,400 km")
  })
  it("converts Kelvin to Celsius, rounded", () => {
    expect(formatKelvinAsCelsius(210)).toBe("-63°C")
  })
  it("converts a very cold Kelvin value to negative Celsius correctly", () => {
    expect(formatKelvinAsCelsius(44)).toBe("-229°C")
  })
  it("formats days", () => {
    expect(formatDays(687)).toBe("687 days")
  })
  it("formats hours", () => {
    expect(formatHours(24.62)).toBe("24.62 hours")
  })
  it("formats mass in kg using compact scientific form", () => {
    expect(formatMassKg(5.972e24)).toBe("5.97 × 10^24 kg")
  })
  it("formats gravity", () => {
    expect(formatGravity(9.81)).toBe("9.81 m/s²")
  })
  it("formats light years with 3 significant figures", () => {
    expect(formatLightYears(4.25)).toBe("4.25 ly")
  })
  it("formats very small light-year distances without collapsing to zero", () => {
    expect(formatLightYears(0.0000158)).toBe("0.0000158 ly")
  })
  it("formats sky area in square degrees", () => {
    expect(formatAreaSqDeg(1280)).toBe("1,280 sq°")
  })
  it("formats apparent magnitude", () => {
    expect(formatMagnitude(0.13)).toBe("mag 0.13")
  })
})

describe("formatPropertyValue", () => {
  it("returns an em dash for missing values", () => {
    expect(formatPropertyValue("diameterKm", undefined)).toBe("—")
  })
  it("formats booleans as Yes/No", () => {
    expect(formatPropertyValue("rings", true)).toBe("Yes")
    expect(formatPropertyValue("rings", false)).toBe("No")
  })
  it("routes distanceFromEarthLy through formatLightYears", () => {
    expect(formatPropertyValue("distanceFromEarthLy", 4.25)).toBe("4.25 ly")
  })
  it("title-cases category and parentBodyId strings", () => {
    expect(formatPropertyValue("category", "black_hole")).toBe("Black Hole")
    expect(formatPropertyValue("parentBodyId", "jupiter")).toBe("Jupiter")
  })
  it("title-cases hemisphere and routes area/magnitude through their formatters", () => {
    expect(formatPropertyValue("hemisphere", "northern")).toBe("Northern")
    expect(formatPropertyValue("areaSqDeg", 594)).toBe("594 sq°")
    expect(formatPropertyValue("brightestStarMagnitude", 0.13)).toBe("mag 0.13")
  })
})

describe("formatPropertyRange", () => {
  it("brackets a diameter by order of magnitude", () => {
    expect(formatPropertyRange("diameterKm", 3474)).toBe("1,000 - 10,000 km")
  })
  it("brackets a light-year distance by order of magnitude", () => {
    expect(formatPropertyRange("distanceFromEarthLy", 8.6)).toBe("1 - 10 ly")
  })
  it("brackets a sub-unit distance without collapsing to zero", () => {
    expect(formatPropertyRange("distanceFromSunAU", 0.387)).toBe("0.10 - 1.00 AU")
  })
  it("brackets an orbital period in days", () => {
    expect(formatPropertyRange("orbitalPeriodDays", 687)).toBe("100 - 1,000 days")
  })
  it("brackets sky area", () => {
    expect(formatPropertyRange("areaSqDeg", 1280)).toBe("1,000 - 10,000 sq°")
  })
  it("brackets mass by exponent without repeating the mantissa", () => {
    expect(formatPropertyRange("massKg", 5.972e24)).toBe("10^24 - 10^25 kg")
  })
  it("brackets gravity, keeping tiny values in scientific notation", () => {
    expect(formatPropertyRange("gravityMs2", 9.81)).toBe("1 - 10 m/s²")
    expect(formatPropertyRange("gravityMs2", 3.4e-10)).toBe("1.00e-10 - 1.00e-9 m/s²")
  })

  it("brackets a temperature in Celsius, since Celsius is what the player sees", () => {
    expect(formatPropertyRange("temperatureK", 210)).toBe("-70 to -60°C")
  })
  it("brackets a hot temperature on a step matching its scale", () => {
    expect(formatPropertyRange("temperatureK", 5778)).toBe("5,000 - 6,000°C")
  })
  it("brackets a temperature sitting near freezing on a readable step", () => {
    expect(formatPropertyRange("temperatureK", 276)).toBe("0 - 10°C")
  })

  it("brackets a discovery year to its decade", () => {
    expect(formatPropertyRange("discoveredYear", 1781)).toBe("1780s")
    expect(formatPropertyRange("discoveredYear", 1930)).toBe("1930s")
  })
  it("keeps an always-known object's year out of the decade brackets", () => {
    expect(formatPropertyRange("discoveredYear", -3000)).toBe("Prehistoric")
  })

  it("brackets magnitudes a whole step at a time, in whatever form each one already displays", () => {
    expect(formatPropertyRange("brightestStarMagnitude", 0.13)).toBe("mag 0 - 1")
    expect(formatPropertyRange("apparentMagnitude", 0.13)).toBe("0 - 1")
  })
  it("brackets a negative magnitude without stacking minus signs against the separator", () => {
    expect(formatPropertyRange("brightestStarMagnitude", -1.46)).toBe("mag -2 to -1")
  })
  it("brackets redshift on a half step", () => {
    expect(formatPropertyRange("redshift", 0.158)).toBe("0 - 0.5")
    expect(formatPropertyRange("redshift", 2.7)).toBe("2.5 - 3")
  })

  it("leaves properties with no meaningful range exactly as they were", () => {
    expect(formatPropertyRange("category", "black_hole")).toBe("Black Hole")
    expect(formatPropertyRange("hemisphere", "northern")).toBe("Northern")
    expect(formatPropertyRange("rings", true)).toBe("Yes")
    expect(formatPropertyRange("isZodiac", false)).toBe("No")
    expect(formatPropertyRange("galaxyType", "spiral")).toBe("spiral")
    expect(formatPropertyRange("nebulaType", "emission")).toBe("emission")
    expect(formatPropertyRange("blackHoleType", "stellar")).toBe("stellar")
    expect(formatPropertyRange("parentBodyId", "jupiter")).toBe("Jupiter")
  })
  it("returns an em dash for missing values", () => {
    expect(formatPropertyRange("diameterKm", undefined)).toBe("—")
    expect(formatPropertyRange("massKg", null)).toBe("—")
  })
  it("handles zero without breaking", () => {
    expect(formatPropertyRange("moons", 0)).toBe("0 - 1")
    expect(formatPropertyRange("redshift", 0)).toBe("0 - 0.5")
    expect(formatPropertyRange("areaSqDeg", 0)).toBe("0 - 1 sq°")
  })
  it("keeps a negative value's low end genuinely lower", () => {
    expect(formatPropertyRange("diameterKm", -3474)).toBe("-10,000 to -1,000 km")
  })
})

describe("large numbers carry thousands separators", () => {
  it("groups temperatures", () => {
    expect(formatKelvinAsCelsius(24300)).toBe("24,027°C")
  })
  it("groups light years", () => {
    expect(formatLightYears(2537000)).toBe("2,540,000 ly")
  })
  it("groups hours", () => {
    expect(formatHours(5832.5)).toBe("5,833 hours")
  })
  it("groups days", () => {
    expect(formatDays(90560)).toBe("90,560 days")
  })
  it("still shows sub-decimal light years in full", () => {
    expect(formatLightYears(0.0000158)).toBe("0.0000158 ly")
  })
})
