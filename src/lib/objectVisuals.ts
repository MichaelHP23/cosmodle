import type { CelestialCategory, CelestialObject } from "../types/celestial"

const CATEGORY_DEFAULT_COLOR: Record<CelestialCategory, string> = {
  planet: "#6b8cae",
  dwarf_planet: "#9c9c9c",
  moon: "#9a9a9a",
  asteroid: "#8a7a63",
  comet: "#bcd9e0",
  star: "#ffd54a",
  galaxy: "#a8b4ff",
  black_hole: "#15151f",
  nebula: "#c78fd9",
}

export function getObjectColor(object: CelestialObject): string {
  return object.color ?? CATEGORY_DEFAULT_COLOR[object.category]
}

export function getCategoryColor(category: CelestialCategory): string {
  return CATEGORY_DEFAULT_COLOR[category]
}
