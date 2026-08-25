import { KofiWidget } from "./KofiWidget"

// The badge is 606x117 in its own viewBox, so the height below is that ratio at a 200px width.
// Both dimensions are stated so the footer does not reflow when the image arrives from the CDN.
const PLAYLIN_BADGE_WIDTH = 200
const PLAYLIN_BADGE_HEIGHT = 39

export function Footer({ onGlobalStatsClick }: { onGlobalStatsClick: () => void }) {
  return (
    <footer className="mt-10 flex flex-wrap items-center justify-center gap-4 border-t border-[#e0e0e0] pt-4 text-sm text-[#4d4d4d]">
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
      <a href="/about.html" className="hover:text-[#00998a] hover:underline">
        About
      </a>
      <a href="/privacy.html" className="hover:text-[#00998a] hover:underline">
        Privacy
      </a>
      <KofiWidget />
      <a
        href="https://playlin.io/game/cosmodle/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex transition-opacity hover:opacity-80"
      >
        <img
          src="https://cdn.playlin.io/creators/featured-dark.svg"
          alt="Cosmodle featured on Playlin"
          width={PLAYLIN_BADGE_WIDTH}
          height={PLAYLIN_BADGE_HEIGHT}
          loading="lazy"
          decoding="async"
        />
      </a>
    </footer>
  )
}
