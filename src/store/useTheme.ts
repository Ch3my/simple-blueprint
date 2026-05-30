import { create } from "zustand"

export type Theme = "light" | "dark"

const STORAGE_KEY = "bp:theme"

function getInitial(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === "light" || saved === "dark") return saved
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function apply(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark")
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
    toggle: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
  }
})
