export type CelestialCategory =
  | "planet"
  | "dwarf_planet"
  | "moon"
  | "asteroid"
  | "comet"
  | "star"
  | "galaxy"
  | "black_hole"
  | "nebula"
  | "quasar"
  | "constellation"
  | "exoplanet"

export type Hemisphere = "northern" | "southern" | "both"

export type CelestialObject = {
  id: string
  name: string
  category: CelestialCategory

  description?: string
  imageUrl?: string

  distanceFromSunAU?: number
  distanceFromParentKm?: number
  distanceFromEarthLy?: number

  diameterKm?: number
  massKg?: number
  temperatureK?: number
  gravityMs2?: number

  color?: string

  moons?: number
  rings?: boolean

  rotationPeriodHours?: number
  orbitalPeriodDays?: number

  parentBodyId?: string

  composition?: string
  atmosphere?: string

  discoveredYear?: number

  areaSqDeg?: number
  brightestStarMagnitude?: number
  hemisphere?: Hemisphere

  difficulty?: 1 | 2 | 3 | 4 | 5
}
