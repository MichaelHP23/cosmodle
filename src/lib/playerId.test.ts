// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest"
import { getOrCreatePlayerId } from "./playerId"

beforeEach(() => {
  localStorage.clear()
})

describe("getOrCreatePlayerId", () => {
  it("creates and persists a uuid on first call", () => {
    const id = getOrCreatePlayerId()
    expect(id).toMatch(/^[0-9a-f-]{36}$/i)
    expect(localStorage.getItem("celestial:playerId")).toBe(id)
  })

  it("returns the same id on subsequent calls", () => {
    const first = getOrCreatePlayerId()
    const second = getOrCreatePlayerId()
    expect(second).toBe(first)
  })
})
