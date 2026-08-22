import { describe, it, expect, beforeEach } from "vitest"
import fs from "node:fs"
import { cachedFetch, CACHE_DIR } from "./fetchCache.mjs"

describe("cachedFetch", () => {
  beforeEach(() => { fs.rmSync(CACHE_DIR, { recursive: true, force: true }) })

  it("returns the body and writes it to the cache", async () => {
    let calls = 0
    const fakeFetch = async () => { calls++; return { ok: true, status: 200, text: async () => "hello" } }
    const body = await cachedFetch("https://example.test/a", { fetchImpl: fakeFetch })
    expect(body).toBe("hello")
    expect(calls).toBe(1)
    expect(fs.readdirSync(CACHE_DIR).length).toBe(1)
  })

  it("serves the second call from cache without refetching", async () => {
    let calls = 0
    const fakeFetch = async () => { calls++; return { ok: true, status: 200, text: async () => "hello" } }
    await cachedFetch("https://example.test/a", { fetchImpl: fakeFetch })
    const body = await cachedFetch("https://example.test/a", { fetchImpl: fakeFetch })
    expect(body).toBe("hello")
    expect(calls).toBe(1)
  })

  it("retries when the body reports the TAP service is busy, then succeeds", async () => {
    let calls = 0
    const fakeFetch = async () => {
      calls++
      if (calls < 3) return { ok: true, status: 200, text: async () => "TAP service too busy!" }
      return { ok: true, status: 200, text: async () => "{\"data\":[]}" }
    }
    const body = await cachedFetch("https://example.test/b", { fetchImpl: fakeFetch, baseDelayMs: 1 })
    expect(body).toBe("{\"data\":[]}")
    expect(calls).toBe(3)
  })

  it("throws after exhausting retries", async () => {
    const fakeFetch = async () => ({ ok: false, status: 503, text: async () => "nope" })
    await expect(
      cachedFetch("https://example.test/c", { fetchImpl: fakeFetch, retries: 2, baseDelayMs: 1 })
    ).rejects.toThrow(/503/)
  })
})
