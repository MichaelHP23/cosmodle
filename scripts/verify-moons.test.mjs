import { describe, it, expect, vi } from "vitest"
import {
  parsePhysParTable,
  parseElemTable,
  parseValTemplate,
  meanDiameterFromDimensions,
  parseWikiPhysical,
  collectChanges,
} from "./verify-moons.mjs"

// A trimmed slice of the real physical-parameters table: one ordinary row (Moon), and one row for a
// satellite whose GM has never been measured (Nereid prints 0.00000 rather than leaving the cell
// blank), which is the case the "gm <= 0 means unmeasured" convention exists to cover.
const PHYS_PAR_FIXTURE = `
<table id="sat_phys_par">
<tbody>
<tr>
  <td class="text-left">Earth</td>
  <td class="text-left">Moon</td>
  <td class="text-center">301</td>
  <td class="text-center">
    4902.800
  <td class="text-center">
    0.001
  <td class="text-center">
    DE440
  </td>
  <td class="text-center">
    1737.4
  <td class="text-center">
    0.1
  <td class="text-center">
  <a href="#refs">1</a>
  </td>
  <td class="text-center">
    3.344
  <td class="text-center">
    0.001
  <td class="text-center">
  <a href="#notes">*</a>
  </td>
</tr>
<tr>
  <td class="text-left">Neptune</td>
  <td class="text-left">Nereid</td>
  <td class="text-center">802</td>
  <td class="text-center">0.00000</td>
  <td class="text-center">0.00000</td>
  <td class="text-center">NEP101</td>
  <td class="text-center">170.00</td>
  <td class="text-center">25.00</td>
  <td class="text-center">1</td>
  <td class="text-center">n/a</td>
  <td class="text-center">n/a</td>
  <td class="text-center">n/a</td>
</tr>
</tbody>
</table>
`

// A trimmed slice of the real mean-elements table, same two satellites.
const ELEM_FIXTURE = `
<table id="sat_elem">
<tbody>
<tr>
  <td>0</td>
  <td>Earth</td>
  <td>Moon</td>
  <td>301</td>
  <td class="text-center">DE405/LE405</td>
  <td class="text-center"><a href="#EC">ecliptic</a></td>
  <td class="text-nowrap">2000-01-01.5</td>
  <td class="text-center">384400.</td>
  <td class="text-center">0.0554</td>
  <td class="text-center">318.15</td>
  <td class="text-center">135.27</td>
  <td class="text-center">5.16</td>
  <td class="text-center">125.08</td>
  <td class="text-center">27.322</td>
  <td class="text-center">5.997</td>
  <td class="text-center">18.600</td>
  <td class="text-center"></td>
  <td class="text-center"></td>
  <td class="text-center"></td>
  <td class="text-center">n/a</td>
</tr>
<tr>
  <td>1</td>
  <td>Neptune</td>
  <td>Nereid</td>
  <td>802</td>
  <td class="text-center">NEP101</td>
  <td class="text-center"><a href="#EC">ecliptic</a></td>
  <td class="text-nowrap">2000-01-01.5</td>
  <td class="text-center">5,513,400.</td>
  <td class="text-center">0.7512</td>
  <td class="text-center">0</td>
  <td class="text-center">0</td>
  <td class="text-center">7.1</td>
  <td class="text-center">0</td>
  <td class="text-center">360.13</td>
  <td class="text-center">0</td>
  <td class="text-center">0</td>
  <td class="text-center"></td>
  <td class="text-center"></td>
  <td class="text-center"></td>
  <td class="text-center">n/a</td>
</tr>
</tbody>
</table>
`

