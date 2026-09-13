import { useEffect, useState } from "react"

export type Theme = "light" | "dark"

export const THEME_KEY = "cosmodle:theme"

// What the operating system asks for, which is the default until the player says otherwise.
function systemTheme(): Theme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function storedTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    return stored === "light" || stored === "dark" ? stored : null
  } catch {
    // Safari in private mode throws on localStorage rather than returning null.
    return null
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => storedTheme() ?? systemTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Follow the system while the player has expressed no preference of their own — someone whose phone
  // switches to dark at sunset should see the same here without having to come and set it.
  useEffect(() => {
    if (storedTheme() !== null) return
    const query = window.matchMedia?.("(prefers-color-scheme: dark)")
    if (!query) return
    const onChange = () => {
      if (storedTheme() === null) setTheme(query.matches ? "dark" : "light")
    }
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [])

  function toggleTheme() {
    setTheme(current => {
      const next: Theme = current === "dark" ? "light" : "dark"
      try {
        localStorage.setItem(THEME_KEY, next)
      } catch {
        // Not being able to remember the choice is survivable; refusing to switch is not.
      }
      return next
    })
  }

  return { theme, toggleTheme }
}
