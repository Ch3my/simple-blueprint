import type { Element, Tool } from "@/types/blueprint"
import { uid } from "@/lib/geometry"

const DEFAULT_STROKE_WIDTH = 0.03 // meters

/**
 * Build a new element of the given tool type, centered at world point (cx, cy).
 * `a` and `b` are dimensions in meters (b is null when the user gave one value).
 * Returns null for the "select" tool.
 */
export function createElement(
  tool: Tool,
  cx: number,
  cy: number,
  a: number,
  b: number | null,
): Element | null {
  const base = {
    id: uid(),
    rotation: 0,
    stroke: "currentColor",
    strokeWidth: DEFAULT_STROKE_WIDTH,
    z: 0,
  }

  switch (tool) {
    case "rectangle": {
      const w = a
      const h = b ?? a
      return { ...base, type: "rectangle", x: cx - w / 2, y: cy - h / 2, w, h, fill: "none" }
    }
    case "ellipse": {
      const rx = a / 2
      const ry = (b ?? a) / 2
      return { ...base, type: "ellipse", x: cx - rx, y: cy - ry, rx, ry, fill: "none" }
    }
    case "line": {
      return { ...base, type: "line", x: cx - a / 2, y: cy, x2: cx + a / 2, y2: cy }
    }
    case "arrow": {
      return { ...base, type: "arrow", x: cx - a / 2, y: cy, x2: cx + a / 2, y2: cy }
    }
    case "text": {
      const w = a
      const h = b ?? 0.5
      return {
        ...base,
        type: "text",
        x: cx - w / 2,
        y: cy - h / 2,
        w,
        h,
        html: "Text",
        fontSize: 0.2,
        color: "currentColor",
        fill: "none",
      }
    }
    default:
      return null
  }
}
