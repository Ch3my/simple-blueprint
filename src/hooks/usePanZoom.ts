import { useRef } from "react"
import { useDrag, useWheel, usePinch } from "@use-gesture/react"
import { useViewport } from "@/store/useViewport"

/**
 * Wires @use-gesture to the canvas viewport.
 * - `bindWheel` (on the viewport) zooms toward the cursor.
 * - `bindPinch` (on the viewport) pinch-zooms toward the midpoint.
 * - `bindPan` (on the empty background surface) pans the world; a plain click
 *   (tap) fires `onBackgroundTap` for deselecting.
 */
export function usePanZoom(onBackgroundTap?: () => void) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const panBy = useViewport((s) => s.panBy)
  const zoomAt = useViewport((s) => s.zoomAt)

  const bindWheel = useWheel(
    ({ event, delta: [, dy] }) => {
      event.preventDefault()
      const rect = viewportRef.current?.getBoundingClientRect()
      if (!rect) return
      const sx = event.clientX - rect.left
      const sy = event.clientY - rect.top
      const factor = dy > 0 ? 0.9 : 1.1
      zoomAt(factor, sx, sy)
    },
    { eventOptions: { passive: false } },
  )

  const bindPinch = usePinch(
    ({ memo, da: [d], origin: [ox, oy] }) => {
      const prev = memo ?? d
      const factor = d / prev
      const rect = viewportRef.current?.getBoundingClientRect()
      if (!rect) return d
      const sx = ox - rect.left
      const sy = oy - rect.top
      zoomAt(factor, sx, sy)
      return d
    },
    { eventOptions: { passive: false } },
  )

  const bindPan = useDrag(
    ({ delta: [dx, dy], pinching, tap }) => {
      if (tap) {
        onBackgroundTap?.()
        return
      }
      if (pinching) return
      panBy(dx, dy)
    },
    { filterTaps: true, pointer: { keys: false } },
  )

  return { viewportRef, bindWheel, bindPinch, bindPan }
}