describe("parsePhysParTable", () => {
  const records = parsePhysParTable(PHYS_PAR_FIXTURE)

  it("reads GM, mean radius and mean density for an ordinary row", () => {
    expect(records.Moon).toEqual({ gm: 4902.8, radius: 1737.4, density: 3.344 })
  })

  it("keeps the JPL 0.00000 sentinel for an unmeasured GM rather than dropping the row", () => {
    expect(records.Nereid.gm).toBe(0)
    expect(records.Nereid.radius).toBe(170)
  })

  it("refuses a table it cannot find", () => {
    expect(() => parsePhysParTable("<html>nothing here</html>")).toThrow(/could not find table/)
  })
})

describe("parseElemTable", () => {
  const records = parseElemTable(ELEM_FIXTURE)

  it("reads the semi-major axis and period", () => {
    expect(records.Moon).toEqual({ a: 384400, period: 27.322 })
  })

  it("strips thousands separators from the semi-major axis", () => {
    expect(records.Nereid.a).toBe(5513400)
  })

  it("refuses a table it cannot find", () => {
    expect(() => parseElemTable("<html>nothing here</html>")).toThrow(/could not find table/)
  })
})

describe("parseValTemplate", () => {
  it("reads the main number with no exponent", () => {
    expect(parseValTemplate("{{val|81|2|u=km}}")).toBe(81)
  })

  it("applies an exponent named out of order", () => {
    expect(parseValTemplate("{{val|1.91|0.64|u=kg|e=18}}")).toBeCloseTo(1.91e18)
    expect(parseValTemplate("{{val|6.8|1.7|e=13|u=kg}}")).toBeCloseTo(6.8e13)
  })

  it("returns null when there is no val template", () => {
    expect(parseValTemplate("assumed synchronous")).toBeNull()
  })
})

describe("meanDiameterFromDimensions", () => {
  it("takes the geometric mean of the three axis lengths", () => {
    expect(meanDiameterFromDimensions("156 x 126 x 126 km")).toBeCloseTo(Math.cbrt(156 * 126 * 126), 6)
  })

  it("does not mistake a citation year after the unit for a fourth measurement", () => {
    const withCitation = '156 × 126 × 126 km<ref name="Karkoschka, Voyager 2001" />'
    expect(meanDiameterFromDimensions(withCitation)).toBeCloseTo(Math.cbrt(156 * 126 * 126), 6)
  })

  it("returns null when fewer than three numbers are present", () => {
    expect(meanDiameterFromDimensions("135 km")).toBeNull()
  })
})

describe("parseWikiPhysical", () => {
  it("prefers mean_diameter over mean_radius and dimensions", () => {
    const wikitext = "\n| mass = {{val|6.8|1.7|e=13|u=kg}}\n| mean_diameter = {{val|7.8|1.0|u=km}}\n| dimensions = 9.8 x 8.4 x 5.6 km\n"
    expect(parseWikiPhysical(wikitext)).toEqual({ massKg: 6.8e13, diameterKm: 7.8 })
  })

  it("doubles mean_radius into a diameter when mean_diameter is absent", () => {
    const wikitext = "\n| mass = {{val|1.91|0.64|u=kg|e=18}}\n| mean_radius = {{val|81|2|u=km}}\n"
    expect(parseWikiPhysical(wikitext)).toEqual({ massKg: 1.91e18, diameterKm: 162 })
  })

  it("falls back to the geometric mean of dimensions when neither radius nor diameter is given", () => {
    const wikitext = "\n| mass = {{val|1.1671|0.1730|u=kg|e=18}}\n| dimensions = 156 x 126 x 126 km\n"
    const result = parseWikiPhysical(wikitext)
    expect(result.massKg).toBeCloseTo(1.1671e18)
    expect(result.diameterKm).toBeCloseTo(Math.cbrt(156 * 126 * 126), 6)
  })

  it("returns a null mass when the infobox has no mass field at all, as for Nereid", () => {
    // Nereid's real infobox has a mean_diameter but no mass field: no source has ever measured it.
    const wikitext = "\n| mean_diameter = {{val|335|-|345|u=km}}\n"
    expect(parseWikiPhysical(wikitext)).toEqual({ massKg: null, diameterKm: 335 })
  })

  it("returns both fields null when the infobox has neither", () => {
    const wikitext = "\n| rotation = assumed synchronous\n"
    expect(parseWikiPhysical(wikitext)).toEqual({ massKg: null, diameterKm: null })
  })
})

