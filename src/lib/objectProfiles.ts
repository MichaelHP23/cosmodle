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
  { property: "discoveredYear", label: "First Recorded", kind: "numeric" },
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
  { property: "discoveredYear", label: "First Recorded", kind: "numeric" },
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

const STAR_CLUSTER_PROFILE: ProfileEntry[] = [
  { property: "category", label: "Type", kind: "exact" },
  { property: "distanceFromEarthLy", label: "Distance from Earth", kind: "numeric" },
  { property: "diameterKm", label: "Diameter", kind: "numeric" },
  { property: "massKg", label: "Estimated Mass", kind: "numeric" },
  { property: "clusterType", label: "Cluster Type", kind: "exact" },
  { property: "apparentMagnitude", label: "Apparent Magnitude", kind: "numeric" },
  { property: "discoveredYear", label: "First Recorded", kind: "numeric" },
]

const TRANSIENT_PROFILE: ProfileEntry[] = [
  { property: "category", label: "Type", kind: "exact" },
  { property: "distanceFromEarthLy", label: "Distance from Earth", kind: "numeric" },
  { property: "redshift", label: "Redshift", kind: "numeric" },
  { property: "apparentMagnitude", label: "Peak Apparent Magnitude", kind: "numeric" },
  { property: "eventType", label: "Event Type", kind: "exact" },
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
  star_cluster: STAR_CLUSTER_PROFILE,
  transient: TRANSIENT_PROFILE,
}

export function getProfileForCategory(category: CelestialCategory): ProfileEntry[] {
  return PROFILES_BY_CATEGORY[category]
}

const AU_PER_LY = 63241.077
const KM_PER_AU = 1.495978707e8
const GRAVITATIONAL_CONSTANT = 6.674e-11
// Schwarzschild diameter per kg: 2 * (2G/c^2), converted to km. Reproduces the dataset's own
// published event-horizon diameters for Sgr A* and M87* to within 2%.
const SCHWARZSCHILD_KM_PER_KG = 2.9706e-30

const SOLAR_SYSTEM_CATEGORIES = ["planet", "dwarf_planet", "asteroid", "comet"]
const MILKY_WAY_CATEGORIES = ["star", "nebula", "exoplanet", "constellation", "star_cluster"]
// Physical quantities a constellation can only report by standing in its brightest star.
const STAR_BACKED_PROPERTIES = ["distanceFromEarthLy", "distanceFromSunAU", "massKg", "diameterKm", "temperatureK", "gravityMs2"]

