import { describe, it, expect } from "vitest"
import { compareProperty } from "./comparison"

describe("compareProperty - numeric", () => {
  it("returns correct for identical values", () => {
    expect(compareProperty(100, 100, "numeric")).toEqual({ status: "correct" })
  })
  it("returns close for values within loose tolerance", () => {
    const result = compareProperty(100, 108, "numeric")
    expect(result.status).toBe("close")
  })
  it("returns higher when answer is greater than guess", () => {
    const result = compareProperty(100, 200, "numeric")
    expect(result.status).toBe("higher")
  })
  it("returns lower when answer is less than guess", () => {
    const result = compareProperty(200, 100, "numeric")
    expect(result.status).toBe("lower")
  })
  it("handles zero values without dividing by zero", () => {
    const result = compareProperty(0, 0, "numeric")
    expect(result.status).toBe("correct")
  })
  it("handles one zero, one nonzero", () => {
    const result = compareProperty(0, 50, "numeric")
    expect(result.status).toBe("higher")
  })
})

describe("compareProperty - temperature", () => {
  it("returns correct for identical Kelvin values", () => {
    expect(compareProperty(288, 288, "temperature").status).toBe("correct")
  })
  it("handles negative Celsius equivalents correctly (stored as Kelvin, always positive)", () => {
    const result = compareProperty(210, 218, "temperature")
    expect(["close", "higher"]).toContain(result.status)
  })
  it("returns lower when answer temperature is colder", () => {
    const result = compareProperty(288, 210, "temperature")
    expect(result.status).toBe("lower")
  })
})

describe("compareProperty - exact", () => {
  it("returns correct for matching booleans", () => {
    expect(compareProperty(true, true, "exact").status).toBe("correct")
  })
  it("returns incorrect for mismatched booleans", () => {
    expect(compareProperty(true, false, "exact").status).toBe("incorrect")
  })
  it("returns correct for matching category strings", () => {
    expect(compareProperty("planet", "planet", "exact").status).toBe("correct")
  })
  it("returns incorrect for mismatched parent body ids", () => {
    expect(compareProperty("jupiter", "saturn", "exact").status).toBe("incorrect")
  })
})

describe("compareProperty - missing values", () => {
  it("returns not_applicable when guess value is undefined", () => {
    expect(compareProperty(undefined, 100, "numeric").status).toBe("not_applicable")
  })
  it("returns not_applicable when answer value is undefined", () => {
    expect(compareProperty(100, undefined, "numeric").status).toBe("not_applicable")
  })
  it("returns not_applicable when both are undefined", () => {
    expect(compareProperty(undefined, undefined, "exact").status).toBe("not_applicable")
  })
})
