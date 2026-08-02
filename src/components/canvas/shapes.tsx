import type {
  ArrowElement,
  DoorElement,
  EllipseElement,
  LabelColor,
  LineElement,
  RectElement,
  StairsElement,
  TextElement,
} from "@/types/blueprint"
import { PX_PER_METER } from "@/lib/units"
import { sanitizeHtml } from "@/lib/sanitize"
import { useSyncedContentEditable } from "@/hooks/useSyncedContentEditable"
import { useEditor } from "@/store/useEditor"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const LABEL_CLASSES: Record<LabelColor, string> = {
  gray:   "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  green:  "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  sky:    "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  purple: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  red:    "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
}

// All shapes draw in layout pixels (meters * PX_PER_METER). Zoom is applied by
// the parent "world" CSS transform, so px strokes scale uniformly.
const m = (meters: number) => meters * PX_PER_METER

// Dash pattern scaled to the stroke width (so it looks right at any thickness).
function dashArray(el: {
  strokeStyle?: "solid" | "dashed"
  strokeWidth: number
}): string | undefined {
  if (el.strokeStyle !== "dashed") return undefined
  const sw = m(el.strokeWidth)
  return `${sw * 2.5} ${sw * 2}`
}

export function RectShape({ el }: { el: RectElement }) {
  const sw = m(el.strokeWidth)

  if (el.hatching) {
    const w = m(el.w)
    const h = m(el.h)
    const spacing = m(el.hatchSpacing ?? 0.1)
    const patternId = `hatch-${el.id}`
    return (
      <svg width={w} height={h} style={{ overflow: "visible", display: "block" }}>
        <defs>
          <pattern id={patternId} patternUnits="userSpaceOnUse" width={spacing} height={spacing}>
            <line x1={0} y1={spacing} x2={spacing} y2={0} stroke={el.stroke} strokeWidth={1} />
          </pattern>
        </defs>
        {el.fill !== "none" && <rect x={0} y={0} width={w} height={h} fill={el.fill} />}
        <rect
          x={0} y={0} width={w} height={h}
          fill={`url(#${patternId})`}
          stroke={el.stroke}
          strokeWidth={sw}
          vectorEffect="non-scaling-stroke"
          strokeDasharray={dashArray(el)}
        />
      </svg>
    )
  }

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ overflow: "visible", display: "block" }}
    >
      <rect
        x={0}
        y={0}
        width={100}
        height={100}
        fill={el.fill}
        stroke={el.stroke}
        strokeWidth={sw}
        vectorEffect="non-scaling-stroke"
        strokeDasharray={dashArray(el)}
      />
    </svg>
  )
}

export function EllipseShape({ el }: { el: EllipseElement }) {
  const sw = m(el.strokeWidth)

  if (el.hatching) {
    const rx = m(el.rx)
    const ry = m(el.ry)
    const spacing = m(el.hatchSpacing ?? 0.1)
    const patternId = `hatch-${el.id}`
    return (
      <svg width={rx * 2} height={ry * 2} style={{ overflow: "visible", display: "block" }}>
        <defs>
          <pattern id={patternId} patternUnits="userSpaceOnUse" width={spacing} height={spacing}>
            <line x1={0} y1={spacing} x2={spacing} y2={0} stroke={el.stroke} strokeWidth={1} />
          </pattern>
        </defs>
        {el.fill !== "none" && <ellipse cx={rx} cy={ry} rx={rx} ry={ry} fill={el.fill} />}
        <ellipse
          cx={rx} cy={ry} rx={rx} ry={ry}
          fill={`url(#${patternId})`}
          stroke={el.stroke}
          strokeWidth={sw}
          vectorEffect="non-scaling-stroke"
          strokeDasharray={dashArray(el)}
        />
      </svg>
    )
  }

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ overflow: "visible", display: "block" }}
    >
      <ellipse
        cx={50}
        cy={50}
        rx={50}
        ry={50}
        fill={el.fill}
        stroke={el.stroke}
        strokeWidth={sw}
        vectorEffect="non-scaling-stroke"
        strokeDasharray={dashArray(el)}
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
  const viewLock = useEditor((s) => s.viewLock)
  const minX = Math.min(el.x, el.x2)
  const minY = Math.min(el.y, el.y2)
  const x1 = m(el.x - minX)
  const y1 = m(el.y - minY)
  const x2 = m(el.x2 - minX)
  const y2 = m(el.y2 - minY)
  const sw = m(el.strokeWidth)
  const markerId = `arrow-${el.id}`

  const showTicks = !arrow && (el as LineElement).ticks
  const tickLines = (() => {
    if (!showTicks) return null
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len === 0) return null
    const px = (-dy / len) * sw * 5
    const py = (dx / len) * sw * 5
    return (
      <>
        <line x1={x1 - px} y1={y1 - py} x2={x1 + px} y2={y1 + py}
          stroke={el.stroke} strokeWidth={sw} strokeLinecap="round" />
        <line x1={x2 - px} y1={y2 - py} x2={x2 + px} y2={y2 + py}
          stroke={el.stroke} strokeWidth={sw} strokeLinecap="round" />
      </>
    )
  })()

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
        strokeDasharray={dashArray(el)}
        markerEnd={arrow ? `url(#${markerId})` : undefined}
      />
      {tickLines}
      {/* fat invisible hit area for easy selection */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="transparent"
        strokeWidth={Math.max(sw, 14)}
        strokeLinecap="round"
        style={{
          pointerEvents: el.locked || viewLock ? "none" : "stroke",
          cursor: "pointer",
        }}
        onPointerDown={(e) => {
          e.stopPropagation()
          select(el.id)
        }}
      />
    </svg>
  )
}

