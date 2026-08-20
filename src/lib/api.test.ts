// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest"
import { postResult, getPlayerStats, getGlobalStats } from "./api"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("postResult", () => {
  it("returns parsed stats on success", async () => {
    const stats = { gamesPlayed: 1, wins: 1, currentStreak: 1, longestStreak: 1, lastDayNumber: 1, guessDistribution: [0, 1, 0, 0, 0, 0, 0] }
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => stats }))
    const result = await postResult("uuid-1", 1, true, 2, 0)
    expect(result).toEqual(stats)
    expect(fetch).toHaveBeenCalledWith(
      "/api/result",
      expect.objectContaining({ method: "POST" })
    )
  })

  it("returns null on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }))
    expect(await postResult("uuid-1", 1, true, 2, 0)).toBeNull()
  })

  it("returns null when fetch throws (offline)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))
    expect(await postResult("uuid-1", 1, true, 2, 0)).toBeNull()
  })
})

describe("getPlayerStats", () => {
  it("returns null on failure instead of throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))
    expect(await getPlayerStats("uuid-1")).toBeNull()
  })
})

describe("getGlobalStats", () => {
  it("returns parsed global stats on success", async () => {
    const stats = { totalPlayers: 5, playedToday: 2, winRate: 80, guessDistribution: [0, 1, 2, 0, 0, 0, 0] }
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => stats }))
    expect(await getGlobalStats()).toEqual(stats)
  })
})
