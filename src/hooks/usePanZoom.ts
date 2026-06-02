import { useRef } from "react"
import { useDrag, useGesture } from "@use-gesture/react"
import { useViewport } from "@/store/useViewport"

export function usePanZoom(onBackgroundTap?: () => void) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const panBy = useViewport((s) => s.panBy)
  const zoomAt = useViewport((s) => s.zoomAt)

  // useGesture combines wheel + pinch under one bind call so they share a
  // single ref — spreading two separate hooks (useWheel + usePinch) on the
  // same element causes the second ref to silently overwrite the first.
  const bindViewport = useGesture(
    {
      onWheel: ({ event, delta: [, dy] }) => {
        event.preventDefault()
        const rect = viewportRef.current?.getBoundingClientRect()
        if (!rect) return
        const sx = event.clientX - rect.left
        const sy = event.clientY - rect.top
        const factor = dy > 0 ? 0.9 : 1.1
        zoomAt(factor, sx, sy)
      },
      onPinch: ({ memo, da: [d], origin: [ox, oy], touches }) => {
        if (touches < 2) return memo
        const prev = memo ?? d
        const factor = d / prev
        const rect = viewportRef.current?.getBoundingClientRect()
        if (!rect) return d
        const sx = ox - rect.left
        const sy = oy - rect.top
        zoomAt(factor, sx, sy)
        return d
      },
    },
    {
      wheel: { eventOptions: { passive: false } },
      pinch: { eventOptions: { passive: false } },
    },
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

  return { viewportRef, bindViewport, bindPan }
}
