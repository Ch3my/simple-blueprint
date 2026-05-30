import { create } from "zustand"

export type Theme = "light" | "dark" | "blue"

const STORAGE_KEY = "bp:theme"

const CYCLE: Theme[] = ["light", "dark", "blue"]

function getInitial(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === "light" || saved === "dark" || saved === "blue") return saved
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function apply(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark" || theme === "blue")
  document.documentElement.classList.toggle("blue", theme === "blue")
}

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggle: () => void
}

export const useTheme = create<ThemeState>((set, get) => {
  const initial = getInitial()
  apply(initial)
  return {
    theme: initial,
    setTheme: (theme) => {
      localStorage.setItem(STORAGE_KEY, theme)
      apply(theme)
      set({ theme })
    },
    toggle: () => {
      const next = CYCLE[(CYCLE.indexOf(get().theme) + 1) % CYCLE.length]
      get().setTheme(next)
    },
  }
})
