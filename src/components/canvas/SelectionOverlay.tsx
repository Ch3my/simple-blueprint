import { useEffect, useRef, useState } from "react"
import Moveable from "react-moveable"
import type { Element, ArrowElement, LineElement } from "@/types/blueprint"
import { PX_PER_METER } from "@/lib/units"
import { snap } from "@/lib/geometry"
import { useEditor } from "@/store/useEditor"
import { useViewport } from "@/store/useViewport"

const toM = (px: number) => px / PX_PER_METER

function snapM(v: number, enabled: boolean, grid: number): number {
  return enabled ? snap(v, grid) : v
}

/** Transform handles for rectangle / ellipse / text via react-moveable. */
function BoxMoveable({ el, editing = false }: { el: Element; editing?: boolean }) {
  const updateElement = useEditor((s) => s.updateElement)
  const pushHistory = useEditor((s) => s.pushHistory)
  const settings = useEditor((s) => s.settings)
  const { zoom, panX, panY } = useViewport()

  const moveableRef = useRef<Moveable>(null)
  const [target, setTarget] = useState<HTMLElement | null>(null)
  // Element geometry captured at gesture start (Moveable reports absolute
  // translate/size relative to this).
  const start = useRef({ x: 0, y: 0 })
  const resize = useRef({ w: 0, h: 0, t: [0, 0] as [number, number] })
  const gesturing = useRef(false)

  // Grab the live DOM node for this element and keep the overlay in sync with
  // store + viewport changes.
  useEffect(() => {
    setTarget(document.querySelector<HTMLElement>(`[data-el-id="${el.id}"]`))
  }, [el.id])

  useEffect(() => {
    // Skip while a gesture is live; Moveable already tracks the box itself, and
    // re-measuring mid-drag makes the control box jitter.
    if (!gesturing.current) moveableRef.current?.updateRect()
  }, [el, zoom, panX, panY])

  if (!target) return null

  const snapEnabled = settings.snapToGrid
  const grid = settings.gridSize

  // Controlled transforms: we never mutate the DOM directly. Every gesture
  // writes the new geometry straight to the store, so React positions the
  // element and the dimension labels stay glued to it during the drag.
  return (
    <Moveable
      ref={moveableRef}
      target={target}
      draggable={!editing}
      resizable={!editing}
      rotatable={!editing}
      origin={false}
      throttleDrag={0}
      throttleResize={0}
      throttleRotate={0}
      onDragStart={() => {
        gesturing.current = true
        pushHistory()
        start.current = { x: el.x, y: el.y }
      }}
      onDrag={({ translate }) => {
        const nx = snapM(start.current.x + toM(translate[0]), snapEnabled, grid)
        const ny = snapM(start.current.y + toM(translate[1]), snapEnabled, grid)
        updateElement(el.id, { x: nx, y: ny })
      }}
      onDragEnd={() => {
        gesturing.current = false
      }}
      onResizeStart={() => {
        gesturing.current = true
        pushHistory()
        start.current = { x: el.x, y: el.y }
        resize.current = { w: 0, h: 0, t: [0, 0] }
      }}
      onResize={({ target: t, width, height, drag: d }) => {
        const node = t as HTMLElement
        node.style.width = `${width}px`
        node.style.height = `${height}px`
        node.style.transform = d.transform
        resize.current = { w: width, h: height, t: d.translate as [number, number] }
      }}
      onResizeEnd={({ target: t }) => {
        gesturing.current = false
        const { w, h, t: tr } = resize.current
        if (w === 0 && h === 0) return
        const nx = snapM(start.current.x + toM(tr[0]), snapEnabled, grid)
        const ny = snapM(start.current.y + toM(tr[1]), snapEnabled, grid)
        const nw = Math.max(grid / 4, snapM(toM(w), snapEnabled, grid))
        const nh = Math.max(grid / 4, snapM(toM(h), snapEnabled, grid))
        if (el.type === "ellipse") {
          updateElement(el.id, { x: nx, y: ny, rx: nw / 2, ry: nh / 2 })
        } else {
          updateElement(el.id, { x: nx, y: ny, w: nw, h: nh })
        }
        // onResize wrote a translate+rotate transform directly to the DOM node.
        // React won't overwrite it on re-render if el.rotation didn't change
        // (same vDOM value → skipped), leaving a stale translate. Write the
        // correct final transform directly so it's always consistent.
        ;(t as HTMLElement).style.transform = el.rotation ? `rotate(${el.rotation}deg)` : ""
      }}
      onRotateStart={() => {
        gesturing.current = true
        pushHistory()
      }}
      onRotate={({ rotation }) => {
        updateElement(el.id, { rotation: Math.round(rotation) })
      }}
      onRotateEnd={() => {
        gesturing.current = false
      }}
    />
  )
}

