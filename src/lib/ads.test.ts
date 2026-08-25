// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

const CLIENT = "ca-pub-1234567890123456"

// The publisher id is read once when the module is evaluated, so each case needs a fresh copy of it
// rather than a fresh call into the same one.
async function importAds(client?: string) {
  vi.resetModules()
  if (client === undefined) vi.stubEnv("VITE_ADSENSE_CLIENT", "")
  else vi.stubEnv("VITE_ADSENSE_CLIENT", client)
  return import("./ads")
}

function injectedScripts() {
  return document.head.querySelectorAll("script")
}

describe("ads", () => {
  beforeEach(() => {
    document.head.innerHTML = ""
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    delete window.__tcfapi
  })

  it("injects nothing at all without a publisher id, so an unapproved site ships no ad tags", async () => {
    const ads = await importAds()
    ads.loadFundingChoices()
    ads.loadAdSense()
    expect(ads.isAdvertisingConfigured()).toBe(false)
    expect(injectedScripts()).toHaveLength(0)
  })

  it("refuses a placeholder id rather than requesting ads for something that is not a publisher", async () => {
    const ads = await importAds("ca-pub-XXXXXXXXXXXXXXXX")
    ads.loadFundingChoices()
    ads.loadAdSense()
    expect(ads.isAdvertisingConfigured()).toBe(false)
    expect(injectedScripts()).toHaveLength(0)
  })

  it("injects one tag each for the CMP and AdSense once a publisher id is set", async () => {
    const ads = await importAds(CLIENT)
    ads.loadFundingChoices()
    ads.loadAdSense()
    const scripts = [...injectedScripts()].map(s => s.src)
    expect(scripts).toHaveLength(2)
    expect(scripts[0]).toBe("https://fundingchoicesmessages.google.com/i/pub-1234567890123456?ers=1")
    expect(scripts[1]).toBe(`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`)
  })

  it("adds nothing on a second call, because a duplicate tag is a duplicate ad request", async () => {
    const ads = await importAds(CLIENT)
    ads.loadFundingChoices()
    ads.loadAdSense()
    ads.loadFundingChoices()
    ads.loadAdSense()
    expect(injectedScripts()).toHaveLength(2)
  })
})
