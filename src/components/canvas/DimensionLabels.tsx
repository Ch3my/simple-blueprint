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
        if (el.type === "text") return null
        if (el.showLabel === false) return null
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
        const rot = el.rotation || 0
        const θ = (rot * Math.PI) / 180
        const cx = b.x + b.w / 2
        const cy = b.y + b.h / 2

        // Rotated bottom-center anchor + outward offset
        const wAnchor = screen(
          cx - (b.h / 2) * Math.sin(θ),
          cy + (b.h / 2) * Math.cos(θ),
        )
        // Rotated left-center anchor + outward offset
        const hAnchor = screen(
          cx - (b.w / 2) * Math.cos(θ),
          cy - (b.w / 2) * Math.sin(θ),
        )

        return (
          <div key={el.id}>
            <div
              style={{
                ...labelStyle,
                left: wAnchor.left - Math.sin(θ) * 12,
                top: wAnchor.top + Math.cos(θ) * 12,
                transform: `translate(-50%, -50%) rotate(${rot}deg)`,
              }}
            >
              {formatLength(b.w, unit)}
            </div>
            <div
              style={{
                ...labelStyle,
                left: hAnchor.left - Math.cos(θ) * 16,
                top: hAnchor.top - Math.sin(θ) * 16,
                transform: `translate(-50%, -50%) rotate(${rot - 90}deg)`,
              }}
            >
              {formatLength(b.h, unit)}
            </div>
          </div>
        )
      })}
    </>
  )
}
