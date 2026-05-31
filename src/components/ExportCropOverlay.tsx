import { useEffect, useRef, useState } from "react"
import { useExport } from "@/store/useExport"
import { useProjects } from "@/store/useProjects"
import { exportProjectPNG } from "@/lib/export"
import { Button } from "@/components/ui/button"

type Pt = { x: number; y: number }

/** Wait for two animation frames — enough for React to commit + browser to paint. */
const waitForPaint = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  )

export function ExportCropOverlay() {
  const active = useExport((s) => s.active)
  const deactivate = useExport((s) => s.deactivate)
  const currentName = useProjects((s) => s.currentName)

  const [start, setStart] = useState<Pt | null>(null)
  const [end, setEnd] = useState<Pt | null>(null)
  const [dragging, setDragging] = useState(false)
  const [capturing, setCapturing] = useState(false)

  // Reset when overlay opens
  useEffect(() => {
    if (active) {
      setStart(null)
      setEnd(null)
      setDragging(false)
      setCapturing(false)
    }
  }, [active])

  // Escape cancels
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") deactivate()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [active, deactivate])

  // Pointer move/up tracked at window level while dragging
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

  // Keep a stable ref so the keydown handler can call the latest version
  const doExportRef = useRef<() => void>(() => undefined)
  doExportRef.current = async () => {
    if (!hasSelection || !selRect) return
    setCapturing(true)
    // Wait for the white mask to paint — this hides the dark→light flash
    await waitForPaint()
    try {
      await exportProjectPNG(currentName, {
        x: selRect.left,
        y: selRect.top,
        w: selRect.width,
        h: selRect.height,
      })
      // Short delay so the restored theme finishes painting before the mask lifts
      await new Promise((resolve) => setTimeout(resolve, 150))
    } finally {
      setCapturing(false)
      deactivate()
    }
  }

  // Enter key confirms
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") doExportRef.current()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [active])

  if (!active && !capturing) return null

  // White capture mask: rendered before the export starts so it hides the
  // brief theme-class toggle that forces light mode in the canvas.
  if (capturing) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 13, color: "#999" }}>Exporting…</span>
      </div>
    )
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, cursor: "crosshair" }}
      onPointerDown={handlePointerDown}
    >
      {/* Dim backdrop before any selection */}
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

      {/* Selection rectangle — box-shadow dims everything outside it */}
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

      {/* Confirm / Cancel buttons — fixed top-center */}
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
