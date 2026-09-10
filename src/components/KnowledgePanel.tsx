import type { PropertyKnowledge } from "../lib/knowledge"

// No card, no border, no coloured pip per row. Every row used to carry a dot saying whether the value
// was pinned or merely bounded, which the wording already says — "Comet" against "under 11 km" — so
// the dots were thirty-odd marks of pure decoration competing with the numbers they sat next to.
export function KnowledgePanel({ knowledge }: { knowledge: PropertyKnowledge[] }) {
  return (
    <div>
      {knowledge.map(row => (
        <div
          key={row.property}
          className="flex items-baseline justify-between gap-4 border-b border-[#ece2cd] px-0.5 py-3 last:border-b-0"
        >
          <span className="text-sm text-[#8b8598]">{row.label}</span>
          <span
            className={`text-right text-sm ${
              row.state === "unknown" ? "text-[#c4bdb0]" : "font-semibold text-[#2f2b40]"
            }`}
          >
            {row.display}
          </span>
        </div>
      ))}
    </div>
  )
}
