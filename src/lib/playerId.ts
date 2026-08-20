const STORAGE_KEY = "celestial:playerId"

export function getOrCreatePlayerId(): string {
  const existing = localStorage.getItem(STORAGE_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(STORAGE_KEY, id)
  return id
}
