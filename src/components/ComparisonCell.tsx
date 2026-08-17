import type { ProfileEntry, ComparisonResult } from "../types/game"
import { formatAU, formatKm, formatKelvinAsCelsius, formatDays, formatHours, formatMassKg, formatGravity } from "../lib/formatting"

const STATUS_EMOJI: Record<ComparisonResult["status"], string> = {
  correct: "🟩",
  close: "🟨",
  higher: "⬆️",
  lower: "⬇️",
  incorrect: "🟥",
  not_applicable: "—",
}

function formatValue(property: string, value: unknown): string {
  if (value === undefined || value === null) return "—"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (property === "distanceFromSunAU") return formatAU(value as number)
  if (property === "distanceFromParentKm" || property === "diameterKm") return formatKm(value as number)
  if (property === "temperatureK") return formatKelvinAsCelsius(value as number)
  if (property === "orbitalPeriodDays") return formatDays(value as number)
  if (property === "rotationPeriodHours") return formatHours(value as number)
  if (property === "massKg") return formatMassKg(value as number)
  if (property === "gravityMs2") return formatGravity(value as number)
  return String(value)
}

export function ComparisonCell({
  entry,
  result,
  guessValue,
}: {
  entry: ProfileEntry
  result: ComparisonResult
  guessValue: unknown
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-700 py-2 text-sm">
      <span className="text-slate-400">{entry.label}</span>
      <span className="font-mono text-slate-100">{formatValue(entry.property, guessValue)}</span>
      <span className="w-6 text-center">{STATUS_EMOJI[result.status]}</span>
    </div>
  )
}
