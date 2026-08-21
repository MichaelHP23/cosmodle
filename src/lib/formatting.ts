// Thousands separators. The explicit fraction-digit ceiling matters: toLocaleString defaults to at
// most 3 decimals, which would flatten a value like 0.0000158 ly to "0".
function group(v: number): string {
  return v.toLocaleString("en-US", { maximumFractionDigits: 20 })
}

export function formatAU(v: number): string {
  return `${v.toFixed(2)} AU`
}

export function formatKm(v: number): string {
  return `${group(Math.round(v))} km`
}

export function formatKelvinAsCelsius(k: number): string {
  const c = Math.round(k - 273.15)
  return `${group(c)}°C`
}

export function formatDays(v: number): string {
  return `${group(Math.round(v))} days`
}

export function formatHours(v: number): string {
  return `${group(Number(v.toPrecision(4)))} hours`
}

export function formatMassKg(v: number): string {
  const exponent = Math.floor(Math.log10(Math.abs(v)))
  const mantissa = v / Math.pow(10, exponent)
  return `${mantissa.toFixed(2)} × 10^${exponent} kg`
}

export function formatGravity(v: number): string {
  // Derived surface gravities span from ~1e-10 (a galaxy's outskirts) to ~1e12 (an event horizon),
  // so keep small values in scientific notation rather than rounding them to a meaningless 0.
  if (v !== 0 && Math.abs(v) < 0.01) return `${v.toExponential(2)} m/s²`
  return `${group(Number(v.toPrecision(3)))} m/s²`
}

export function formatLightYears(v: number): string {
  return `${group(Number(v.toPrecision(3)))} ly`
}

export function formatAreaSqDeg(v: number): string {
  return `${group(v)} sq°`
}

export function formatMagnitude(v: number): string {
  return `mag ${v}`
}

function capitalizeWords(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

export function formatPropertyValue(property: string, value: unknown): string {
  if (value === undefined || value === null) return "—"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (property === "distanceFromSunAU") return formatAU(value as number)
  if (property === "distanceFromEarthLy") return formatLightYears(value as number)
  if (property === "distanceFromParentKm" || property === "diameterKm") return formatKm(value as number)
  if (property === "temperatureK") return formatKelvinAsCelsius(value as number)
  if (property === "orbitalPeriodDays") return formatDays(value as number)
  if (property === "rotationPeriodHours") return formatHours(value as number)
  if (property === "massKg") return formatMassKg(value as number)
  if (property === "gravityMs2") return formatGravity(value as number)
  if (property === "areaSqDeg") return formatAreaSqDeg(value as number)
  if (property === "brightestStarMagnitude") return formatMagnitude(value as number)
  if (property === "category" || property === "parentBodyId" || property === "hemisphere") return capitalizeWords(String(value))
  return String(value)
}
