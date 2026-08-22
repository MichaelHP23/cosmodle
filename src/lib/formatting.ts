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

// The Sun, the Moon, the Earth and the five naked-eye planets have no year of discovery: they were
// never discovered, only always known. The dataset marks them with this sentinel so they still sort
// before every real catalogue year instead of dropping out of the comparison entirely.
export const PREHISTORIC_YEAR = -3000

export function formatPropertyValue(property: string, value: unknown): string {
  if (property === "discoveredYear" && value === PREHISTORIC_YEAR) return "Prehistoric"
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

// Math.log10 is not exact at every power of ten, so the exponent is nudged until the value really
// does sit inside the decade it names.
function decadeExponent(magnitude: number): number {
  let exponent = Math.floor(Math.log10(magnitude))
  if (magnitude / Math.pow(10, exponent) >= 10) exponent += 1
  else if (magnitude / Math.pow(10, exponent) < 1) exponent -= 1
  return exponent
}

// Order-of-magnitude bracket. Zero belongs to no decade of its own, so it opens the first one, and a
// negative value brackets its magnitude and then mirrors, which keeps the low end genuinely lower.
function decadeBracket(value: number): [number, number] {
  const magnitude = Math.abs(value)
  if (magnitude === 0) return [0, 1]
  const low = Math.pow(10, decadeExponent(magnitude))
  const high = low * 10
  return value < 0 ? [-high, -low] : [low, high]
}

// Even bracket of a fixed width, for quantities where powers of ten say nothing useful: apparent
// magnitude spans roughly -27 to 15, so every value in the dataset would land in the same decade.
function stepBracket(value: number, step: number): [number, number] {
  const low = Math.floor(value / step) * step
  return [low, low + step]
}

// Splits a formatted value into its unit prefix ("mag "), its number, and its unit suffix (" km"), so
// a range can be written once inside the units instead of repeating them on both endpoints.
function splitUnits(text: string): { prefix: string; core: string; suffix: string } {
  const prefix = /^[^0-9-]*/.exec(text)![0]
  const rest = text.slice(prefix.length)
  const suffix = /[^0-9]*$/.exec(rest)![0]
  return { prefix, core: rest.slice(0, rest.length - suffix.length), suffix }
}

// Both endpoints of a decade bracket are exact powers of ten, so mass reads as "1.00 × 10^24" at each
// end and the repeated mantissa carries no information. Only mass formats this way, so nothing else
// matches. Dropping it leaves the exponents to carry the range.
function dropRepeatedMantissa(core: string): string {
  return core.replace(/^1(\.0+)? × /, "")
}

// Endpoints are formatted through the same per-property dispatch exact values use, then merged, so a
// range can never end up carrying a different unit from the value it brackets.
function joinRange(property: string, low: number, high: number): string {
  const start = splitUnits(formatPropertyValue(property, low))
  const end = splitUnits(formatPropertyValue(property, high))
  // A negative endpoint would otherwise read as "-70 - -60°C", where the separator cannot be picked
  // out from the minus signs.
  const separator = start.core.startsWith("-") || end.core.startsWith("-") ? " to " : " - "
  return `${end.prefix}${dropRepeatedMantissa(start.core)}${separator}${dropRepeatedMantissa(end.core)}${end.suffix}`
}

// Magnitudes are conventionally compared a whole step at a time, and a redshift of 0.2 versus 0.7 is a
// real difference, so both get a bracket fine enough to still mean something.
const MAGNITUDE_STEP = 1
const REDSHIFT_STEP = 0.5
// Below this the Celsius scale is crossing zero, where a proportional bracket would be absurdly tight.
const MIN_TEMPERATURE_STEP = 10

// A hint reveals which bracket a value falls in rather than the value itself, so the player learns the
// scale of the answer without being handed it.
export function formatPropertyRange(property: string, value: unknown): string {
  // Categories, types, host names and yes/no flags have no scale to bracket, so they reveal exactly as
  // they always did. Missing values fall through here too and stay a dash.
  if (typeof value !== "number" || !Number.isFinite(value)) return formatPropertyValue(property, value)

  // A year is not an order of magnitude. The decade it sits in is the bracket a player expects, and it
  // is also the one bracket that reads better as a word than as two endpoints.
  if (property === "discoveredYear") {
    if (value === PREHISTORIC_YEAR) return "Prehistoric"
    return `${Math.floor(value / 10) * 10}s`
  }

  // Stored in Kelvin but shown in Celsius, so the bracket has to be chosen on the Celsius value or its
  // boundaries would land on meaningless numbers once converted.
  if (property === "temperatureK") {
    const celsius = value - 273.15
    const magnitude = Math.abs(celsius)
    const step = magnitude < MIN_TEMPERATURE_STEP ? MIN_TEMPERATURE_STEP : Math.pow(10, decadeExponent(magnitude))
    const [low, high] = stepBracket(celsius, step)
    return joinRange(property, low + 273.15, high + 273.15)
  }

  if (property === "apparentMagnitude" || property === "brightestStarMagnitude") {
    const [low, high] = stepBracket(value, MAGNITUDE_STEP)
    return joinRange(property, low, high)
  }

  if (property === "redshift") {
    const [low, high] = stepBracket(value, REDSHIFT_STEP)
    return joinRange(property, low, high)
  }

  const [low, high] = decadeBracket(value)
  return joinRange(property, low, high)
}
