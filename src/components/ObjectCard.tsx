import type { CelestialObject } from "../types/celestial"
import { ObjectPortrait } from "./ObjectPortrait"

export function ObjectCard({ object }: { object: CelestialObject }) {
  return (
    <div className="rounded-xl border-2 border-[#4d4d4d] bg-[#fff8e7] p-4 text-center">
      <ObjectPortrait object={object} size={96} />
      <h2 className="mt-3 text-xl font-bold text-[#1a1a1a]">{object.name}</h2>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#00998a]">
        {object.category.replace("_", " ")}
      </div>
      {object.description && <p className="text-sm text-[#4d4d4d]">{object.description}</p>}
    </div>
  )
}
