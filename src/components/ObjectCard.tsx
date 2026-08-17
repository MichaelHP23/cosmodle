import type { CelestialObject } from "../types/celestial"

export function ObjectCard({ object }: { object: CelestialObject }) {
  return (
    <div className="rounded-lg bg-slate-800 p-4">
      <h2 className="text-xl font-bold text-slate-100">{object.name}</h2>
      <div className="mb-2 text-xs uppercase text-slate-400">{object.category.replace("_", " ")}</div>
      {object.description && <p className="text-sm text-slate-300">{object.description}</p>}
    </div>
  )
}
