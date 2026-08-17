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

export type CelestialObject = {
  id: string
  name: string
  category: CelestialCategory

  description?: string
  imageUrl?: string

  distanceFromSunAU?: number
  distanceFromParentKm?: number

  diameterKm?: number
  massKg?: number
  temperatureK?: number
  gravityMs2?: number

  moons?: number
  rings?: boolean

  rotationPeriodHours?: number
  orbitalPeriodDays?: number

  parentBodyId?: string

  composition?: string
  atmosphere?: string

  discoveredYear?: number

  difficulty?: 1 | 2 | 3 | 4 | 5
}
