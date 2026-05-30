import { useRef } from "react"
import { useDrag, useWheel } from "@use-gesture/react"
import { useViewport } from "@/store/useViewport"

/**
 * Wires @use-gesture to the canvas viewport.
 * - `bindWheel` (on the viewport) zooms toward the cursor.
 * - `bindPan` (on the empty background surface) pans the world.
 */
export function usePanZoom() {
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

  const bindPan = useDrag(
    ({ delta: [dx, dy], pinching }) => {
      if (pinching) return
      panBy(dx, dy)
    },
    { filterTaps: true, pointer: { keys: false } },
  )

  return { viewportRef, bindWheel, bindPan }
}
