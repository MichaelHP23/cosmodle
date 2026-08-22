import { describe, it, expect } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { proposeChange, renderReport, applyChanges } from "./datasetDiff.mjs"

describe("datasetDiff", () => {
  it("renders a report naming the field, both values, and the source", () => {
    const list = []
    proposeChange(list, { id: "vega", field: "distanceFromEarthLy", from: 25, to: 25.04, reason: "parallax", source: "SIMBAD" })
    const report = renderReport(list)
    expect(report).toContain("vega")
    expect(report).toContain("distanceFromEarthLy")
    expect(report).toContain("25")
    expect(report).toContain("25.04")
    expect(report).toContain("SIMBAD")
  })

  it("says so plainly when nothing needs changing", () => {
    expect(renderReport([])).toContain("no changes")
  })

  it("applies changes to the dataset file and returns the count", () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ds-")), "d.json")
    fs.writeFileSync(file, JSON.stringify([{ id: "vega", distanceFromEarthLy: 25 }]))
    const list = []
    proposeChange(list, { id: "vega", field: "distanceFromEarthLy", from: 25, to: 25.04, reason: "parallax", source: "SIMBAD" })
    expect(applyChanges(file, list)).toBe(1)
    expect(JSON.parse(fs.readFileSync(file, "utf8"))[0].distanceFromEarthLy).toBe(25.04)
  })

  it("refuses to apply a change whose current value no longer matches", () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ds-")), "d.json")
    fs.writeFileSync(file, JSON.stringify([{ id: "vega", distanceFromEarthLy: 99 }]))
    const list = []
    proposeChange(list, { id: "vega", field: "distanceFromEarthLy", from: 25, to: 25.04, reason: "parallax", source: "SIMBAD" })
    expect(() => applyChanges(file, list)).toThrow(/vega/)
  })
})
