import type { KnowledgeState, PropertyKnowledge } from "../lib/knowledge"

const PIP: Record<KnowledgeState, string> = {
  locked: "#e8a33d",
  narrowed: "#7c74c9",
  unknown: "#ded5c2",
}

// One row per property, and the same eight rows all game: this is what the player has worked out, so
// it replaces a board that used to grow by a full grid with every guess.
export function KnowledgePanel({ knowledge }: { knowledge: PropertyKnowledge[] }) {
  return (
    <div className="rounded-xl border border-[#eae0cb] bg-[#fffdf7] px-3">
      {knowledge.map(row => (
        <div
          key={row.property}
          className="flex items-center gap-2.5 border-b border-[#f5eee1] py-2 last:border-b-0"
        >
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: PIP[row.state] }}
            aria-hidden="true"
          />
          <span className="flex-1 text-xs leading-tight text-[#8a8399]">{row.label}</span>
          <span
            className={`text-right text-xs font-semibold ${
              row.state === "unknown"
                ? "text-[#c3bbab]"
                : row.state === "locked"
                  ? "text-[#c9852a]"
                  : "text-[#2c2742]"
            }`}
          >
            {row.display}
          </span>
        </div>
      ))}
    </div>
  )
}
