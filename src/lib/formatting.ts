export function formatAU(v: number): string {
  return `${v.toFixed(2)} AU`
}

export function formatKm(v: number): string {
  return `${Math.round(v).toLocaleString("en-US")} km`
}

export function formatKelvinAsCelsius(k: number): string {
  const c = Math.round(k - 273.15)
  return `${c}°C`
}

export function formatDays(v: number): string {
  return `${Math.round(v).toLocaleString("en-US")} days`
}

export function formatHours(v: number): string {
  return `${v} hours`
}

export function formatMassKg(v: number): string {
  const exponent = Math.floor(Math.log10(Math.abs(v)))
  const mantissa = v / Math.pow(10, exponent)
  return `${mantissa.toFixed(2)} × 10^${exponent} kg`
}

export function formatGravity(v: number): string {
  return `${v} m/s²`
}
