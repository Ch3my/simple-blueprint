import { useEffect, useRef, useState } from "react"
import { useExport } from "@/store/useExport"
import { useProjects } from "@/store/useProjects"
import { exportProjectPNG } from "@/lib/export"
import { Button } from "@/components/ui/button"

type Pt = { x: number; y: number }

const waitForPaint = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  )

export function ExportCropOverlay() {
  const active = useExport((s) => s.active)
  const deactivate = useExport((s) => s.deactivate)
  const setCapturing = useExport((s) => s.setCapturing)
  const currentName = useProjects((s) => s.currentName)

  const [start, setStart] = useState<Pt | null>(null)
  const [end, setEnd] = useState<Pt | null>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (active) {
      setStart(null)
      setEnd(null)
      setDragging(false)
    }
  }, [active])

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") deactivate()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [active, deactivate])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: PointerEvent) => setEnd({ x: e.clientX, y: e.clientY })
    const onUp = () => setDragging(false)
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
  }, [dragging])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    setStart({ x: e.clientX, y: e.clientY })
    setEnd({ x: e.clientX, y: e.clientY })
    setDragging(true)
  }

  const selRect =
    start && end
      ? {
          left: Math.min(start.x, end.x),
          top: Math.min(start.y, end.y),
          width: Math.abs(end.x - start.x),
          height: Math.abs(end.y - start.y),
        }
      : null

  const hasSelection = !!selRect && selRect.width > 10 && selRect.height > 10 && !dragging

  // Kept in a ref so the Enter handler below always runs the current selection
  // without re-subscribing on every pointer move. Assigned in an effect rather
  // than during render: React may start a render and discard it, and writing
  // here during render would leave the handler holding a closure over state
  // that was thrown away.
  const doExportRef = useRef<() => void>(() => undefined)
  useEffect(() => {
    doExportRef.current = async () => {
      if (!hasSelection || !selRect) return
      setCapturing(true)
      await waitForPaint()
      try {
        await exportProjectPNG(currentName, {
          x: selRect.left,
          y: selRect.top,
          w: selRect.width,
          h: selRect.height,
        })
        await new Promise((resolve) => setTimeout(resolve, 150))
      } finally {
        setCapturing(false)
        deactivate()
      }
    }
  })

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") doExportRef.current()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [active])

  if (!active) return null

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, cursor: "crosshair" }}
      onPointerDown={handlePointerDown}
    >
      {!selRect && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              color: "#fff",
              textAlign: "center",
              fontSize: 14,
              lineHeight: 1.6,
              userSelect: "none",
            }}
          >
            Selecciona el area a exportar
            <br />
            <span style={{ fontSize: 12, opacity: 0.6 }}>Esc para cancelar</span>
          </div>
        </div>
      )}

      {selRect && (
        <div
          style={{
            position: "absolute",
            left: selRect.left,
            top: selRect.top,
            width: selRect.width,
            height: selRect.height,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
            border: "1.5px solid rgba(255,255,255,0.85)",
            pointerEvents: "none",
          }}
        />
      )}

      {hasSelection && (
        <div
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 6,
            zIndex: 51,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Button variant="secondary" onClick={deactivate}>
            Cancel
          </Button>
          <Button onClick={() => void doExportRef.current()}>
            Export
          </Button>
        </div>
      )}
    </div>
  )
}
