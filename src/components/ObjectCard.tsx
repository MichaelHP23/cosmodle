import type { CelestialObject } from "../types/celestial"
import { ObjectPortrait } from "./ObjectPortrait"

export function ObjectCard({ object }: { object: CelestialObject }) {
  return (
    <div className="rounded-xl border-2 border-[var(--line-strong)] bg-[var(--bg)] p-4 text-center">
      <ObjectPortrait object={object} size={96} />
      <h2 className="mt-3 text-xl font-bold text-[var(--ink-strong)]">{object.name}</h2>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--teal)]">
        {object.category.replace("_", " ")}
      </div>
      {object.description && <p className="text-sm text-[var(--ink-2)]">{object.description}</p>}
    </div>
  )
}
