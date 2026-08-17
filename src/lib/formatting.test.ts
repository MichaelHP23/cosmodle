import { describe, it, expect } from "vitest"
import { formatAU, formatKm, formatKelvinAsCelsius, formatDays, formatHours, formatMassKg, formatGravity } from "./formatting"

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
})
