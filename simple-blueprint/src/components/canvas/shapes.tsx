import { useEffect, useRef } from "react"
import type {
  ArrowElement,
  EllipseElement,
  LineElement,
  RectElement,
  TextElement,
} from "@/types/blueprint"
import { PX_PER_METER } from "@/lib/units"
import { sanitizeHtml } from "@/lib/sanitize"
import { useEditor } from "@/store/useEditor"

// All shapes draw in layout pixels (meters * PX_PER_METER). Zoom is applied by
// the parent "world" CSS transform, so px strokes scale uniformly.
const m = (meters: number) => meters * PX_PER_METER

export function RectShape({ el }: { el: RectElement }) {
  const w = m(el.w)
  const h = m(el.h)
  const sw = m(el.strokeWidth)
  return (
    <svg width={w} height={h} style={{ overflow: "visible", display: "block" }}>
      <rect
        x={sw / 2}
        y={sw / 2}
        width={Math.max(0, w - sw)}
        height={Math.max(0, h - sw)}
        fill={el.fill}
        stroke={el.stroke}
        strokeWidth={sw}
      />
    </svg>
  )
}

export function EllipseShape({ el }: { el: EllipseElement }) {
  const w = m(el.rx * 2)
  const h = m(el.ry * 2)
  const sw = m(el.strokeWidth)
  return (
    <svg width={w} height={h} style={{ overflow: "visible", display: "block" }}>
      <ellipse
        cx={w / 2}
        cy={h / 2}
        rx={Math.max(0, w / 2 - sw / 2)}
        ry={Math.max(0, h / 2 - sw / 2)}
        fill={el.fill}
        stroke={el.stroke}
        strokeWidth={sw}
      />
    </svg>
  )
}

function LinearShape({
  el,
  arrow,
}: {
  el: LineElement | ArrowElement
  arrow: boolean
}) {
  const select = useEditor((s) => s.select)
  const minX = Math.min(el.x, el.x2)
  const minY = Math.min(el.y, el.y2)
  const x1 = m(el.x - minX)
  const y1 = m(el.y - minY)
  const x2 = m(el.x2 - minX)
  const y2 = m(el.y2 - minY)
  const sw = m(el.strokeWidth)
  const markerId = `arrow-${el.id}`

  return (
    <svg
      width={Math.max(1, Math.abs(x2 - x1))}
      height={Math.max(1, Math.abs(y2 - y1))}
      style={{ overflow: "visible", display: "block", pointerEvents: "none" }}
    >
      {arrow && (
        <defs>
          <marker
            id={markerId}
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L8,3 L0,6 Z" fill={el.stroke} />
          </marker>
        </defs>
      )}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={el.stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        markerEnd={arrow ? `url(#${markerId})` : undefined}
      />
      {/* fat invisible hit area for easy selection */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="transparent"
        strokeWidth={Math.max(sw, 14)}
        strokeLinecap="round"
        style={{ pointerEvents: "stroke", cursor: "pointer" }}
        onPointerDown={(e) => {
          e.stopPropagation()
          select(el.id)
        }}
      />
    </svg>
  )
}

export function LineShape({ el }: { el: LineElement }) {
  return <LinearShape el={el} arrow={false} />
}

export function ArrowShape({ el }: { el: ArrowElement }) {
  return <LinearShape el={el} arrow={true} />
}

export function TextShape({ el }: { el: TextElement }) {
  const editingId = useEditor((s) => s.editingId)
  const updateElement = useEditor((s) => s.updateElement)
  const pushHistory = useEditor((s) => s.pushHistory)
  const editing = editingId === el.id
  const ref = useRef<HTMLDivElement>(null)

  // Push the stored html into the DOM only when (re)entering edit mode, so we
  // don't clobber the caret on every keystroke.
  useEffect(() => {
    if (editing && ref.current) {
      ref.current.innerHTML = el.html
      ref.current.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  const fontPx = m(el.fontSize)

  const commit = () => {
    if (!ref.current) return
    const clean = sanitizeHtml(ref.current.innerHTML)
    if (clean !== el.html) {
      pushHistory()
      updateElement(el.id, { html: clean })
    }
  }

  return (
    <div
      style={{
        width: m(el.w),
        height: m(el.h),
        fontSize: fontPx,
        lineHeight: 1.2,
        color: el.color,
        background: el.fill === "none" ? "transparent" : el.fill,
        overflow: "hidden",
        padding: fontPx * 0.15,
        boxSizing: "border-box",
        userSelect: editing ? "text" : "none",
        cursor: editing ? "text" : "inherit",
      }}
    >
      {editing ? (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onBlur={commit}
          style={{ outline: "none", width: "100%", height: "100%" }}
        />
      ) : (
        <div dangerouslySetInnerHTML={{ __html: el.html }} />
      )}
    </div>
  )
}
