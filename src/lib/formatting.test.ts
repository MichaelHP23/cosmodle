import { describe, it, expect } from "vitest"
import { formatAU, formatKm, formatKelvinAsCelsius, formatDays, formatHours, formatMassKg, formatGravity, formatLightYears, formatPropertyValue } from "./formatting"

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
})
