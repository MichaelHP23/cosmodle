import type { CelestialCategory, CelestialObject } from "../types/celestial"
import type { ProfileEntry } from "../types/game"
import { formatPropertyValue } from "./formatting"

const PLANET_PROFILE: ProfileEntry[] = [
  { property: "category", label: "Type", kind: "exact" },
  { property: "distanceFromSunAU", label: "Distance from Sun", kind: "numeric" },
  { property: "temperatureK", label: "Average Temperature", kind: "temperature" },
  { property: "diameterKm", label: "Diameter", kind: "numeric" },
  { property: "massKg", label: "Mass", kind: "numeric" },
  { property: "gravityMs2", label: "Gravity", kind: "numeric" },
  { property: "moons", label: "Moons", kind: "numeric" },
  { property: "rings", label: "Rings", kind: "exact" },
  { property: "orbitalPeriodDays", label: "Orbital Period", kind: "numeric" },
  { property: "rotationPeriodHours", label: "Rotation Period", kind: "numeric" },
]

const DWARF_PLANET_PROFILE: ProfileEntry[] = PLANET_PROFILE

const MOON_PROFILE: ProfileEntry[] = [
  { property: "category", label: "Type", kind: "exact" },
  { property: "parentBodyId", label: "Parent Body", kind: "exact" },
  { property: "distanceFromParentKm", label: "Distance from Parent", kind: "numeric" },
  { property: "temperatureK", label: "Average Temperature", kind: "temperature" },
  { property: "diameterKm", label: "Diameter", kind: "numeric" },
  { property: "massKg", label: "Mass", kind: "numeric" },
  { property: "gravityMs2", label: "Gravity", kind: "numeric" },
  { property: "orbitalPeriodDays", label: "Orbital Period", kind: "numeric" },
]

const SMALL_BODY_PROFILE: ProfileEntry[] = [
  { property: "category", label: "Type", kind: "exact" },
  { property: "distanceFromSunAU", label: "Distance from Sun", kind: "numeric" },
  { property: "diameterKm", label: "Diameter", kind: "numeric" },
  { property: "massKg", label: "Mass", kind: "numeric" },
  { property: "temperatureK", label: "Average Temperature", kind: "temperature" },
  { property: "orbitalPeriodDays", label: "Orbital Period", kind: "numeric" },
]

const STAR_PROFILE: ProfileEntry[] = [
  { property: "category", label: "Type", kind: "exact" },
  { property: "distanceFromEarthLy", label: "Distance from Earth", kind: "numeric" },
  { property: "temperatureK", label: "Surface Temperature", kind: "temperature" },
  { property: "diameterKm", label: "Diameter", kind: "numeric" },
  { property: "massKg", label: "Mass", kind: "numeric" },
  { property: "discoveredYear", label: "Discovered", kind: "numeric" },
]

const GALAXY_PROFILE: ProfileEntry[] = [
  { property: "category", label: "Type", kind: "exact" },
  { property: "distanceFromEarthLy", label: "Distance from Earth", kind: "numeric" },
  { property: "diameterKm", label: "Diameter", kind: "numeric" },
  { property: "massKg", label: "Estimated Mass", kind: "numeric" },
  { property: "galaxyType", label: "Galaxy Type", kind: "exact" },
  { property: "discoveredYear", label: "Discovered", kind: "numeric" },
]

const BLACK_HOLE_PROFILE: ProfileEntry[] = [
  { property: "category", label: "Type", kind: "exact" },
  { property: "distanceFromEarthLy", label: "Distance from Earth", kind: "numeric" },
  { property: "diameterKm", label: "Event Horizon Diameter", kind: "numeric" },
  { property: "massKg", label: "Mass", kind: "numeric" },
  { property: "blackHoleType", label: "Black Hole Type", kind: "exact" },
  { property: "discoveredYear", label: "Discovered", kind: "numeric" },
]

const NEBULA_PROFILE: ProfileEntry[] = [
  { property: "category", label: "Type", kind: "exact" },
  { property: "distanceFromEarthLy", label: "Distance from Earth", kind: "numeric" },
  { property: "diameterKm", label: "Diameter", kind: "numeric" },
  { property: "nebulaType", label: "Nebula Type", kind: "exact" },
  { property: "apparentMagnitude", label: "Apparent Magnitude", kind: "numeric" },
  { property: "discoveredYear", label: "Discovered", kind: "numeric" },
]

const QUASAR_PROFILE: ProfileEntry[] = [
  { property: "category", label: "Type", kind: "exact" },
  { property: "distanceFromEarthLy", label: "Distance from Earth", kind: "numeric" },
  { property: "massKg", label: "Central Black Hole Mass", kind: "numeric" },
  { property: "redshift", label: "Redshift", kind: "numeric" },
  { property: "apparentMagnitude", label: "Apparent Magnitude", kind: "numeric" },
  { property: "discoveredYear", label: "Discovered", kind: "numeric" },
]

const CONSTELLATION_PROFILE: ProfileEntry[] = [
  { property: "category", label: "Type", kind: "exact" },
  { property: "hemisphere", label: "Hemisphere", kind: "exact" },
  { property: "areaSqDeg", label: "Sky Area", kind: "numeric" },
  { property: "brightestStarMagnitude", label: "Brightest Star Magnitude", kind: "numeric" },
  { property: "isZodiac", label: "Zodiac Constellation", kind: "exact" },
  { property: "discoveredYear", label: "Discovered", kind: "numeric" },
]

const EXOPLANET_PROFILE: ProfileEntry[] = [
  { property: "category", label: "Type", kind: "exact" },
  { property: "parentBodyId", label: "Host Star", kind: "exact" },
  { property: "distanceFromEarthLy", label: "Distance from Earth", kind: "numeric" },
  { property: "temperatureK", label: "Equilibrium Temperature", kind: "temperature" },
  { property: "diameterKm", label: "Diameter", kind: "numeric" },
  { property: "massKg", label: "Mass", kind: "numeric" },
  { property: "orbitalPeriodDays", label: "Orbital Period", kind: "numeric" },
  { property: "discoveredYear", label: "Discovered", kind: "numeric" },
]

const PROFILES_BY_CATEGORY: Record<CelestialCategory, ProfileEntry[]> = {
  planet: PLANET_PROFILE,
  dwarf_planet: DWARF_PLANET_PROFILE,
  moon: MOON_PROFILE,
  asteroid: SMALL_BODY_PROFILE,
  comet: SMALL_BODY_PROFILE,
  star: STAR_PROFILE,
  galaxy: GALAXY_PROFILE,
  black_hole: BLACK_HOLE_PROFILE,
  nebula: NEBULA_PROFILE,
  quasar: QUASAR_PROFILE,
  constellation: CONSTELLATION_PROFILE,
  exoplanet: EXOPLANET_PROFILE,
}

export function getProfileForCategory(category: CelestialCategory): ProfileEntry[] {
  return PROFILES_BY_CATEGORY[category]
}

export function getSearchHint(object: CelestialObject): string {
  const profile = getProfileForCategory(object.category).filter(e => e.property !== "category")
  const stats = profile
    .slice(0, 2)
    .map(e => formatPropertyValue(e.property, (object as any)[e.property]))
    .filter(v => v !== "—")
  const categoryLabel = object.category.replace(/_/g, " ")
  return [categoryLabel, ...stats].join(" · ")
}