export function DoorShape({ el }: { el: DoorElement }) {
  const W = m(el.w)
  const H = m(el.h)
  const sw = m(el.strokeWidth)
  const flip = el.flipX ? `translate(${W}, 0) scale(-1, 1)` : undefined

  return (
    <svg width={W} height={H} style={{ overflow: "visible", display: "block" }}>
      <path
        d={`M 0,0 L ${W},0 A ${W},${H} 0 0,1 0,${H}`}
        transform={flip}
        fill="none"
        stroke={el.stroke}
        strokeWidth={sw}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashArray(el)}
      />
    </svg>
  )
}

export function StairsShape({ el }: { el: StairsElement }) {
  const W = m(el.w)
  const H = m(el.h)
  const sw = m(el.strokeWidth)
  const steps = Math.max(1, el.steps ?? 5)

  const hLines = Array.from({ length: steps + 1 }, (_, i) => {
    const y = (i / steps) * H
    return <line key={i} x1={0} y1={y} x2={W} y2={y} />
  })

  return (
    <svg width={W} height={H} style={{ overflow: "visible", display: "block" }}>
      <g
        stroke={el.stroke}
        strokeWidth={sw}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="square"
        strokeDasharray={dashArray(el)}
      >
        <line x1={0} y1={0} x2={0} y2={H} />
        <line x1={W} y1={0} x2={W} y2={H} />
        {hLines}
      </g>
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
  const setEditing = useEditor((s) => s.setEditing)
  const editing = editingId === el.id
  const ref = useSyncedContentEditable(el.html, {
    active: editing,
    focusOnMount: true,
  })

  const fontPx = m(el.fontSize)

  const commit = () => {
    if (!ref.current) return
    const clean = sanitizeHtml(ref.current.innerHTML)
    if (clean !== el.html) {
      updateElement(el.id, { html: clean })
    }
  }

  // Enter accepts the edit; Shift+Enter falls through to insert a line break.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      commit()
      setEditing(null)
    }
  }

  if (el.labelMode) {
    const colorClass = LABEL_CLASSES[el.labelColor ?? "gray"]
    return (
      <div
        style={{
          width: m(el.w),
          height: m(el.h),
          display: "flex",
          alignItems: "center",
          userSelect: editing ? "text" : "none",
          cursor: editing ? "text" : "inherit",
        }}
      >
        <Badge
          className={cn(colorClass, "h-auto border-0")}
          style={{ fontSize: fontPx, padding: `${fontPx * 0.25}px ${fontPx * 0.6}px`, borderRadius: "9999px" }}
        >
          {editing ? (
            <div
              ref={ref}
              contentEditable
              suppressContentEditableWarning
              onBlur={commit}
              onKeyDown={onKeyDown}
              style={{ outline: "none", minWidth: "1ch" }}
            />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: el.html }} />
          )}
        </Badge>
      </div>
    )
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
          onKeyDown={onKeyDown}
          style={{ outline: "none", width: "100%", height: "100%" }}
        />
      ) : (
        <div dangerouslySetInnerHTML={{ __html: el.html }} />
      )}
    </div>
  )
}
