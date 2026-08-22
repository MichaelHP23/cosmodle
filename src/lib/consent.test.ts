// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest"
import { getConsent, setConsent } from "./consent"

describe("consent", () => {
  beforeEach(() => localStorage.clear())

  it("starts unset so nothing is assumed on a first visit", () => {
    expect(getConsent()).toBe("unset")
  })

  it("remembers a granted decision across reloads", () => {
    setConsent("granted")
    expect(getConsent()).toBe("granted")
  })

  it("remembers a denied decision, which must never silently decay to granted", () => {
    setConsent("denied")
    expect(getConsent()).toBe("denied")
  })

  it("treats a corrupted stored value as unset rather than trusting it", () => {
    localStorage.setItem("cosmodle:consent", "{{{")
    expect(getConsent()).toBe("unset")
  })
})
