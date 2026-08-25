// This records our own first-party preference and is not the consent management platform for ads.
// Google Funding Choices is the certified CMP and gates advertising on its own, so nothing here
// should ever be wired up to decide whether an ad script loads.
export type Consent = "granted" | "denied" | "unset"

const KEY = "cosmodle:consent"

// An unreadable or unrecognised value means we have no valid record of a decision, and the only safe
// reading of that is that the player has not made one. Never fall back to granted.
export function getConsent(): Consent {
  const raw = localStorage.getItem(KEY)
  return raw === "granted" || raw === "denied" ? raw : "unset"
}

export function setConsent(value: "granted" | "denied"): void {
  localStorage.setItem(KEY, value)
}
