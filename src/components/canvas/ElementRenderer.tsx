import type { CSSProperties } from "react"
import type { Element } from "@/types/blueprint"
import { PX_PER_METER } from "@/lib/units"
import { elementBox } from "@/lib/geometry"
import { useEditor } from "@/store/useEditor"
import {
  ArrowShape,
  EllipseShape,
  LineShape,
  RectShape,
  TextShape,
} from "./shapes"

function ShapeBody({ el }: { el: Element }) {
  switch (el.type) {
    case "rectangle":
      return <RectShape el={el} />
    case "ellipse":
      return <EllipseShape el={el} />
    case "line":
      return <LineShape el={el} />
    case "arrow":
      return <ArrowShape el={el} />
    case "text":
      return <TextShape el={el} />
  }
}

export function ElementRenderer({ el }: { el: Element }) {
  const select = useEditor((s) => s.select)
  const setEditing = useEditor((s) => s.setEditing)
  const selectedId = useEditor((s) => s.selectedId)
  const editingId = useEditor((s) => s.editingId)

  const box = elementBox(el)
  const isBoxShape = el.type !== "line" && el.type !== "arrow"
  const selected = selectedId === el.id

  const style: CSSProperties = {
    position: "absolute",
    left: box.x * PX_PER_METER,
    top: box.y * PX_PER_METER,
    width: isBoxShape ? box.w * PX_PER_METER : 0,
    height: isBoxShape ? box.h * PX_PER_METER : 0,
    transform: isBoxShape ? `rotate(${el.rotation}deg)` : undefined,
    transformOrigin: "center center",
    // Box shapes are clickable across their whole bounds; lines manage their
    // own hit area inside the SVG.
    pointerEvents: isBoxShape ? "auto" : "none",
    touchAction: "none",
    zIndex: el.z,
    cursor: selected ? "move" : "pointer",
  }

  const editing = editingId === el.id

  return (
    <div
      data-el-id={el.id}
      style={style}
      onPointerDown={(e) => {
        if (!isBoxShape) return
        if (editing) return // let text editing receive the pointer
        e.stopPropagation()
        select(el.id)
      }}
      onDoubleClick={(e) => {
        if (el.type === "text") {
          e.stopPropagation()
          select(el.id)
          setEditing(el.id)
        }
      }}
    >
      <ShapeBody el={el} />
    </div>
  )
}
