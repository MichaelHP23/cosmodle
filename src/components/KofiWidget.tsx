// Ko-fi ships a floating overlay widget, but it pins itself to the corner of the viewport and cannot
// be placed in the page, so it could never sit on the same line as the rest of the footer. Rendering
// the link ourselves puts it in the footer where it belongs and drops a third-party script along with
// it, which is one fewer request and one fewer thing that can fail to load.
const KOFI_URL = "https://ko-fi.com/sawsymikey"

function CupIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none">
      <path
        d="M4 5h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V5Z"
        fill="#fff"
        stroke="#fff"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M17 7h1.5a2.5 2.5 0 0 1 0 5H17"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M8 9.2c1.2-.9 2.4.9 3.6 0"
        stroke="#00b9fe"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M3 20h15" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function KofiWidget() {
  return (
    <a
      href={KOFI_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-[39px] items-center gap-2 rounded-full bg-[#00b9fe] px-4 font-semibold text-white transition-colors hover:bg-[#00a3e0]"
    >
      <CupIcon />
      Support me
    </a>
  )
}
