import { KofiWidget } from "./KofiWidget"

export function Footer({ onGlobalStatsClick }: { onGlobalStatsClick: () => void }) {
  return (
    <footer className="mt-10 flex items-center justify-center gap-4 border-t border-[#e0e0e0] pt-4 text-sm text-[#4d4d4d]">
      <a
        href="https://michael-pink.com"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-[#00998a] hover:underline"
      >
        michael-pink.com
      </a>
      <button className="hover:text-[#00998a] hover:underline" onClick={onGlobalStatsClick}>
        Global Stats
      </button>
      <KofiWidget />
    </footer>
  )
}
