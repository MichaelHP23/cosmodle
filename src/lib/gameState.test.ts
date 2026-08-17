import { describe, it, expect } from "vitest"
import { createInitialState, applyGuess } from "./gameState"
import type { CelestialObject } from "../types/celestial"

const dataset: CelestialObject[] = [
  { id: "mars", name: "Mars", category: "planet" },
  { id: "jupiter", name: "Jupiter", category: "planet" },
]

describe("applyGuess", () => {
  it("accepts a valid guess and appends it", () => {
    const state = createInitialState("2026-09-01")
    const { state: next, error } = applyGuess(state, "mars", dataset, "jupiter")
    expect(error).toBeUndefined()
    expect(next.guessIds).toEqual(["mars"])
    expect(next.won).toBe(false)
  })

  it("rejects an invalid object id", () => {
    const state = createInitialState("2026-09-01")
    const { state: next, error } = applyGuess(state, "pluto-not-in-dataset", dataset, "jupiter")
    expect(error).toBe("invalid_id")
    expect(next.guessIds).toEqual([])
  })

  it("rejects a duplicate guess", () => {
    let state = createInitialState("2026-09-01")
    state = applyGuess(state, "mars", dataset, "jupiter").state
    const { state: next, error } = applyGuess(state, "mars", dataset, "jupiter")
    expect(error).toBe("duplicate")
    expect(next.guessIds).toEqual(["mars"])
  })

  it("marks won=true on a correct guess", () => {
    const state = createInitialState("2026-09-01")
    const { state: next, error } = applyGuess(state, "jupiter", dataset, "jupiter")
    expect(error).toBeUndefined()
    expect(next.won).toBe(true)
  })

  it("rejects any guess after the game is already won", () => {
    let state = createInitialState("2026-09-01")
    state = applyGuess(state, "jupiter", dataset, "jupiter").state
    const { state: next, error } = applyGuess(state, "mars", dataset, "jupiter")
    expect(error).toBe("already_won")
    expect(next.guessIds).toEqual(["jupiter"])
  })
})
