import { describe, it, expect } from "vitest"
import { narrowingScore, orderHints } from "./hintOrder"
import type { CelestialObject } from "../types/celestial"
import type { ProfileEntry } from "../types/game"

// Four objects: every one is in the northern hemisphere, so hemisphere narrows nothing,
// while each diameter is unique, so diameter narrows all the way down to one object.
const dataset: CelestialObject[] = [
  { id: "a", name: "A", category: "star", hemisphere: "northern", diameterKm: 100, temperatureK: 5000 },
  { id: "b", name: "B", category: "star", hemisphere: "northern", diameterKm: 200, temperatureK: 5000 },
  { id: "c", name: "C", category: "star", hemisphere: "northern", diameterKm: 300, temperatureK: 6000 },
  { id: "d", name: "D", category: "star", hemisphere: "northern", diameterKm: 400, temperatureK: 7000 },
]
const answer = dataset[0]

const entry = (property: ProfileEntry["property"]): ProfileEntry => ({ property, label: property, kind: "numeric" })

describe("narrowingScore", () => {
  it("scores a value the whole dataset shares as narrowing nothing", () => {
    expect(narrowingScore("hemisphere", answer, dataset)).toBe(1)
  })

  it("scores a unique value as narrowing to a single object", () => {
    expect(narrowingScore("diameterKm", answer, dataset)).toBe(0.25)
  })

  it("scores a partly shared value in between", () => {
    expect(narrowingScore("temperatureK", answer, dataset)).toBe(0.5)
  })

  it("ranks a property the answer cannot report as worthless", () => {
    expect(narrowingScore("massKg", answer, dataset)).toBe(1)
  })
})

describe("orderHints", () => {
  it("reveals the most narrowing property first", () => {
    const order = orderHints(
      [entry("hemisphere"), entry("temperatureK"), entry("diameterKm")],
      answer,
      dataset,
      new Set()
    )
    expect(order.map(e => e.property)).toEqual(["diameterKm", "temperatureK", "hemisphere"])
  })

  it("pushes properties the player already guessed correctly to the back", () => {
    const order = orderHints(
      [entry("hemisphere"), entry("temperatureK"), entry("diameterKm")],
      answer,
      dataset,
      new Set(["diameterKm"])
    )
    expect(order.map(e => e.property)).toEqual(["temperatureK", "hemisphere", "diameterKm"])
  })
})

// Hints may reveal the category, which the guess table leaves out of its own columns. Nothing in the
// scoring is category-aware, so it has to earn its place in the order like any other property.
const mixedDataset: CelestialObject[] = [
  { id: "a", name: "A", category: "star", hemisphere: "northern", temperatureK: 5000 },
  { id: "b", name: "B", category: "galaxy", hemisphere: "northern", temperatureK: 5000 },
  { id: "c", name: "C", category: "galaxy", hemisphere: "northern", temperatureK: 6000 },
  { id: "d", name: "D", category: "galaxy", hemisphere: "southern", temperatureK: 6000 },
]

describe("category as a hint", () => {
  it("scores category like any other property", () => {
    expect(narrowingScore("category", mixedDataset[0], mixedDataset)).toBe(0.25)
    expect(narrowingScore("category", mixedDataset[1], mixedDataset)).toBe(0.75)
  })

  it("puts category first when it narrows the field most", () => {
    const order = orderHints(
      [entry("category"), entry("hemisphere"), entry("temperatureK")],
      mixedDataset[0],
      mixedDataset,
      new Set()
    )
    expect(order.map(e => e.property)).toEqual(["category", "temperatureK", "hemisphere"])
  })

  it("does not put category first when the answer shares it with most of the dataset", () => {
    const order = orderHints(
      [entry("category"), entry("hemisphere"), entry("temperatureK")],
      mixedDataset[3],
      mixedDataset,
      new Set()
    )
    expect(order.map(e => e.property)).toEqual(["hemisphere", "temperatureK", "category"])
  })
})
