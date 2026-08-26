// Advertising is entirely off until a publisher id is configured, so a build without one ships no
// third-party tag at all rather than an inert one. The id arrives at build time from the environment
// so that the same source can be deployed before and after AdSense approves the site.
const CLIENT: string = import.meta.env.VITE_ADSENSE_CLIENT ?? ""
// The ad unit id is not a secret: it ships in the data-ad-slot attribute of every rendered page, so
// the live unit is the default and the environment only has to override it for a test unit.
const SLOT: string = import.meta.env.VITE_ADSENSE_SLOT ?? "8774991443"

// A publisher id is "ca-pub-" followed by sixteen digits, and an ad unit id is digits. Anything else
// is a placeholder left in an .env by mistake, and requesting ads for one earns a policy warning
// rather than revenue, so treat it exactly like an unset value.
const CLIENT_PATTERN = /^ca-pub-\d{16}$/
const SLOT_PATTERN = /^\d+$/

const ADSENSE_SRC = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
const FUNDING_CHOICES_SRC = "https://fundingchoicesmessages.google.com/i/"
const TCF_LOCATOR_NAME = "__tcfapiLocator"

declare global {
  interface Window {
    adsbygoogle?: unknown[]
    __tcfapi?: (...args: unknown[]) => unknown
  }
}

export function isAdvertisingConfigured(): boolean {
  return CLIENT_PATTERN.test(CLIENT)
}

export function getAdClient(): string | null {
  return isAdvertisingConfigured() ? CLIENT : null
}

export function getAdSlot(): string | null {
  return isAdvertisingConfigured() && SLOT_PATTERN.test(SLOT) ? SLOT : null
}

// Only the AdSense tag is loaded anonymously; Funding Choices is served without CORS headers, so
// asking for a cross-origin fetch of it would fail the request outright.
function injectScript(src: string, anonymous: boolean): void {
  // The document is the record of what has already been injected, which keeps this idempotent across
  // a hot reload or a second call from a remounted component, not just within one module instance.
  if (document.querySelector(`script[src="${src}"]`)) return
  const script = document.createElement("script")
  script.async = true
  if (anonymous) script.crossOrigin = "anonymous"
  script.src = src
  document.head.appendChild(script)
}

// A vendor that finds no __tcfapi concludes the page has no consent management at all and drops to
// non-personalised ads, so this has to answer before the real CMP has finished loading. It queues
// every call, and relays the cross-frame ones, until Funding Choices takes over.
function installTcfStub(): void {
  if (window.__tcfapi) return
  const queue: unknown[][] = []

  function addLocatorFrame(): void {
    const frames = window.frames as unknown as Record<string, Window | undefined>
    if (frames[TCF_LOCATOR_NAME]) return
    if (!document.body) {
      setTimeout(addLocatorFrame, 5)
      return
    }
    const iframe = document.createElement("iframe")
    iframe.style.display = "none"
    iframe.name = TCF_LOCATOR_NAME
    document.body.appendChild(iframe)
  }

  function tcfApiHandler(...args: unknown[]): unknown {
    if (args.length === 0) return queue
    const callback = args[2]
    if (args[0] === "ping" && typeof callback === "function") {
      callback({ gdprApplies: undefined, cmpLoaded: false, cmpStatus: "stub" })
      return undefined
    }
    queue.push(args)
    return undefined
  }

  function relayFrameCall(event: MessageEvent): void {
    const wasString = typeof event.data === "string"
    let parsed: unknown = event.data
    if (wasString) {
      try {
        parsed = JSON.parse(event.data as string)
      } catch {
        return
      }
    }
    const call = (parsed as { __tcfapiCall?: { command: string; version: number; callId: unknown; parameter?: unknown } })
      ?.__tcfapiCall
    if (!call) return
    window.__tcfapi?.(
      call.command,
      call.version,
      (returnValue: unknown, success: boolean) => {
        const message = { __tcfapiReturn: { returnValue, success, callId: call.callId } }
        ;(event.source as Window | null)?.postMessage(wasString ? JSON.stringify(message) : message, "*")
      },
      call.parameter
    )
  }

  window.__tcfapi = tcfApiHandler
  window.addEventListener("message", relayFrameCall, false)
  addLocatorFrame()
}

// Funding Choices is Google's certified CMP and the only consent mechanism the ads use. It has to be
// requested before the AdSense tag so that it can gate personalised ads for EEA and UK visitors.
export function loadFundingChoices(): void {
  if (!CLIENT || !isAdvertisingConfigured()) return
  installTcfStub()
  // Funding Choices is keyed by the bare publisher id, without the "ca-" the AdSense tag expects.
  injectScript(`${FUNDING_CHOICES_SRC}${CLIENT.replace(/^ca-/, "")}?ers=1`, false)
}

export function loadAdSense(): void {
  if (!CLIENT || !isAdvertisingConfigured()) return
  injectScript(`${ADSENSE_SRC}?client=${CLIENT}`, true)
}
