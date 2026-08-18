import type { CelestialObject } from "./celestial"

export type ComparatorKind = "numeric" | "temperature" | "exact"

export type ComparisonStatus =
  | "correct"
  | "higher"
  | "lower"
  | "close"
  | "incorrect"
  | "not_applicable"

export type ComparisonResult = {
  status: ComparisonStatus
  difference?: number
}

export type ProfileEntry = {
  property: keyof CelestialObject
  label: string
  kind: ComparatorKind
}

export type GameMode = "daily" | "practice" | "archive"

export type DailyGameState = {
  date: string
  guessIds: string[]
  won: boolean
}