/** Draggable endpoint + midpoint handles for line / arrow. */
function LineHandles({ el }: { el: LineElement | ArrowElement }) {
  const updateElement = useEditor((s) => s.updateElement)
  const pushHistory = useEditor((s) => s.pushHistory)
  const settings = useEditor((s) => s.settings)
  const { zoom, panX, panY } = useViewport()

  const toScreen = (mx: number, my: number) => ({
    sx: mx * PX_PER_METER * zoom + panX,
    sy: my * PX_PER_METER * zoom + panY,
  })

  const startDrag = (
    e: React.PointerEvent,
    handle: "start" | "end" | "mid",
  ) => {
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    pushHistory()
    const origin = { x: el.x, y: el.y, x2: el.x2, y2: el.y2 }
    const sx0 = e.clientX
    const sy0 = e.clientY
    const snapEnabled = settings.snapToGrid
    const grid = settings.gridSize

    const onMove = (ev: PointerEvent) => {
      const dmx = (ev.clientX - sx0) / (PX_PER_METER * zoom)
      const dmy = (ev.clientY - sy0) / (PX_PER_METER * zoom)
      const sp = (v: number) => (snapEnabled ? snap(v, grid) : v)
      if (handle === "start") {
        updateElement(el.id, { x: sp(origin.x + dmx), y: sp(origin.y + dmy) })
      } else if (handle === "end") {
        updateElement(el.id, { x2: sp(origin.x2 + dmx), y2: sp(origin.y2 + dmy) })
      } else {
        updateElement(el.id, {
          x: sp(origin.x + dmx),
          y: sp(origin.y + dmy),
          x2: sp(origin.x2 + dmx),
          y2: sp(origin.y2 + dmy),
        })
      }
    }
    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  const a = toScreen(el.x, el.y)
  const b = toScreen(el.x2, el.y2)
  const mid = toScreen((el.x + el.x2) / 2, (el.y + el.y2) / 2)

  const handleStyle = (sx: number, sy: number, color: string): React.CSSProperties => ({
    position: "absolute",
    left: sx - 6,
    top: sy - 6,
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: color,
    border: "2px solid white",
    boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
    cursor: "move",
    touchAction: "none",
  })

  return (
    <>
      <div
        style={handleStyle(mid.sx, mid.sy, "var(--muted-foreground)")}
        onPointerDown={(e) => startDrag(e, "mid")}
      />
      <div
        style={handleStyle(a.sx, a.sy, "var(--primary)")}
        onPointerDown={(e) => startDrag(e, "start")}
      />
      <div
        style={handleStyle(b.sx, b.sy, "var(--primary)")}
        onPointerDown={(e) => startDrag(e, "end")}
      />
    </>
  )
}

export function SelectionOverlay() {
  const selectedId = useEditor((s) => s.selectedId)
  const editingId = useEditor((s) => s.editingId)
  const el = useEditor((s) => s.elements.find((e) => e.id === selectedId))

  if (!el) return null
  if (el.type === "line" || el.type === "arrow") {
    return (
      <div data-export-hide style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
        <LineHandles el={el} />
      </div>
    )
  }
  return <BoxMoveable el={el} editing={editingId === el.id} />
}