// A guess only shows useful information when the answer's property can be read off the guess too.
// Every rule below derives a real quantity the guessed object genuinely has — either the same physical
// quantity stored under a different field (distance in AU vs ly), or one computed from values it already
// carries (surface gravity from mass and radius). Nothing here invents a number: properties a category
// genuinely does not possess (a constellation's mass, a black hole's visible magnitude, a planet's
// galaxy type) still return undefined and render as "not applicable".
export function getComparableValue(object: CelestialObject, property: string, dataset?: CelestialObject[]): unknown {
  // A transient is an event, not a body. It genuinely has no diameter, mass, gravity or surface
  // temperature, so those must stay blank rather than being derived into a misleading number.
  const BODILESS_FIELDS = ["diameterKm", "massKg", "temperatureK", "gravityMs2", "moons", "rings"]
  if (object.category === "transient" && BODILESS_FIELDS.includes(property)) return undefined

  const raw = (object as Record<string, unknown>)[property]
  if (raw !== undefined && raw !== null) return raw

  // A constellation is a patch of sky, not a body, so it has no physical properties of its own. It is
  // represented here by its brightest star — the same star its magnitude already comes from — which is a
  // stated convention rather than an invented value. Only constellations whose brightest star is in the
  // dataset can resolve these; the rest stay blank rather than guess.
  if (object.category === "constellation" && STAR_BACKED_PROPERTIES.includes(property)) {
    const star = object.brightestStarId ? dataset?.find(o => o.id === object.brightestStarId) : undefined
    if (star) return getComparableValue(star, property, dataset)
    return undefined
  }

  // Use the derived diameter too, so a quasar's event horizon feeds the gravity calculation below.
  const diameterKm = property === "diameterKm" ? undefined : getComparableValue(object, "diameterKm", dataset)
  const radiusMeters = typeof diameterKm === "number" ? (diameterKm * 1000) / 2 : undefined

  switch (property) {
    // Same "how far away" quantity at different scales. A moon stores only distanceFromParentKm
    // (negligible next to interstellar scales), so fall back to its parent body's distance.
    case "distanceFromEarthLy":
      if (object.distanceFromSunAU !== undefined) return object.distanceFromSunAU / AU_PER_LY
      return distanceViaParent(object, property, dataset)
    case "distanceFromSunAU":
      if (object.distanceFromEarthLy !== undefined) return object.distanceFromEarthLy * AU_PER_LY
      return distanceViaParent(object, property, dataset)
    case "distanceFromParentKm": {
      // Anything orbiting the Sun has a parent distance: its own orbital radius.
      if (object.distanceFromSunAU !== undefined) return object.distanceFromSunAU * KM_PER_AU
      return undefined
    }
    case "parentBodyId":
      if (SOLAR_SYSTEM_CATEGORIES.includes(object.category)) return "sun"
      if (object.category === "star" || object.category === "nebula") return "milky_way"
      return undefined

    // Surface gravity is g = GM/r^2 wherever the object carries both a mass and a diameter.
    case "gravityMs2":
      if (object.massKg !== undefined && radiusMeters) {
        return (GRAVITATIONAL_CONSTANT * object.massKg) / (radiusMeters * radiusMeters)
      }
      return undefined

    // A quasar is an accreting supermassive black hole; its size is its event horizon, from the same
    // formula the dataset already uses for the black_hole category's diameters.
    case "diameterKm":
      if (object.category === "quasar" && object.massKg !== undefined) {
        return SCHWARZSCHILD_KM_PER_KG * object.massKg
      }
      return undefined

    // What you see of a constellation is its brightest star, and a single object's own magnitude is
    // the same measurement — they are interchangeable across the two directions.
    case "apparentMagnitude":
      return object.brightestStarMagnitude
    case "brightestStarMagnitude":
      return object.apparentMagnitude

    // Everything gravitationally bound to the Milky Way has no cosmological redshift.
    case "redshift":
      return MILKY_WAY_CATEGORIES.includes(object.category) ? 0 : undefined

    // Only constellations are patches of sky; every other object is effectively a point by comparison.
    case "areaSqDeg":
      return object.category === "constellation" ? undefined : 0

    // Nothing outside a constellation is one of the twelve zodiac constellations.
    case "isZodiac":
      return object.category === "constellation" ? undefined : false

    // Everything orbiting the Sun rides the ecliptic, which both hemispheres can see. Deep-sky objects
    // carry an explicit hemisphere from their declination, so only the solar system is derived here.
    case "hemisphere":
      return SOLAR_SYSTEM_CATEGORIES.includes(object.category) || object.category === "moon"
        ? "both"
        : undefined

    // Only planets and dwarf planets hold satellites or ring systems; for everything else the honest
    // answer is none rather than unknown. Objects that do have them (Ida, Haumea) carry explicit values.
    case "moons":
      return 0
    case "rings":
      return false

    // The dataset's moons are tidally locked apart from the irregular and chaotic rotators, which carry
    // an explicit rotationPeriodHours — so a locked moon's day equals its orbit. Close-in exoplanets
    // (inside ~20 days) are likewise locked to their host star.
    case "rotationPeriodHours":
      if (object.orbitalPeriodDays === undefined) return undefined
      if (object.category === "moon") return object.orbitalPeriodDays * 24
      if (object.category === "exoplanet" && object.orbitalPeriodDays <= 20) {
        return object.orbitalPeriodDays * 24
      }
      return undefined

    default:
      return undefined
  }
}

function distanceViaParent(
  object: CelestialObject,
  property: string,
  dataset?: CelestialObject[]
): unknown {
  if (!object.parentBodyId || !dataset) return undefined
  const parent = dataset.find(o => o.id === object.parentBodyId)
  return parent ? getComparableValue(parent, property, dataset) : undefined
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
