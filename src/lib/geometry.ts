import type { Element } from "@/types/blueprint"

/** Generate a short, reasonably-unique id. */
export function uid(): string {
  return (
    Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
  )
}

/** Snap a value to the nearest multiple of `step` (no-op if step <= 0). */
export function snap(value: number, step: number): number {
  if (step <= 0) return value
  return Math.round(value / step) * step
}

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** Axis-aligned bounding box of an element, in meters. */
export function elementBox(el: Element): Box {
  switch (el.type) {
    case "rectangle":
    case "text":
      return { x: el.x, y: el.y, w: el.w, h: el.h }
    case "ellipse":
      return { x: el.x, y: el.y, w: el.rx * 2, h: el.ry * 2 }
    case "line":
    case "arrow":
      return {
        x: Math.min(el.x, el.x2),
        y: Math.min(el.y, el.y2),
        w: Math.abs(el.x2 - el.x),
        h: Math.abs(el.y2 - el.y),
      }
  }
}

/** Combined bounding box of many elements (null if empty). */
export function combinedBox(elements: Element[]): Box | null {
  if (elements.length === 0) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const el of elements) {
    const b = elementBox(el)
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.w)
    maxY = Math.max(maxY, b.y + b.h)
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}
