import { describe, it, expect, vi } from "vitest"
import { parseConstellationTable, collectChanges, normalizeName } from "./verify-constellations.mjs"

// Four rows lifted from the real table, chosen for the ways they are awkward: a name wrapped in
// nested templates, a brightest star whose display text is a template and cleans away to nothing, a
// magnitude written with a real minus sign, and a name the dataset disambiguates.
const FIXTURE = `! rowspan="2" |Area (sq. deg.)
|-
| [[Corona Australis]]{{br}}{{nowrap|{{IPAc-en|k|oʊ}}<ref name="oed" />}} || CrA || CorA || Coronae Australis || data-sort-value="0" | ancient ([[Ptolemy]]) || southern [[crown]] || [[Alpha Coronae Australis|Meridiana]]
| 4.09
| 128
|-
| [[Hercules (constellation)|Hercules]]{{br}}{{IPAc-en|ˈ|h}} || Her || Herc || Herculis || data-sort-value="0" | ancient ([[Ptolemy]]) || [[Hercules]] (mythological character) || [[β Herculis|{{shy|Korne|phoros}}]]
| 2.81
| 1225
|-
| [[Canis Major]]{{br}}{{IPAc-en|ˈ|k}} || CMa || CMaj || Canis Majoris || data-sort-value="0" | ancient ([[Ptolemy]]) || greater dog || [[Sirius]]
| −1.46
| 380
|-
| [[Andromeda (constellation)|Andromeda]]{{br}}{{IPAc-en|æ|n}} || And || Andr || Andromedae || data-sort-value="0" | ancient ([[Ptolemy]]) || [[Andromeda (mythology)|Andromeda]] || [[Alpheratz]]
| 2.06
| 722
|}`

const rows = parseConstellationTable(FIXTURE, 4)

describe("parseConstellationTable", () => {
  it("reads a name out of nested templates", () => {
    expect(rows[0]).toMatchObject({ name: "Corona Australis", area: 128, magnitude: 4.09 })
  })

  it("keeps the columns aligned when a cell cleans away to nothing", () => {
    // Korne|phoros is a {{shy}} template, so the star's display text vanishes. Dropping the empty
    // cell would shift area and magnitude one column left and silently verify the wrong numbers.
    expect(rows[1]).toMatchObject({ name: "Hercules", brightestStar: "", area: 1225, magnitude: 2.81 })
  })

  it("parses a magnitude written with a minus sign rather than a hyphen", () => {
    expect(rows[2].magnitude).toBe(-1.46)
  })

  it("refuses a table that yields the wrong number of rows", () => {
    expect(() => parseConstellationTable(FIXTURE, 88)).toThrow(/parsed 4 rows, expected 88/)
  })

  it("refuses a table it cannot find", () => {
    expect(() => parseConstellationTable("nothing here")).toThrow(/area column is gone/)
  })
})

describe("normalizeName", () => {
  it("strips the disambiguation the dataset carries", () => {
    expect(normalizeName("Andromeda (constellation)")).toBe("andromeda")
    expect(normalizeName("Canis Major")).toBe("canis major")
  })
})

describe("collectChanges", () => {
  const dataset = [
    { id: "andromeda_constellation", name: "Andromeda (constellation)", category: "constellation", areaSqDeg: 700, brightestStarMagnitude: 2.06, brightestStarId: "alpheratz", isZodiac: false },
    { id: "canis_major", name: "Canis Major", category: "constellation", areaSqDeg: 380, brightestStarMagnitude: -1.46, brightestStarId: "sirius", isZodiac: false },
    { id: "alpheratz", name: "Alpheratz", category: "star" },
    { id: "sirius", name: "Sirius", category: "star" },
  ]

  it("proposes the area the source gives, matching through the disambiguated name", () => {
    const changes = collectChanges(dataset, rows)
    expect(changes).toEqual([
      expect.objectContaining({ id: "andromeda_constellation", field: "areaSqDeg", from: 700, to: 722 }),
    ])
  })

  it("proposes nothing when the dataset already agrees", () => {
    const agreeing = dataset.map(o => (o.id === "andromeda_constellation" ? { ...o, areaSqDeg: 722 } : o))
    expect(collectChanges(agreeing, rows)).toEqual([])
  })

  it("proposes a zodiac correction", () => {
    const wrong = [{ id: "leo", name: "Leo", category: "constellation", isZodiac: false }]
    expect(collectChanges(wrong, [])).toEqual([
      expect.objectContaining({ id: "leo", field: "isZodiac", from: false, to: true }),
    ])
  })

  it("reports a brightestStarId that resolves to nothing", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    const dangling = [{ id: "leo", name: "Leo", category: "constellation", brightestStarId: "ghost", isZodiac: true }]
    collectChanges(dangling, [])
    expect(error).toHaveBeenCalledWith(expect.stringContaining('"ghost"'))
    error.mockRestore()
  })
})
