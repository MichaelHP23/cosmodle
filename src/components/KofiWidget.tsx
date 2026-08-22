// Ko-fi ships a floating overlay widget, but it pins itself to the corner of the viewport and cannot
// be placed in the page, so it could never sit in the footer with everything else. This rebuilds the
// same button they draw, using their own cup asset so the branding is theirs rather than an
// approximation, and drops the third-party script that used to inject it.
const KOFI_URL = "https://ko-fi.com/sawsymikey"
const CUP_SRC = "https://storage.ko-fi.com/cdn/cup-border.png"

// The cup asset is 285x229, so these keep its aspect ratio and stop the row reflowing once it loads.
const CUP_WIDTH = 20
const CUP_HEIGHT = 16

export function KofiWidget() {
  return (
    <a
      href={KOFI_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-[39px] items-center gap-2 rounded-full bg-[#00b9fe] py-1 pl-1 pr-4 font-semibold text-white transition-colors hover:bg-[#00a3e0]"
    >
      <span className="flex h-[31px] w-[31px] items-center justify-center rounded-full bg-white">
        <img
          src={CUP_SRC}
          alt=""
          width={CUP_WIDTH}
          height={CUP_HEIGHT}
          loading="lazy"
          decoding="async"
        />
      </span>
      Support me
    </a>
  )
}
