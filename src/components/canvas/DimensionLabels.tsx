import type { CSSProperties } from "react"
import { PX_PER_METER, formatLength } from "@/lib/units"
import { elementBox } from "@/lib/geometry"
import { useEditor } from "@/store/useEditor"
import { useViewport } from "@/store/useViewport"
import type { LabelColor, LabelPosition } from "@/types/blueprint"
import { cn } from "@/lib/utils"

const LABEL_COLOR_CLASSES: Record<LabelColor, string> = {
  gray:   "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  green:  "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  sky:    "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  purple: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  red:    "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
}

// Normalized (x, y) offsets from center: -0.5 = left/top, 0 = center, 0.5 = right/bottom
const POSITION_OFFSETS: Record<LabelPosition, [number, number]> = {
  "top-left":      [-0.5, -0.5], "top-center":    [0, -0.5], "top-right":      [0.5, -0.5],
  "middle-left":   [-0.5,  0  ], "middle-center": [0,  0  ], "middle-right":   [0.5,  0  ],
  "bottom-left":   [-0.5,  0.5], "bottom-center": [0,  0.5], "bottom-right":   [0.5,  0.5],
}

// Screen-space inward padding (px) so edge labels don't sit flush on the shape border
const LABEL_EDGE_PADDING = 24

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

  const labelBadges = elements
    .filter((el) => el.type !== "text" && el.label)
    .map((el) => {
      let left: number, top: number

      if (el.type === "line" || el.type === "arrow") {
        const p = screen((el.x + el.x2) / 2, (el.y + el.y2) / 2)
        left = p.left
        top = p.top
      } else {
        const b = elementBox(el)
        const rot = el.rotation || 0
        const θ = (rot * Math.PI) / 180
        const cx = b.x + b.w / 2
        const cy = b.y + b.h / 2
        const [nx, ny] = POSITION_OFFSETS[el.labelPosition ?? "middle-center"]
        const dx = nx * b.w
        const dy = ny * b.h
        const rotX = dx * Math.cos(θ) - dy * Math.sin(θ)
        const rotY = dx * Math.sin(θ) + dy * Math.cos(θ)
        const p = screen(cx + rotX, cy + rotY)
        // Nudge non-center labels inward (screen space, rotation-aware)
        const padX = nx !== 0 ? -Math.sign(nx) * LABEL_EDGE_PADDING : 0
        const padY = ny !== 0 ? -Math.sign(ny) * LABEL_EDGE_PADDING : 0
        left = p.left + padX * Math.cos(θ) - padY * Math.sin(θ)
        top  = p.top  + padX * Math.sin(θ) + padY * Math.cos(θ)
      }

      const colorClass = LABEL_COLOR_CLASSES[el.labelColor ?? "gray"]
      return (
        <div
          key={`lbl-${el.id}`}
          className={cn("absolute rounded-full text-[11px] leading-4 whitespace-nowrap pointer-events-none", colorClass)}
          style={{ left, top, transform: "translate(-50%, -50%)", padding: "0 6px" }}
        >
          {el.label}
        </div>
      )
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
      {labelBadges}
    </>
  )
}
