import { describe, it, expect } from "vitest"
import { formatAU, formatKm, formatKelvinAsCelsius, formatDays, formatHours, formatMassKg, formatGravity, formatLightYears, formatPropertyValue, formatAreaSqDeg, formatMagnitude } from "./formatting"

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
