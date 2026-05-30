import { create } from "zustand"
import { PX_PER_METER } from "@/lib/units"
import type { Box } from "@/lib/geometry"

// The "world" div is rendered with: transform: translate(panX, panY) scale(zoom)
// with transform-origin 0 0. (panX, panY) are screen pixels; zoom is unitless.

const MIN_ZOOM = 0.1
const MAX_ZOOM = 8

interface ViewportState {
  panX: number
  panY: number
  zoom: number
  setView: (v: Partial<Pick<ViewportState, "panX" | "panY" | "zoom">>) => void
  panBy: (dx: number, dy: number) => void
  /** Zoom by a multiplicative factor, keeping the given screen point fixed. */
  zoomAt: (factor: number, sx: number, sy: number) => void
  zoomToFit: (box: Box | null, viewW: number, viewH: number) => void
  reset: () => void
}

const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

export const useViewport = create<ViewportState>((set) => ({
  panX: 80,
  panY: 80,
  zoom: 1,

  setView: (v) => set(v),

  panBy: (dx, dy) => set((s) => ({ panX: s.panX + dx, panY: s.panY + dy })),

  zoomAt: (factor, sx, sy) =>
    set((s) => {
      const zoom = clampZoom(s.zoom * factor)
      const k = zoom / s.zoom
      // Keep world point under (sx, sy) stationary.
      return {
        zoom,
        panX: sx - (sx - s.panX) * k,
        panY: sy - (sy - s.panY) * k,
      }
    }),

  zoomToFit: (box, viewW, viewH) =>
    set(() => {
      if (!box || box.w <= 0 || box.h <= 0) {
        return { panX: 80, panY: 80, zoom: 1 }
      }
      const pad = 60
      const boxPxW = box.w * PX_PER_METER
      const boxPxH = box.h * PX_PER_METER
      const zoom = clampZoom(
        Math.min((viewW - pad * 2) / boxPxW, (viewH - pad * 2) / boxPxH),
      )
      const panX = (viewW - boxPxW * zoom) / 2 - box.x * PX_PER_METER * zoom
      const panY = (viewH - boxPxH * zoom) / 2 - box.y * PX_PER_METER * zoom
      return { panX, panY, zoom }
    }),

  reset: () => set({ panX: 80, panY: 80, zoom: 1 }),
}))

/** Convert a screen point (relative to the canvas viewport) to world meters. */
export function screenToWorldMeters(
  sx: number,
  sy: number,
  v: Pick<ViewportState, "panX" | "panY" | "zoom">,
): { mx: number; my: number } {
  const worldPxX = (sx - v.panX) / v.zoom
  const worldPxY = (sy - v.panY) / v.zoom
  return { mx: worldPxX / PX_PER_METER, my: worldPxY / PX_PER_METER }
}
