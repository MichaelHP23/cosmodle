import { describe, it, expect } from "vitest"
import { createInitialState, applyGuess, applyHint, MAX_GUESSES, MAX_HINTS } from "./gameState"
import type { CelestialObject } from "../types/celestial"

const dataset: CelestialObject[] = [
  { id: "jupiter", name: "Jupiter", category: "planet" },
  ...Array.from({ length: MAX_GUESSES + 5 }, (_, i) => ({
    id: `decoy-${i}`,
    name: `Decoy ${i}`,
    category: "planet" as const,
  })),
]
const wrongIds = dataset.filter(o => o.id !== "jupiter").slice(0, MAX_GUESSES).map(o => o.id)

describe("applyGuess", () => {
  it("accepts a valid guess and appends it", () => {
    const state = createInitialState("2026-09-01")
    const { state: next, error } = applyGuess(state, "decoy-0", dataset, "jupiter")
    expect(error).toBeUndefined()
    expect(next.guessIds).toEqual(["decoy-0"])
    expect(next.won).toBe(false)
  })

  it("rejects an invalid object id", () => {
    const state = createInitialState("2026-09-01")
    const { state: next, error } = applyGuess(state, "not-in-dataset", dataset, "jupiter")
    expect(error).toBe("invalid_id")
    expect(next.guessIds).toEqual([])
  })

  it("rejects a duplicate guess", () => {
    let state = createInitialState("2026-09-01")
    state = applyGuess(state, "decoy-0", dataset, "jupiter").state
    const { state: next, error } = applyGuess(state, "decoy-0", dataset, "jupiter")
    expect(error).toBe("duplicate")
    expect(next.guessIds).toEqual(["decoy-0"])
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
    const { state: next, error } = applyGuess(state, "decoy-0", dataset, "jupiter")
    expect(error).toBe("already_won")
    expect(next.guessIds).toEqual(["jupiter"])
  })

  it("allows up to MAX_GUESSES wrong guesses without ending the game", () => {
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
    let state = createInitialState("2026-09-01")
    for (const id of wrongIds) {
      state = applyGuess(state, id, dataset, "jupiter").state
    }
    const extraId = dataset.find(o => !wrongIds.includes(o.id) && o.id !== "jupiter")!.id
    const { state: next, error } = applyGuess(state, extraId, dataset, "jupiter")
    expect(error).toBe("game_over")
    expect(next.guessIds).toEqual(wrongIds)
  })

  it("still allows the winning guess as the very last attempt", () => {
    const almostAllWrong = wrongIds.slice(0, MAX_GUESSES - 1)
    let state = createInitialState("2026-09-01")
    for (const id of almostAllWrong) {
      state = applyGuess(state, id, dataset, "jupiter").state
    }
    const { state: next, error } = applyGuess(state, "jupiter", dataset, "jupiter")
    expect(error).toBeUndefined()
    expect(next.won).toBe(true)
    expect(next.guessIds.length).toBe(almostAllWrong.length + 1)
  })
})

describe("createInitialState", () => {
  it("starts with zero hints used", () => {
    expect(createInitialState("2026-09-01").hintsUsed).toBe(0)
  })
})

describe("applyHint", () => {
  it("increments hintsUsed", () => {
    const state = createInitialState("2026-09-01")
    const { state: next, error } = applyHint(state)
    expect(error).toBeUndefined()
    expect(next.hintsUsed).toBe(1)
  })

  it("allows using hints up to MAX_HINTS", () => {
    let state = createInitialState("2026-09-01")
    for (let i = 0; i < MAX_HINTS; i++) {
      const { state: next, error } = applyHint(state)
      expect(error).toBeUndefined()
      state = next
    }
    expect(state.hintsUsed).toBe(MAX_HINTS)
  })

  it("rejects using a hint beyond MAX_HINTS", () => {
    let state = createInitialState("2026-09-01")
    for (let i = 0; i < MAX_HINTS; i++) {
      state = applyHint(state).state
    }
    const { state: next, error } = applyHint(state)
    expect(error).toBe("no_hints_left")
    expect(next.hintsUsed).toBe(MAX_HINTS)
  })

  it("rejects using a hint after the game is already won", () => {
    let state = createInitialState("2026-09-01")
    state = applyGuess(state, "jupiter", dataset, "jupiter").state
    const { state: next, error } = applyHint(state)
    expect(error).toBe("already_won")
    expect(next.hintsUsed).toBe(0)
  })
})
