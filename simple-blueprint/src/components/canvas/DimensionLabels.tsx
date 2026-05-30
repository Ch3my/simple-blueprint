import type { CSSProperties } from "react"
import { PX_PER_METER, formatLength } from "@/lib/units"
import { elementBox } from "@/lib/geometry"
import { useEditor } from "@/store/useEditor"
import { useViewport } from "@/store/useViewport"

const labelStyle: CSSProperties = {
  position: "absolute",
  transform: "translate(-50%, -50%)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "0 4px",
  fontSize: 11,
  lineHeight: "16px",
  whiteSpace: "nowrap",
  pointerEvents: "none",
}

/** Constant-size measurement labels drawn in screen space over each element. */
export function DimensionLabels() {
  const elements = useEditor((s) => s.elements)
  const unit = useEditor((s) => s.settings.unit)
  const { zoom, panX, panY } = useViewport()

  const screen = (mx: number, my: number) => ({
    left: mx * PX_PER_METER * zoom + panX,
    top: my * PX_PER_METER * zoom + panY,
  })

  return (
    <>
      {elements.map((el) => {
        if (el.type === "line" || el.type === "arrow") {
          const len = Math.hypot(el.x2 - el.x, el.y2 - el.y)
          const p = screen((el.x + el.x2) / 2, (el.y + el.y2) / 2)
          return (
            <div key={el.id} style={{ ...labelStyle, ...p, transform: "translate(-50%, -130%)" }}>
              {formatLength(len, unit)}
            </div>
          )
        }
        const b = elementBox(el)
        const wPos = screen(b.x + b.w / 2, b.y + b.h)
        const hPos = screen(b.x, b.y + b.h / 2)
        return (
          <div key={el.id}>
            <div style={{ ...labelStyle, left: wPos.left, top: wPos.top + 12 }}>
              {formatLength(b.w, unit)}
            </div>
            <div style={{ ...labelStyle, left: hPos.left - 16, top: hPos.top }}>
              {formatLength(b.h, unit)}
            </div>
          </div>
        )
      })}
    </>
  )
}
