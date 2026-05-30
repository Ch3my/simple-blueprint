import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useEditor } from "@/store/useEditor"
import { useViewport, screenToWorldMeters } from "@/store/useViewport"
import { createElement } from "@/lib/elements"
import { parseDims, fromDisplay } from "@/lib/units"

// Tools that ask for dimensions via this input. "text" is handled separately:
// picking the Text tool drops an editable box immediately (no dimension prompt).
type SizedTool = "rectangle" | "ellipse" | "line" | "arrow"

const HINTS: Record<SizedTool, string> = {
  rectangle: "width x height — e.g. 5x2",
  ellipse: "diameter, or width x height — e.g. 0.2",
  line: "length — e.g. 3",
  arrow: "length — e.g. 3",
}

const TITLES: Record<SizedTool, string> = {
  rectangle: "Rectangle",
  ellipse: "Circle / Ellipse",
  line: "Line",
  arrow: "Arrow",
}

/** Center of the current viewport, in world meters. */
function viewportCenterMeters() {
  const vp = document
    .querySelector("[data-canvas-viewport]")
    ?.getBoundingClientRect()
  const v = useViewport.getState()
  return screenToWorldMeters((vp?.width ?? 800) / 2, (vp?.height ?? 600) / 2, v)
}

export function ShapeSizeInput() {
  const tool = useEditor((s) => s.tool)
  const unit = useEditor((s) => s.settings.unit)
  const addElement = useEditor((s) => s.addElement)
  const pushHistory = useEditor((s) => s.pushHistory)
  const setTool = useEditor((s) => s.setTool)
  const setEditing = useEditor((s) => s.setEditing)
  const [value, setValue] = useState("")
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (tool === "text") {
      // Drop a default text box at center and start editing right away.
      const { mx, my } = viewportCenterMeters()
      const el = createElement("text", mx, my, 2, 0.5)
      if (el) {
        pushHistory()
        addElement(el)
        setEditing(el.id)
      }
      setTool("select")
      return
    }
    if (tool !== "select") {
      setValue("")
      setError(false)
      inputRef.current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool])

  if (tool === "select" || tool === "text") return null

  const submit = () => {
    const parsed = parseDims(value)
    if (!parsed) {
      setError(true)
      return
    }
    // Convert display-unit values to canonical meters.
    const a = fromDisplay(parsed.a, unit)
    const b = parsed.b === null ? null : fromDisplay(parsed.b, unit)

    const { mx, my } = viewportCenterMeters()
    const el = createElement(tool, mx, my, a, b)
    if (!el) return
    pushHistory()
    addElement(el)
    setTool("select")
  }

  return (
    <div className="bg-card text-card-foreground absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-2 rounded-md border p-2 shadow-md">
      <span className="text-muted-foreground px-1 text-sm font-medium">
        {TITLES[tool]}
      </span>
      <Input
        ref={inputRef}
        value={value}
        aria-invalid={error}
        placeholder={HINTS[tool]}
        className="h-8 w-56"
        onChange={(e) => {
          setValue(e.target.value)
          setError(false)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit()
          if (e.key === "Escape") setTool("select")
        }}
      />
      <span className="text-muted-foreground text-xs">{unit}</span>
      <Button size="sm" className="h-8" onClick={submit}>
        Add
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8"
        onClick={() => setTool("select")}
      >
        Cancel
      </Button>
    </div>
  )
}
