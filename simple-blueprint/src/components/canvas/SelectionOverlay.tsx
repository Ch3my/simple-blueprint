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
function BoxMoveable({ el }: { el: Element }) {
  const updateElement = useEditor((s) => s.updateElement)
  const pushHistory = useEditor((s) => s.pushHistory)
  const settings = useEditor((s) => s.settings)
  const { zoom, panX, panY } = useViewport()

  const moveableRef = useRef<Moveable>(null)
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const drag = useRef<[number, number]>([0, 0])
  const resize = useRef<{ w: number; h: number; t: [number, number] }>({
    w: 0,
    h: 0,
    t: [0, 0],
  })
  const rotate = useRef(el.rotation)

  // Grab the live DOM node for this element and keep the overlay in sync with
  // store + viewport changes.
  useEffect(() => {
    setTarget(document.querySelector<HTMLElement>(`[data-el-id="${el.id}"]`))
  }, [el.id])

  useEffect(() => {
    moveableRef.current?.updateRect()
  }, [el, zoom, panX, panY])

  if (!target) return null

  const snapEnabled = settings.snapToGrid
  const grid = settings.gridSize

  const commitGeometry = (w: number, h: number, dx: number, dy: number) => {
    const nx = snapM(el.x + toM(dx), snapEnabled, grid)
    const ny = snapM(el.y + toM(dy), snapEnabled, grid)
    const nw = Math.max(grid / 4, snapM(toM(w), snapEnabled, grid))
    const nh = Math.max(grid / 4, snapM(toM(h), snapEnabled, grid))
    if (el.type === "ellipse") {
      updateElement(el.id, { x: nx, y: ny, rx: nw / 2, ry: nh / 2 })
    } else {
      updateElement(el.id, { x: nx, y: ny, w: nw, h: nh })
    }
  }

  return (
    <Moveable
      ref={moveableRef}
      target={target}
      draggable
      resizable
      rotatable
      origin={false}
      throttleDrag={0}
      throttleResize={0}
      throttleRotate={0}
      onDragStart={() => pushHistory()}
      onDrag={({ target: t, transform, translate }) => {
        ;(t as HTMLElement).style.transform = transform
        drag.current = translate as [number, number]
      }}
      onDragEnd={() => {
        const [dx, dy] = drag.current
        if (dx === 0 && dy === 0) return
        const nx = snapM(el.x + toM(dx), snapEnabled, grid)
        const ny = snapM(el.y + toM(dy), snapEnabled, grid)
        updateElement(el.id, { x: nx, y: ny })
        drag.current = [0, 0]
      }}
      onResizeStart={() => pushHistory()}
      onResize={({ target: t, width, height, drag: d }) => {
        const node = t as HTMLElement
        node.style.width = `${width}px`
        node.style.height = `${height}px`
        node.style.transform = d.transform
        resize.current = { w: width, h: height, t: d.translate as [number, number] }
      }}
      onResizeEnd={() => {
        const { w, h, t } = resize.current
        if (w === 0 && h === 0) return
        commitGeometry(w, h, t[0], t[1])
      }}
      onRotateStart={() => pushHistory()}
      onRotate={({ target: t, transform, rotation }) => {
        ;(t as HTMLElement).style.transform = transform
        rotate.current = rotation
      }}
      onRotateEnd={() => {
        updateElement(el.id, { rotation: Math.round(rotate.current) })
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
  if (editingId === el.id) return null // hide handles while editing text
  if (el.type === "line" || el.type === "arrow") return <LineHandles el={el} />
  return <BoxMoveable el={el} />
}
