import { describe, it, expect } from "vitest"
import { createInitialState, applyGuess, useHint, MAX_GUESSES, MAX_HINTS } from "./gameState"
import type { CelestialObject } from "../types/celestial"

const dataset: CelestialObject[] = [
  { id: "mars", name: "Mars", category: "planet" },
  { id: "jupiter", name: "Jupiter", category: "planet" },
  { id: "venus", name: "Venus", category: "planet" },
  { id: "earth", name: "Earth", category: "planet" },
  { id: "saturn", name: "Saturn", category: "planet" },
  { id: "uranus", name: "Uranus", category: "planet" },
  { id: "neptune", name: "Neptune", category: "planet" },
  { id: "mercury", name: "Mercury", category: "planet" },
  { id: "pluto", name: "Pluto", category: "planet" },
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

  it("allows up to MAX_GUESSES wrong guesses without ending the game", () => {
    const wrongIds = ["mars", "venus", "earth", "saturn", "uranus", "neptune", "mercury"]
    expect(wrongIds.length).toBe(MAX_GUESSES)
    let state = createInitialState("2026-09-01")
    for (const id of wrongIds) {
      const { state: next, error } = applyGuess(state, id, dataset, "jupiter")
      expect(error).toBeUndefined()
      state = next
    }
    expect(state.guessIds).toEqual(wrongIds)
    expect(state.won).toBe(false)
  })

  it("rejects a guess once MAX_GUESSES has been reached without a win", () => {
    const wrongIds = ["mars", "venus", "earth", "saturn", "uranus", "neptune", "mercury"]
    let state = createInitialState("2026-09-01")
    for (const id of wrongIds) {
      state = applyGuess(state, id, dataset, "jupiter").state
    }
    const { state: next, error } = applyGuess(state, "pluto", dataset, "jupiter")
    expect(error).toBe("game_over")
    expect(next.guessIds).toEqual(wrongIds)
  })

  it("still allows the winning guess as the very last attempt", () => {
    const wrongIds = ["mars", "venus", "earth", "saturn", "uranus", "neptune"]
    let state = createInitialState("2026-09-01")
    for (const id of wrongIds) {
      state = applyGuess(state, id, dataset, "jupiter").state
    }
    const { state: next, error } = applyGuess(state, "jupiter", dataset, "jupiter")
    expect(error).toBeUndefined()
    expect(next.won).toBe(true)
    expect(next.guessIds.length).toBe(MAX_GUESSES)
  })
})

describe("createInitialState", () => {
  it("starts with zero hints used", () => {
    expect(createInitialState("2026-09-01").hintsUsed).toBe(0)
  })
})

describe("useHint", () => {
  it("increments hintsUsed", () => {
    const state = createInitialState("2026-09-01")
    const { state: next, error } = useHint(state)
    expect(error).toBeUndefined()
    expect(next.hintsUsed).toBe(1)
  })

  it("allows using hints up to MAX_HINTS", () => {
    let state = createInitialState("2026-09-01")
    for (let i = 0; i < MAX_HINTS; i++) {
      const { state: next, error } = useHint(state)
      expect(error).toBeUndefined()
      state = next
    }
    expect(state.hintsUsed).toBe(MAX_HINTS)
  })

  it("rejects using a hint beyond MAX_HINTS", () => {
    let state = createInitialState("2026-09-01")
    for (let i = 0; i < MAX_HINTS; i++) {
      state = useHint(state).state
    }
    const { state: next, error } = useHint(state)
    expect(error).toBe("no_hints_left")
    expect(next.hintsUsed).toBe(MAX_HINTS)
  })

  it("rejects using a hint after the game is already won", () => {
    let state = createInitialState("2026-09-01")
    state = applyGuess(state, "jupiter", dataset, "jupiter").state
    const { state: next, error } = useHint(state)
    expect(error).toBe("already_won")
    expect(next.hintsUsed).toBe(0)
  })
})
