// Editor commands that are triggered from more than one place (toolbar button,
// keyboard shortcut). Keeping them here means the caller performs the action in
// its own event handler instead of setting a tool and letting a render effect
// notice and mutate the document.

import { createElement } from "@/lib/elements"
import { useEditor } from "@/store/useEditor"
import { screenToWorldMeters, useViewport } from "@/store/useViewport"

const TEXT_W = 2 // meters
const TEXT_H = 0.5 // meters

/** Center of the current canvas viewport, in world meters. */
export function viewportCenterMeters() {
  const vp = document
    .querySelector("[data-canvas-viewport]")
    ?.getBoundingClientRect()
  const v = useViewport.getState()
  return screenToWorldMeters((vp?.width ?? 800) / 2, (vp?.height ?? 600) / 2, v)
}

/**
 * Drop a text box at the center of the view and start editing it right away.
 * Text is an immediate action rather than a drawing mode, so it never leaves
 * the tool parked on "text".
 */
export function insertTextAtViewportCenter() {
  const { mx, my } = viewportCenterMeters()
  const el = createElement("text", mx, my, TEXT_W, TEXT_H)
  if (!el) return

  const editor = useEditor.getState()
  editor.setTool("select")
  editor.addElement(el)
  editor.setEditing(el.id)
}
