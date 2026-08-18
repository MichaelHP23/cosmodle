import { useEffect } from "react"

declare global {
  interface Window {
    kofiWidgetOverlay?: {
      draw: (username: string, options: Record<string, string>) => void
    }
  }
}

const SCRIPT_SRC = "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"

export function KofiWidget() {
  useEffect(() => {
    function draw() {
      window.kofiWidgetOverlay?.draw("sawsymikey", {
        type: "floating-chat",
        "floating-chat.donateButton.text": "Support me",
        "floating-chat.donateButton.background-color": "#00b9fe",
        "floating-chat.donateButton.text-color": "#fff",
      })
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      if (window.kofiWidgetOverlay) draw()
      else existing.addEventListener("load", draw)
      return
    }

    const script = document.createElement("script")
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = draw
    document.body.appendChild(script)
  }, [])

  return null
}
