import { KofiWidget } from "./KofiWidget"

export function Footer() {
  return (
    <footer className="mt-10 flex justify-center border-t border-[#e0e0e0] pt-4 text-sm text-[#4d4d4d]">
      <a
        href="https://michael-pink.com"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-[#00998a] hover:underline"
      >
        michael-pink.com
      </a>
      <KofiWidget />
    </footer>
  )
}
