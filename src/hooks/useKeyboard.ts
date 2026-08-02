import { useEffect } from "react"
import { useEditor } from "@/store/useEditor"
import type { Tool } from "@/types/blueprint"

const TOOL_KEYS: Record<string, Tool> = {
  v: "select",
  r: "rectangle",
  c: "ellipse",
  l: "line",
  a: "arrow",
  t: "text",
  d: "door",
  s: "stairs",
}

function isTyping(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    (el as HTMLElement).isContentEditable
  )
}

/** Global keyboard shortcuts for the editor. */
export function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useEditor.getState()
      const meta = e.ctrlKey || e.metaKey

      // View-only mode swallows every editing shortcut; Escape is the way out.
      // Dialogs still own their own keys, hence the isTyping() exemption.
      if (s.viewLock && !isTyping()) {
        if (e.key === "Escape") s.toggleViewLock()
        return
      }

      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault()
        if (e.shiftKey) s.redo()
        else s.undo()
        return
      }
      if (meta && e.key.toLowerCase() === "y") {
        e.preventDefault()
        s.redo()
        return
      }

      if (isTyping()) return

      if (e.key === "Delete" || e.key === "Backspace") {
        if (s.selectedId) {
          e.preventDefault()
          s.pushHistory()
          s.removeElement(s.selectedId)
        }
        return
      }
      if (e.key === "Escape") {
        s.setTool("select")
        s.select(null)
        return
      }
      const tool = TOOL_KEYS[e.key.toLowerCase()]
      if (tool) s.setTool(tool)
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
}