describe("collectChanges", () => {
  const physRecords = { Moon: { gm: 4902.8, radius: 1737.4, density: 3.344 }, Nereid: { gm: 0, radius: 170, density: NaN } }
  const elemRecords = { Moon: { a: 384400, period: 27.322 }, Nereid: { a: 5513400, period: 360.13 } }

  it("proposes nothing when the dataset already agrees within tolerance", () => {
    const moon = { id: "moon", name: "Moon", category: "moon", distanceFromParentKm: 384400, orbitalPeriodDays: 27.3, diameterKm: 3474, massKg: 7.342e22, gravityMs2: 1.62 }
    expect(collectChanges([moon], physRecords, elemRecords)).toEqual([])
  })

  it("proposes a correction when a field disagrees beyond tolerance", () => {
    const moon = { id: "moon", name: "Moon", category: "moon", distanceFromParentKm: 384400, orbitalPeriodDays: 27.3, diameterKm: 3000, massKg: 7.342e22, gravityMs2: 1.62 }
    const changes = collectChanges([moon], physRecords, elemRecords)
    expect(changes).toEqual([
      expect.objectContaining({ id: "moon", field: "diameterKm", from: 3000, to: 3474.8 }),
    ])
  })

  it("rejects the known irregular-moon gravity mismatch instead of proposing it", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    // Epimetheus's own mass and diameter imply a mean-sphere gravity well above its stated value,
    // the same gap the physical-consistency test in celestialObjects.test.ts exempts it for.
    const phys = { Epimetheus: { gm: 0.03514, radius: 58.2, density: 0.6375 } }
    const elem = { Epimetheus: { a: 151410, period: 0.694 } }
    const epimetheus = { id: "epimetheus", name: "Epimetheus", category: "moon", distanceFromParentKm: 151410, orbitalPeriodDays: 0.694, diameterKm: 116, massKg: 5.3e17, gravityMs2: 0.007 }
    const changes = collectChanges([epimetheus], phys, elem)
    expect(changes.some(c => c.field === "gravityMs2")).toBe(false)
    expect(error).toHaveBeenCalledWith(expect.stringContaining("irregular moon"))
    error.mockRestore()
  })

  it("checks diameterKm from JPL alone when GM is unmeasured, and skips mass/gravity", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    const nereid = { id: "nereid", name: "Nereid", category: "moon", distanceFromParentKm: 5513400, orbitalPeriodDays: 360.13, diameterKm: 200, massKg: 3.1e19, gravityMs2: 0.07 }
    const changes = collectChanges([nereid], physRecords, elemRecords)
    expect(changes).toEqual([
      expect.objectContaining({ id: "nereid", field: "diameterKm", from: 200, to: 340 }),
    ])
    expect(error).toHaveBeenCalledWith(expect.stringContaining("no measured mass for nereid"))
    error.mockRestore()
  })

  it("falls back to Wikipedia-derived values when JPL has no row for the satellite", () => {
    const puck = { id: "puck", name: "Puck", category: "moon", distanceFromParentKm: 86010, orbitalPeriodDays: 0.762, diameterKm: 100, massKg: 1.91e18, gravityMs2: 0.019 }
    const wikiPhysicalById = { puck: { massKg: 1.91e18, diameterKm: 162 } }
    const changes = collectChanges([puck], {}, { Puck: { a: 86010, period: 0.762 } }, wikiPhysicalById)
    expect(changes).toEqual([
      expect.objectContaining({ id: "puck", field: "diameterKm", from: 100, to: 162, source: "Wikipedia infobox" }),
    ])
  })
})
