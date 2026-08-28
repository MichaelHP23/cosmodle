import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const CACHE_DIR = path.join(HERE, "..", ".cache")

// CDS returns HTTP 200 with a busy message in the body rather than a 503, so the retry has to look
// at the payload and not just the status code.
const BUSY = "TAP service too busy"

const sleep = ms => new Promise(r => setTimeout(r, ms))

// Wikipedia's API returns a 429 to requests with no identifying User-Agent even well under its
// documented rate limits; a contact-bearing one clears it. Harmless to send to JPL/NED too.
const DEFAULT_HEADERS = { "User-Agent": "cosmodle-dataset-verifier/1.0 (+https://cosmodle.com)" }
const defaultFetchImpl = url => fetch(url, { headers: DEFAULT_HEADERS })

export async function cachedFetch(url, opts = {}) {
  const { retries = 5, baseDelayMs = 2000, fetchImpl = defaultFetchImpl } = opts
  const key = crypto.createHash("sha256").update(url).digest("hex")
  const file = path.join(CACHE_DIR, key + ".txt")
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8")

  let lastError = "unknown"
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetchImpl(url)
    const body = res.ok ? await res.text() : null
    if (body !== null && !body.includes(BUSY)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true })
      fs.writeFileSync(file, body)
      return body
    }
    lastError = res.ok ? "service busy" : "HTTP " + res.status
    // Exponential backoff, because hammering a congested service makes it worse for everyone.
    if (attempt < retries - 1) await sleep(baseDelayMs * 2 ** attempt)
  }
  throw new Error("cachedFetch failed for " + url + ": " + lastError)
}
